// Trailing twelve-month revenue and net income per company, from QuickBooks P&L
// reports stored in financial_reports. Only single-month P&L rows are used, so a
// year-to-date or quarterly row can never be double counted. Missing months stay
// missing: the result reports how many of the 12 months are covered.

import type { CompanyRow, FinancialReportRow } from '@/lib/types/database'
import { num } from './shared'

export type PnlInput = Pick<
  FinancialReportRow,
  'company_id' | 'report_type' | 'period_start' | 'period_end' | 'total_income' | 'total_expenses' | 'net_income' | 'fetched_at'
>
export type CompanyInput = Pick<CompanyRow, 'id' | 'slug' | 'name'>

export const TRAILING_MONTHS = 12

export type TrailingWindow = {
  /** First day of the first month, YYYY-MM-DD. */
  start: string
  /** Last day of the last complete month, YYYY-MM-DD. */
  end: string
  /** YYYY-MM keys, oldest first. */
  months: string[]
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/** The 12 complete calendar months before the month containing `now` (UTC). */
export function trailingWindow(now: Date, months = TRAILING_MONTHS): TrailingWindow {
  const keys: string[] = []
  for (let i = months; i >= 1; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  const [ly, lm] = keys[keys.length - 1].split('-').map(Number)
  return {
    start: `${keys[0]}-01`,
    end: `${keys[keys.length - 1]}-${String(lastDayOfMonth(ly, lm - 1)).padStart(2, '0')}`,
    months: keys,
  }
}

/** YYYY-MM when the row covers exactly one calendar month, else null. */
export function singleMonthKey(row: Pick<PnlInput, 'period_start' | 'period_end'>): string | null {
  const s = /^(\d{4})-(\d{2})-01$/.exec(row.period_start)
  const e = /^(\d{4})-(\d{2})-(\d{2})$/.exec(row.period_end)
  if (!s || !e || s[1] !== e[1] || s[2] !== e[2]) return null
  if (Number(e[3]) !== lastDayOfMonth(Number(s[1]), Number(s[2]) - 1)) return null
  return `${s[1]}-${s[2]}`
}

export type MonthlyPnl = { month: string; income: number | null; netIncome: number | null }

export type CompanyRevenue = {
  companyId: string
  slug: string
  name: string
  hasData: boolean
  monthsCovered: number
  monthsExpected: number
  /** Sums over covered months only; null when no month is covered. */
  revenue: number | null
  expenses: number | null
  netIncome: number | null
  monthly: MonthlyPnl[]
  latestFetchedAt: string | null
}

export function trailingRevenueByCompany(reports: PnlInput[], companies: CompanyInput[], now: Date): {
  window: TrailingWindow
  companies: CompanyRevenue[]
} {
  const window = trailingWindow(now)
  const inWindow = new Set(window.months)
  // company -> month -> newest row
  const rows = new Map<string, Map<string, PnlInput>>()
  for (const r of reports) {
    if (r.report_type !== 'profit_and_loss') continue
    const key = singleMonthKey(r)
    if (!key || !inWindow.has(key)) continue
    const byMonth = rows.get(r.company_id) ?? new Map<string, PnlInput>()
    const cur = byMonth.get(key)
    if (!cur || r.fetched_at > cur.fetched_at) byMonth.set(key, r)
    rows.set(r.company_id, byMonth)
  }

  const result = companies.map((c): CompanyRevenue => {
    const byMonth = rows.get(c.id) ?? new Map<string, PnlInput>()
    let revenue = 0
    let expenses = 0
    let netIncome = 0
    let latestFetchedAt: string | null = null
    const monthly = window.months.map((month) => {
      const r = byMonth.get(month)
      if (!r) return { month, income: null, netIncome: null }
      const income = num(r.total_income)
      const net = num(r.net_income)
      revenue += income ?? 0
      expenses += num(r.total_expenses) ?? 0
      netIncome += net ?? 0
      if (!latestFetchedAt || r.fetched_at > latestFetchedAt) latestFetchedAt = r.fetched_at
      return { month, income, netIncome: net }
    })
    const covered = byMonth.size
    return {
      companyId: c.id,
      slug: c.slug,
      name: c.name,
      hasData: covered > 0,
      monthsCovered: covered,
      monthsExpected: window.months.length,
      revenue: covered > 0 ? revenue : null,
      expenses: covered > 0 ? expenses : null,
      netIncome: covered > 0 ? netIncome : null,
      monthly,
      latestFetchedAt,
    }
  })

  return { window, companies: result }
}
