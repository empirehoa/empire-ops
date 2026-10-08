// QuickBooks Online -> financial_reports, one sync_runs row per company (source 'quickbooks').
//
// Per connected company:
//   - P&L month-to-date (current month, start of month .. today)
//   - P&L for each of the last 12 full calendar months (re-pulled daily to pick up late entries)
//   - Balance sheet as of today
//   - AR aging summary as of today
// Companies without an oauth_connections row are reported in `skipped`.

import type { AdminClient } from '@/lib/supabase/admin'
import type { CompanyRow, FinancialReportType, OAuthConnectionRow } from '@/lib/types/database'
import { finishSyncRun, startSyncRun } from '@/lib/runs'
import { getQuickBooksConfig, type QuickBooksConfig } from './config'
import { QuickBooksClient, type QboReportName } from './client'
import { lastFullMonths, monthToDate, todayInZone, type Period } from './periods'
import { QBO_REPORT_NAMES, parseReport } from './report-parser'
import { ensureFreshAccessToken, type FetchLike } from './tokens'

export type QuickBooksSyncResult = {
  /** Companies whose reports all synced. */
  companies: number
  /** financial_reports rows written. */
  reports: number
  /** Slugs of companies with no QuickBooks connection. */
  skipped: string[]
  /** Companies where the run failed (fully or partly). */
  failed: { company: string; error: string }[]
}

export type QuickBooksSyncOptions = {
  now?: Date
  config?: QuickBooksConfig
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

type ReportJob = {
  type: FinancialReportType
  period: Period
  params: Record<string, string>
}

export function buildReportJobs(today: string): ReportJob[] {
  const pnl = (period: Period): ReportJob => ({
    type: 'profit_and_loss',
    period,
    params: { start_date: period.start, end_date: period.end },
  })
  const asOfToday: Period = { start: today, end: today }
  return [
    pnl(monthToDate(today)),
    ...lastFullMonths(today, 12).map(pnl),
    { type: 'balance_sheet', period: asOfToday, params: { start_date: today, end_date: today } },
    { type: 'ar_aging', period: asOfToday, params: { report_date: today } },
  ]
}

type CompanySyncOutcome = { ok: boolean; rows: number; error?: string }

async function syncCompany(
  db: AdminClient,
  company: Pick<CompanyRow, 'id' | 'slug'>,
  connection: OAuthConnectionRow,
  ctx: { now: Date; config: QuickBooksConfig; client: QuickBooksClient; fetchImpl?: FetchLike },
): Promise<CompanySyncOutcome> {
  const runId = await startSyncRun(db, 'quickbooks', company.id)
  let rows = 0
  const errors: string[] = []
  const incomplete: { report: string; period: string; missing: string[]; noReportData: boolean }[] = []

  try {
    const { accessToken, realmId, refreshed } = await ensureFreshAccessToken(db, connection, {
      now: ctx.now,
      config: ctx.config,
      fetchImpl: ctx.fetchImpl,
    })

    const today = todayInZone(ctx.now)
    for (const job of buildReportJobs(today)) {
      const reportName = QBO_REPORT_NAMES[job.type] as QboReportName
      const label = `${reportName} ${job.period.start}..${job.period.end}`
      try {
        const report = await ctx.client.fetchReport(realmId, accessToken, reportName, job.params)
        const parsed = parseReport(job.type, report)
        if (parsed.missing.length || parsed.noReportData) {
          incomplete.push({
            report: reportName,
            period: `${job.period.start}..${job.period.end}`,
            missing: parsed.missing,
            noReportData: parsed.noReportData,
          })
        }

        const { error } = await db.from('financial_reports').upsert(
          {
            company_id: company.id,
            report_type: job.type,
            period_start: job.period.start,
            period_end: job.period.end,
            total_income: parsed.total_income,
            total_expenses: parsed.total_expenses,
            net_income: parsed.net_income,
            cash: parsed.cash,
            ar_total: parsed.ar_total,
            raw: report,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,report_type,period_start,period_end' },
        )
        if (error) throw new Error(`financial_reports upsert failed: ${error.message}`)
        rows++

        // A P&L month has exactly one current row: drop earlier month-to-date
        // snapshots for the same month (e.g. Oct 1..7 once Oct 1..8 is written).
        if (job.type === 'profit_and_loss') {
          const { error: cleanupError } = await db
            .from('financial_reports')
            .delete()
            .eq('company_id', company.id)
            .eq('report_type', 'profit_and_loss')
            .eq('period_start', job.period.start)
            .neq('period_end', job.period.end)
          if (cleanupError) throw new Error(`financial_reports cleanup failed: ${cleanupError.message}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${label}: ${message}`)
        // A rejected token fails every remaining call; stop early.
        if (/HTTP 40[13]/.test(message)) break
      }
    }

    if (errors.length === 0) {
      await finishSyncRun(db, runId, {
        ok: true,
        rows,
        detail: { realm_id: realmId, as_of: today, token_refreshed: refreshed, incomplete },
      })
      return { ok: true, rows }
    }
    const error = errors.join('; ').slice(0, 2000)
    await finishSyncRun(db, runId, { ok: false, error, rows })
    return { ok: false, rows, error }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await finishSyncRun(db, runId, { ok: false, error, rows })
    return { ok: false, rows, error }
  }
}

export async function syncAllQuickBooks(
  db: AdminClient,
  options: QuickBooksSyncOptions = {},
): Promise<QuickBooksSyncResult> {
  const config = options.config ?? getQuickBooksConfig()
  const now = options.now ?? new Date()
  const client = new QuickBooksClient({ apiBase: config.apiBase, fetchImpl: options.fetchImpl, sleep: options.sleep })

  const { data: companies, error: companiesError } = await db
    .from('companies')
    .select('id, slug')
    .order('slug')
  if (companiesError) throw new Error(`Could not load companies: ${companiesError.message}`)

  const { data: connections, error: connError } = await db
    .from('oauth_connections')
    .select('*')
    .eq('provider', 'quickbooks')
  if (connError) throw new Error(`Could not load QuickBooks connections: ${connError.message}`)

  const byCompany = new Map((connections ?? []).map((c) => [c.company_id, c]))
  const result: QuickBooksSyncResult = { companies: 0, reports: 0, skipped: [], failed: [] }

  for (const company of companies ?? []) {
    const connection = byCompany.get(company.id)
    if (!connection) {
      result.skipped.push(company.slug)
      continue
    }
    const outcome = await syncCompany(db, company, connection, {
      now,
      config,
      client,
      fetchImpl: options.fetchImpl,
    })
    result.reports += outcome.rows
    if (outcome.ok) result.companies++
    else result.failed.push({ company: company.slug, error: outcome.error ?? 'unknown error' })
  }

  return result
}
