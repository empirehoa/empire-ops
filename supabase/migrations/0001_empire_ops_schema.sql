-- Empire Ops schema.
-- Single organization (Riance LLC). Every table has RLS enabled with no
-- policies: browsers can never read it directly. The app reads and writes
-- server-side with the service role, after checking the admin allowlist.

create extension if not exists pgcrypto;

-- The four Riance LLC businesses. qbo_realm_id links each to its QuickBooks company file.
create table companies (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  qbo_realm_id  text unique,
  created_at    timestamptz not null default now()
);

insert into companies (slug, name) values
  ('empire',        'Empire Management Group'),
  ('riance-realty', 'Riance Realty'),
  ('wfw',           'Wind Fire & Water'),
  ('fixiq',         'FixIQ');

-- Managed associations, imported from Vantaca exports.
-- is_test implements the Vantaca dummy-data gate: test/practice associations
-- are kept but excluded from every portfolio figure.
create table communities (
  id                      uuid primary key default gen_random_uuid(),
  vantaca_id              text not null unique,
  name                    text not null,
  community_type          text,
  city                    text,
  county                  text,
  portfolio               text,
  manager_name            text,
  doors                   integer check (doors is null or doors >= 0),
  monthly_management_fee  numeric(12,2),
  status                  text not null default 'active',
  is_test                 boolean not null default false,
  first_seen_at           timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- AR aging per association per export date (one snapshot per day).
create table ar_aging_snapshots (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references communities(id) on delete cascade,
  as_of         date not null,
  current_due   numeric(14,2) not null default 0,
  days_30       numeric(14,2) not null default 0,
  days_60       numeric(14,2) not null default 0,
  days_90_plus  numeric(14,2) not null default 0,
  total         numeric(14,2) not null default 0,
  imported_at   timestamptz not null default now(),
  unique (community_id, as_of)
);

-- Vantaca action items (XN numbers): violations, work orders, ARC, collections, etc.
create table action_items (
  id                uuid primary key default gen_random_uuid(),
  xn                text not null unique,
  community_id      uuid references communities(id) on delete set null,
  category          text,
  item_type         text,
  step              text,
  status            text,
  opened_on         date,
  closed_on         date,
  days_open         integer,
  assigned_to       text,
  last_imported_at  timestamptz not null default now()
);
create index action_items_community_idx on action_items (community_id);
create index action_items_open_idx on action_items (closed_on) where closed_on is null;

-- HubSpot deals (sales pipeline for new management contracts).
create table crm_deals (
  id                  uuid primary key default gen_random_uuid(),
  hubspot_id          text not null unique,
  name                text not null,
  pipeline_id         text,
  pipeline_label      text,
  stage_id            text,
  stage_label         text,
  stage_probability   numeric(5,4),
  is_closed           boolean not null default false,
  is_won              boolean not null default false,
  amount              numeric(14,2),
  close_date          date,
  owner_id            text,
  owner_name          text,
  created_at_source   timestamptz,
  updated_at_source   timestamptz,
  stage_entered_at    timestamptz,
  synced_at           timestamptz not null default now()
);
create index crm_deals_open_idx on crm_deals (is_closed, updated_at_source);

-- QuickBooks reports per company and period. raw keeps the full report.
create table financial_reports (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  report_type    text not null check (report_type in ('profit_and_loss','balance_sheet','ar_aging')),
  period_start   date not null,
  period_end     date not null,
  total_income   numeric(14,2),
  total_expenses numeric(14,2),
  net_income     numeric(14,2),
  cash           numeric(14,2),
  ar_total       numeric(14,2),
  raw            jsonb not null,
  fetched_at     timestamptz not null default now(),
  unique (company_id, report_type, period_start, period_end)
);

-- OAuth tokens (QuickBooks). Token columns hold AES-GCM ciphertext,
-- never plaintext; the key lives only in TOKEN_ENCRYPTION_KEY.
create table oauth_connections (
  id                  uuid primary key default gen_random_uuid(),
  provider            text not null check (provider in ('quickbooks')),
  company_id          uuid not null references companies(id) on delete cascade,
  realm_id            text not null,
  access_token_enc    text not null,
  refresh_token_enc   text not null,
  access_expires_at   timestamptz not null,
  refresh_expires_at  timestamptz,
  connected_by        text,
  updated_at          timestamptz not null default now(),
  unique (provider, company_id)
);

-- One row per sync or import run, for freshness reporting.
create table sync_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  company_id    uuid references companies(id) on delete set null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running' check (status in ('running','succeeded','failed')),
  rows_written  integer not null default 0,
  detail        jsonb,
  error         text
);
create index sync_runs_source_idx on sync_runs (source, started_at desc);

-- One row per agent run; the dashboards read findings from here.
create table agent_runs (
  id           uuid primary key default gen_random_uuid(),
  agent        text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running','succeeded','failed','skipped')),
  headline     text,
  metrics      jsonb,
  findings     jsonb,
  error        text
);
create index agent_runs_agent_idx on agent_runs (agent, started_at desc);

alter table companies          enable row level security;
alter table communities        enable row level security;
alter table ar_aging_snapshots enable row level security;
alter table action_items       enable row level security;
alter table crm_deals          enable row level security;
alter table financial_reports  enable row level security;
alter table oauth_connections  enable row level security;
alter table sync_runs          enable row level security;
alter table agent_runs         enable row level security;
