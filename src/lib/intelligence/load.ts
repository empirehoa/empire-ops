// Database loaders for the intelligence functions. Server-only (service role).
// Loaders fetch rows; every calculation lives in the pure modules next to this one.
// Portfolio loaders already apply the Vantaca dummy-data gate (is_test = false), and
// the pure functions apply it again so a caller can never forget it.

import type { AdminClient } from '@/lib/supabase/admin'
import type { AgentRunRow } from '@/lib/types/database'
import type { ActionItemInput } from './action-items'
import type { ArSnapshotInput } from './ar'
import { CROSS_SELL_WINDOW_DAYS } from './cross-sell'
import { WIN_RATE_WINDOW_DAYS, type DealInput } from './pipeline'
import type { CompanyInput, PnlInput } from './revenue'
import { addDays, isoDate, parseDate, type CommunityInput } from './shared'
import type { SyncRunInput } from './sources'

const PAGE_SIZE = 1000

/** AR snapshots older than this many days before the newest export are not loaded. */
export const AR_HISTORY_DAYS = 120

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/** Reads every row of a query in pages (PostgREST caps a response at 1,000 rows). */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = data ?? []
    out.push(...rows)
    if (rows.length < PAGE_SIZE) return out
  }
}

async function countRows(db: AdminClient, table: 'crm_deals' | 'action_items' | 'ar_aging_snapshots'): Promise<number> {
  const { count, error } = await db.from(table).select('id', { count: 'exact', head: true })
  if (error) throw new Error(`Could not count ${table}: ${error.message}`)
  return count ?? 0
}

export const countDeals = (db: AdminClient) => countRows(db, 'crm_deals')
export const countActionItems = (db: AdminClient) => countRows(db, 'action_items')

/** Portfolio communities (is_test = false). */
export function loadCommunities(db: AdminClient): Promise<CommunityInput[]> {
  return fetchAll((from, to) =>
    db
      .from('communities')
      .select('id, name, doors, monthly_management_fee, manager_name, status, is_test')
      .eq('is_test', false)
      .order('id')
      .range(from, to),
  )
}

/** Snapshots from the AR_HISTORY_DAYS before the newest export (enough for latest + trend). */
export async function loadArSnapshots(db: AdminClient): Promise<ArSnapshotInput[]> {
  const { data: newest, error } = await db
    .from('ar_aging_snapshots')
    .select('as_of')
    .order('as_of', { ascending: false })
    .limit(1)
  if (error) throw new Error(`Could not read AR snapshots: ${error.message}`)
  const anchor = parseDate(newest?.[0]?.as_of)
  if (!anchor) return []
  const since = isoDate(addDays(anchor, -AR_HISTORY_DAYS))
  return fetchAll((from, to) =>
    db
      .from('ar_aging_snapshots')
      .select('community_id, as_of, current_due, days_30, days_60, days_90_plus, total')
      .gte('as_of', since)
      .order('id')
      .range(from, to),
  )
}

/** Open action items plus anything opened in the cross-sell window. */
export function loadActionItems(db: AdminClient, now: Date): Promise<ActionItemInput[]> {
  const since = isoDate(addDays(now, -CROSS_SELL_WINDOW_DAYS))
  return fetchAll((from, to) =>
    db
      .from('action_items')
      .select('xn, community_id, category, item_type, step, status, opened_on, closed_on, days_open')
      .or(`closed_on.is.null,opened_on.gte.${since}`)
      .order('id')
      .range(from, to),
  )
}

/** Open deals plus deals closed in the win-rate window (or with no close date). */
export function loadDeals(db: AdminClient, now: Date): Promise<DealInput[]> {
  const since = isoDate(addDays(now, -WIN_RATE_WINDOW_DAYS))
  return fetchAll((from, to) =>
    db
      .from('crm_deals')
      .select('id, name, stage_label, stage_probability, is_closed, is_won, amount, close_date, owner_name, updated_at_source')
      .or(`is_closed.eq.false,close_date.is.null,close_date.gte.${since}`)
      .order('id')
      .range(from, to),
  )
}

export async function loadCompanies(db: AdminClient): Promise<CompanyInput[]> {
  const { data, error } = await db.from('companies').select('id, slug, name').order('created_at')
  if (error) throw new Error(`Could not read companies: ${error.message}`)
  return data ?? []
}

/** P&L rows starting on or after `start` (YYYY-MM-DD). */
export function loadPnl(db: AdminClient, start: string): Promise<PnlInput[]> {
  return fetchAll((from, to) =>
    db
      .from('financial_reports')
      .select('company_id, report_type, period_start, period_end, total_income, total_expenses, net_income, fetched_at')
      .eq('report_type', 'profit_and_loss')
      .gte('period_start', start)
      .order('id')
      .range(from, to),
  )
}

export type QboConnection = {
  company_id: string
  realm_id: string
  updated_at: string
  refresh_expires_at: string | null
  connected_by: string | null
}

/** QuickBooks connections. Token columns are never selected. */
export async function loadQboConnections(db: AdminClient): Promise<QboConnection[]> {
  const { data, error } = await db
    .from('oauth_connections')
    .select('company_id, realm_id, updated_at, refresh_expires_at, connected_by')
    .eq('provider', 'quickbooks')
  if (error) throw new Error(`Could not read QuickBooks connections: ${error.message}`)
  return data ?? []
}

export async function loadRecentSyncRuns(db: AdminClient, limit = 1000): Promise<SyncRunInput[]> {
  const { data, error } = await db
    .from('sync_runs')
    .select('source, company_id, status, started_at, finished_at, rows_written, error')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Could not read sync runs: ${error.message}`)
  return data ?? []
}

export type AgentRunSummary = Pick<
  AgentRunRow,
  'id' | 'agent' | 'status' | 'started_at' | 'finished_at' | 'headline' | 'metrics' | 'error'
>

/** The most recent run of each agent, newest first. */
export async function loadLatestAgentRuns(db: AdminClient): Promise<AgentRunSummary[]> {
  const { data, error } = await db
    .from('agent_runs')
    .select('id, agent, status, started_at, finished_at, headline, metrics, error')
    .order('started_at', { ascending: false })
    .limit(300)
  if (error) throw new Error(`Could not read agent runs: ${error.message}`)
  const seen = new Set<string>()
  const out: AgentRunSummary[] = []
  for (const r of data ?? []) {
    if (seen.has(r.agent)) continue
    seen.add(r.agent)
    out.push(r)
  }
  return out
}
