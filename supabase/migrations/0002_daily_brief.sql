-- Daily brief: one JSON document per day, computed in the database from the
-- synced tables. The daily routine and the app both read this function, so
-- every number has one definition. Rules match src/lib/intelligence/pipeline.ts:
--   stale       = open deal with no HubSpot update for 14+ days
--   win rate    = closed deals whose close date is in the trailing 365 days
--   weighted    = amount x stage probability (deals missing either are counted, not guessed)
-- Missing data stays null. Test associations (communities.is_test) are excluded.

create table daily_briefs (
  as_of       date primary key,
  brief       jsonb not null,
  created_at  timestamptz not null default now()
);
alter table daily_briefs enable row level security;

create or replace function ops_daily_brief(p_now timestamptz default now())
returns jsonb
language sql
stable
set search_path = public
as $$
with
open_deals as (
  select * from crm_deals where not is_closed
),
flagged as (
  select d.*,
    (d.updated_at_source is not null and d.updated_at_source < p_now - interval '14 days') as is_stale,
    (d.close_date is not null and d.close_date < p_now::date) as is_overdue,
    (p_now::date - d.updated_at_source::date) as days_since_update,
    (p_now::date - d.stage_entered_at::date) as days_in_stage
  from open_deals d
),
closed_window as (
  select * from crm_deals
  where is_closed and close_date is not null
    and close_date > (p_now - interval '365 days')::date and close_date <= p_now::date
),
pl as (
  select distinct on (company_id) company_id, period_start, period_end, total_income, net_income, raw, fetched_at
  from financial_reports where report_type = 'profit_and_loss'
  order by company_id, period_end desc
),
bs as (
  select distinct on (company_id) company_id, period_end, cash, ar_total, raw, fetched_at
  from financial_reports where report_type = 'balance_sheet'
  order by company_id, period_end desc
),
ar as (
  select distinct on (company_id) company_id, period_end, ar_total, raw, fetched_at
  from financial_reports where report_type = 'ar_aging'
  order by company_id, period_end desc
),
last_sync as (
  select distinct on (source) source, finished_at, rows_written, detail
  from sync_runs where status = 'succeeded'
  order by source, finished_at desc
)
select jsonb_build_object(
  'as_of', p_now,
  'pipeline', (
    select jsonb_build_object(
      'open_count', count(*),
      'open_value', coalesce(sum(amount), 0),
      'weighted_value', coalesce(sum(amount * stage_probability), 0),
      'open_missing_amount', count(*) filter (where amount is null),
      'stale_count', count(*) filter (where is_stale),
      'stale_value', coalesce(sum(amount) filter (where is_stale), 0),
      'overdue_count', count(*) filter (where is_overdue),
      'overdue_value', coalesce(sum(amount) filter (where is_overdue), 0),
      'new_7d', (select count(*) from crm_deals where created_at_source >= p_now - interval '7 days'),
      'new_30d', (select count(*) from crm_deals where created_at_source >= p_now - interval '30 days'),
      'new_30d_value', (select coalesce(sum(amount), 0) from crm_deals where created_at_source >= p_now - interval '30 days')
    ) from flagged
  ),
  'by_stage', (
    select coalesce(jsonb_agg(s order by s.sort), '[]'::jsonb) from (
      select stage_label as stage, min(stage_probability) as probability, count(*) as count,
             coalesce(sum(amount), 0) as value,
             case stage_label when 'Discovery Call/Visit' then 1 when 'Proposal Sent' then 2
               when 'Presentation Complete' then 3 when 'Contract Sent' then 4 else 9 end as sort
      from open_deals group by stage_label
    ) s
  ),
  'win_rate', (
    select jsonb_build_object(
      'window_days', 365,
      'closed_count', count(*),
      'won_count', count(*) filter (where is_won),
      'by_count', case when count(*) > 0 then round(count(*) filter (where is_won)::numeric / count(*), 4) end,
      'closed_value', coalesce(sum(amount), 0),
      'won_value', coalesce(sum(amount) filter (where is_won), 0),
      'by_value', case when coalesce(sum(amount), 0) > 0
        then round(coalesce(sum(amount) filter (where is_won), 0) / sum(amount), 4) end
    ) from closed_window
  ),
  'attention', (
    select coalesce(jsonb_agg(a order by a.amount desc nulls last, a.days_since_update desc), '[]'::jsonb) from (
      select hubspot_id, name, stage_label as stage, owner_name as owner, amount, close_date,
             days_since_update, days_in_stage, is_stale, is_overdue
      from flagged where is_stale or is_overdue
      order by amount desc nulls last limit 25
    ) a
  ),
  'recent_wins', (
    select coalesce(jsonb_agg(w order by w.close_date desc), '[]'::jsonb) from (
      select hubspot_id, name, amount, close_date, owner_name as owner
      from crm_deals where is_won and close_date >= (p_now - interval '120 days')::date
      order by close_date desc limit 10
    ) w
  ),
  'new_deals', (
    select coalesce(jsonb_agg(n order by n.created desc), '[]'::jsonb) from (
      select hubspot_id, name, stage_label as stage, amount, owner_name as owner, created_at_source::date as created
      from crm_deals where created_at_source >= p_now - interval '30 days'
      order by created_at_source desc limit 15
    ) n
  ),
  'finance', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'company', c.name, 'slug', c.slug,
      'pl', case when pl.company_id is null then null else jsonb_build_object(
        'period_start', pl.period_start, 'period_end', pl.period_end,
        'total_income', pl.total_income, 'net_income', pl.net_income,
        'management_fee', pl.raw->'management_fee', 'note', pl.raw->'note') end,
      'balance_sheet', case when bs.company_id is null then null else jsonb_build_object(
        'as_of', bs.period_end, 'cash', bs.cash, 'ar', bs.ar_total,
        'working_capital', bs.raw->'working_capital', 'credit_cards', bs.raw->'credit_cards',
        'total_assets', bs.raw->'total_assets', 'total_liabilities', bs.raw->'total_liabilities',
        'total_equity', bs.raw->'total_equity', 'net_income_ytd', bs.raw->'net_income_ytd') end,
      'ar_aging', case when ar.company_id is null then null else jsonb_build_object(
        'as_of', ar.period_end, 'total', ar.ar_total, 'overdue', ar.raw->'overdue') end
    ) order by case c.slug when 'empire' then 1 when 'riance-realty' then 2 when 'wfw' then 3 else 4 end), '[]'::jsonb)
    from companies c
    left join pl on pl.company_id = c.id
    left join bs on bs.company_id = c.id
    left join ar on ar.company_id = c.id
  ),
  'portfolio', jsonb_build_object(
    'communities', (select count(*) from communities where not is_test),
    'test_excluded', (select count(*) from communities where is_test),
    'doors', (select sum(doors) from communities where not is_test),
    'open_action_items', (select count(*) from action_items ai join communities c on c.id = ai.community_id
                          where ai.closed_on is null and not c.is_test)
  ),
  'sources', (
    select coalesce(jsonb_object_agg(source, jsonb_build_object('finished_at', finished_at, 'rows', rows_written)), '{}'::jsonb)
    from last_sync
  )
);
$$;

revoke all on function ops_daily_brief(timestamptz) from public, anon, authenticated;
