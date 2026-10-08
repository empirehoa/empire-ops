// Types for the empire-ops schema (supabase/migrations/0001_empire_ops_schema.sql).
// Regenerate with `supabase gen types typescript` once the project exists;
// until then this file is the source of truth and must match the migration.

type Rel<FK extends string, Cols extends string[], Ref extends string> = {
  foreignKeyName: FK
  columns: Cols
  isOneToOne: false
  referencedRelation: Ref
  referencedColumns: ['id']
}

type Table<Row, Required extends keyof Row, Relationships extends unknown[] = []> = {
  Row: Row
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>
  Update: Partial<Row>
  Relationships: Relationships
}

export type CompanyRow = {
  id: string
  slug: string
  name: string
  qbo_realm_id: string | null
  created_at: string
}

export type CommunityRow = {
  id: string
  vantaca_id: string
  name: string
  community_type: string | null
  city: string | null
  county: string | null
  portfolio: string | null
  manager_name: string | null
  doors: number | null
  monthly_management_fee: number | null
  status: string
  is_test: boolean
  first_seen_at: string
  updated_at: string
}

export type ArAgingSnapshotRow = {
  id: string
  community_id: string
  as_of: string
  current_due: number
  days_30: number
  days_60: number
  days_90_plus: number
  total: number
  imported_at: string
}

export type ActionItemRow = {
  id: string
  xn: string
  community_id: string | null
  category: string | null
  item_type: string | null
  step: string | null
  status: string | null
  opened_on: string | null
  closed_on: string | null
  days_open: number | null
  assigned_to: string | null
  last_imported_at: string
}

export type CrmDealRow = {
  id: string
  hubspot_id: string
  name: string
  pipeline_id: string | null
  pipeline_label: string | null
  stage_id: string | null
  stage_label: string | null
  stage_probability: number | null
  is_closed: boolean
  is_won: boolean
  amount: number | null
  close_date: string | null
  owner_id: string | null
  owner_name: string | null
  created_at_source: string | null
  updated_at_source: string | null
  stage_entered_at: string | null
  synced_at: string
}

export type FinancialReportType = 'profit_and_loss' | 'balance_sheet' | 'ar_aging'

export type FinancialReportRow = {
  id: string
  company_id: string
  report_type: FinancialReportType
  period_start: string
  period_end: string
  total_income: number | null
  total_expenses: number | null
  net_income: number | null
  cash: number | null
  ar_total: number | null
  raw: unknown
  fetched_at: string
}

export type OAuthConnectionRow = {
  id: string
  provider: 'quickbooks'
  company_id: string
  realm_id: string
  access_token_enc: string
  refresh_token_enc: string
  access_expires_at: string
  refresh_expires_at: string | null
  connected_by: string | null
  updated_at: string
}

export type RunStatus = 'running' | 'succeeded' | 'failed'

export type SyncRunRow = {
  id: string
  source: string
  company_id: string | null
  started_at: string
  finished_at: string | null
  status: RunStatus
  rows_written: number
  detail: unknown
  error: string | null
}

export type AgentRunRow = {
  id: string
  agent: string
  started_at: string
  finished_at: string | null
  status: RunStatus | 'skipped'
  headline: string | null
  metrics: unknown
  findings: unknown
  error: string | null
}

export type Database = {
  public: {
    Tables: {
      companies: Table<CompanyRow, 'slug' | 'name'>
      communities: Table<CommunityRow, 'vantaca_id' | 'name'>
      ar_aging_snapshots: Table<
        ArAgingSnapshotRow,
        'community_id' | 'as_of',
        [Rel<'ar_aging_snapshots_community_id_fkey', ['community_id'], 'communities'>]
      >
      action_items: Table<
        ActionItemRow,
        'xn',
        [Rel<'action_items_community_id_fkey', ['community_id'], 'communities'>]
      >
      crm_deals: Table<CrmDealRow, 'hubspot_id' | 'name'>
      financial_reports: Table<
        FinancialReportRow,
        'company_id' | 'report_type' | 'period_start' | 'period_end' | 'raw',
        [Rel<'financial_reports_company_id_fkey', ['company_id'], 'companies'>]
      >
      oauth_connections: Table<
        OAuthConnectionRow,
        'provider' | 'company_id' | 'realm_id' | 'access_token_enc' | 'refresh_token_enc' | 'access_expires_at',
        [Rel<'oauth_connections_company_id_fkey', ['company_id'], 'companies'>]
      >
      sync_runs: Table<
        SyncRunRow,
        'source',
        [Rel<'sync_runs_company_id_fkey', ['company_id'], 'companies'>]
      >
      agent_runs: Table<AgentRunRow, 'agent'>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
