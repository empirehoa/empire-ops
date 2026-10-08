-- Ingest functions used by the daily routine (Claude with the HubSpot,
-- QuickBooks and Supabase connectors). Each call records a sync_runs row,
-- so "data as of" stays accurate whichever path loaded the data.

-- Deals: p_deals is an array of
--   [hubspot_id, name, pipeline_id, stage_id, amount, close_date, owner_id,
--    created_at, updated_at, stage_entered_at]
-- p_pipelines is HubSpot's GET_PIPELINES "results" array; p_owners is
-- [{ownerId, name}]. Stage labels and probabilities come from p_pipelines.
create or replace function ops_ingest_deals(p_deals jsonb, p_pipelines jsonb, p_owners jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_run uuid;
  v_rows integer;
begin
  insert into sync_runs (source, status, detail)
  values ('hubspot', 'running', jsonb_build_object('via', 'claude routine (HubSpot connector)'))
  returning id into v_run;

  with stages as (
    select s->>'id' as id, s->>'label' as label, (s->'metadata'->>'probability')::numeric as prob,
           p->>'label' as pipeline_label
    from jsonb_array_elements(p_pipelines) p, jsonb_array_elements(p->'stages') s
  ),
  owners as (
    select o->>'ownerId' as id, nullif(trim(o->>'name'), '') as name
    from jsonb_array_elements(p_owners) o
  ),
  src as (
    select e->>0 as hid, trim(e->>1) as nm, e->>2 as pid, e->>3 as sid,
           nullif(e->>4, '')::numeric as amt, nullif(e->>5, '')::date as cd, e->>6 as oid,
           nullif(e->>7, '')::timestamptz as ca, nullif(e->>8, '')::timestamptz as ua,
           nullif(e->>9, '')::timestamptz as sa
    from jsonb_array_elements(p_deals) e
  ),
  up as (
    insert into crm_deals (hubspot_id, name, pipeline_id, pipeline_label, stage_id, stage_label,
      stage_probability, is_closed, is_won, amount, close_date, owner_id, owner_name,
      created_at_source, updated_at_source, stage_entered_at, synced_at)
    select s.hid, s.nm, s.pid, st.pipeline_label, s.sid, st.label, st.prob,
           coalesce(st.label in ('Closed Won', 'Closed Lost'), false), coalesce(st.label = 'Closed Won', false),
           round(s.amt, 2), s.cd, s.oid, o.name, s.ca, s.ua, s.sa, now()
    from src s left join stages st on st.id = s.sid left join owners o on o.id = s.oid
    on conflict (hubspot_id) do update set
      name = excluded.name, pipeline_id = excluded.pipeline_id, pipeline_label = excluded.pipeline_label,
      stage_id = excluded.stage_id, stage_label = excluded.stage_label,
      stage_probability = excluded.stage_probability, is_closed = excluded.is_closed, is_won = excluded.is_won,
      amount = excluded.amount, close_date = excluded.close_date, owner_id = excluded.owner_id,
      owner_name = excluded.owner_name, created_at_source = excluded.created_at_source,
      updated_at_source = excluded.updated_at_source, stage_entered_at = excluded.stage_entered_at,
      synced_at = now()
    returning 1
  )
  select count(*) into v_rows from up;

  update sync_runs set status = 'succeeded', finished_at = now(), rows_written = v_rows where id = v_run;
  return jsonb_build_object('rows', v_rows);
end;
$$;

-- One QuickBooks report for one company. Figures are stored exactly as the
-- report states them; pass null for anything the report did not state.
create or replace function ops_ingest_financial(
  p_company_slug text, p_report_type text, p_period_start date, p_period_end date,
  p_total_income numeric, p_net_income numeric, p_cash numeric, p_ar_total numeric, p_raw jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_company uuid;
begin
  select id into v_company from companies where slug = p_company_slug;
  if v_company is null then
    raise exception 'Unknown company slug %', p_company_slug;
  end if;

  insert into financial_reports (company_id, report_type, period_start, period_end,
    total_income, net_income, cash, ar_total, raw)
  values (v_company, p_report_type, p_period_start, p_period_end,
    p_total_income, p_net_income, p_cash, p_ar_total,
    coalesce(p_raw, '{}'::jsonb) || jsonb_build_object('via', 'claude routine (QuickBooks connector)'))
  on conflict (company_id, report_type, period_start, period_end) do update set
    total_income = excluded.total_income, net_income = excluded.net_income,
    cash = excluded.cash, ar_total = excluded.ar_total, raw = excluded.raw, fetched_at = now();

  insert into sync_runs (source, company_id, status, finished_at, rows_written, detail)
  values ('quickbooks', v_company, 'succeeded', now(), 1,
    jsonb_build_object('via', 'claude routine (QuickBooks connector)', 'report', p_report_type));
  return jsonb_build_object('ok', true);
end;
$$;

-- Records a source that could not be read, so the brief shows it as stale
-- instead of silently reusing old numbers as if they were fresh.
create or replace function ops_record_failure(p_source text, p_error text)
returns void
language sql
set search_path = public
as $$
  insert into sync_runs (source, status, finished_at, error) values (p_source, 'failed', now(), left(p_error, 500));
$$;

-- Computes today's brief, stores it, and returns it. "failures" lists sources
-- whose latest attempt failed after their last success, so the page can say so.
create or replace function ops_publish_brief()
returns jsonb
language sql
set search_path = public
as $$
  insert into daily_briefs (as_of, brief)
  values ((now() at time zone 'America/New_York')::date,
    ops_daily_brief() || jsonb_build_object('failures', (
      select coalesce(jsonb_agg(jsonb_build_object('source', f.source, 'at', f.finished_at, 'error', f.error)), '[]'::jsonb)
      from (select distinct on (source) source, finished_at, error, status from sync_runs
            where status in ('succeeded', 'failed') order by source, finished_at desc) f
      where f.status = 'failed')))
  on conflict (as_of) do update set brief = excluded.brief, created_at = now()
  returning brief;
$$;

revoke all on function ops_ingest_deals(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function ops_ingest_financial(text, text, date, date, numeric, numeric, numeric, numeric, jsonb) from public, anon, authenticated;
revoke all on function ops_record_failure(text, text) from public, anon, authenticated;
revoke all on function ops_publish_brief() from public, anon, authenticated;
