// Pure parser for QuickBooks Online report JSON (Reports API).
//
// Documented shape:
//   { Header: { ReportName, StartPeriod, EndPeriod, Option: [{ Name, Value }] },
//     Columns: { Column: [{ ColTitle, ColType, MetaData?: [{ Name: 'ColKey', Value }] }] },
//     Rows: { Row: [ { type: 'Section', group, Header?, Rows?: { Row: [...] }, Summary?: { ColData } }
//                  | { type: 'Data', ColData: [{ value, id? }] } ] } }
//
// Totals are read only from the Summary line of a named group. When a group is
// absent the figure is null; nothing is derived or estimated. The full report
// is stored separately in financial_reports.raw.
//
// Figures extracted (all dollars):
//   ProfitAndLoss   total_income   = Summary of group 'Income'     ("Total Income")
//                   total_expenses = Summary of group 'Expenses'   ("Total Expenses")
//                   net_income     = Summary of group 'NetIncome'  ("Net Income")
//                   (COGS, OtherIncome and OtherExpenses are not folded into
//                    income/expenses, so income - expenses can differ from net income.)
//   BalanceSheet    cash           = Summary of group 'BankAccounts' ("Total Bank Accounts")
//                   ar_total       = Summary of group 'AR' ("Total Accounts Receivable")
//   AgedReceivables ar_total       = Summary of group 'GrandTotal', Total column

import type { FinancialReportType } from '@/lib/types/database'

export type QboColData = { value?: string | null; id?: string }

export type QboRow = {
  type?: string
  group?: string
  ColData?: QboColData[]
  Header?: { ColData?: QboColData[] }
  Rows?: { Row?: QboRow[] }
  Summary?: { ColData?: QboColData[] }
}

export type QboColumn = {
  ColTitle?: string
  ColType?: string
  MetaData?: { Name?: string; Value?: string }[]
}

export type QboReport = {
  Header?: {
    Time?: string
    ReportName?: string
    StartPeriod?: string
    EndPeriod?: string
    ReportBasis?: string
    SummarizeColumnsBy?: string
    Currency?: string
    Option?: { Name?: string; Value?: string }[]
  }
  Columns?: { Column?: QboColumn[] }
  Rows?: { Row?: QboRow[] }
}

export type ParsedReport = {
  total_income: number | null
  total_expenses: number | null
  net_income: number | null
  cash: number | null
  ar_total: number | null
  noReportData: boolean
  /** Totals that were expected for this report type but not found. */
  missing: string[]
}

export const QBO_REPORT_NAMES: Record<FinancialReportType, string> = {
  profit_and_loss: 'ProfitAndLoss',
  balance_sheet: 'BalanceSheet',
  ar_aging: 'AgedReceivables',
}

/** numeric(14,2) holds |x| < 10^12. */
const MAX_MONEY = 1e12

/** QBO amounts are decimal strings ("1234.56", "-20.00"); "" means no amount. */
export function parseQboAmount(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  let v = value.trim()
  if (v === '') return null
  let negative = false
  if (/^\(.*\)$/.test(v)) {
    negative = true
    v = v.slice(1, -1)
  }
  v = v.replace(/[$,\s]/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(v)) return null
  const n = Number(v) * (negative ? -1 : 1)
  if (!Number.isFinite(n) || Math.abs(n) >= MAX_MONEY) return null
  return Math.round(n * 100) / 100
}

function colKey(col: QboColumn): string | undefined {
  return col.MetaData?.find((m) => m.Name === 'ColKey')?.Value
}

/**
 * Index of the column that holds the report total: ColKey 'total', else a
 * column titled 'Total', else the last Money column. Null if there are no columns.
 */
export function totalColumnIndex(report: QboReport): number | null {
  const cols = report.Columns?.Column ?? []
  if (cols.length === 0) return null
  let idx = cols.findIndex((c) => colKey(c)?.toLowerCase() === 'total')
  if (idx >= 0) return idx
  idx = cols.findIndex((c) => (c.ColTitle ?? '').trim().toLowerCase() === 'total')
  if (idx >= 0) return idx
  for (let i = cols.length - 1; i >= 0; i--) if (cols[i].ColType === 'Money') return i
  return null
}

function summaryValue(row: QboRow, colIdx: number | null): number | null {
  const data = row.Summary?.ColData
  if (!data || data.length === 0) return null
  // A Summary line always has the same width as the columns; if not, the last cell is the total.
  const cell = colIdx !== null && colIdx < data.length ? data[colIdx] : data[data.length - 1]
  return parseQboAmount(cell?.value)
}

/** Breadth-first so a top-level group wins over a nested one of the same name. */
export function findGroupTotal(report: QboReport, group: string): number | null {
  const colIdx = totalColumnIndex(report)
  const queue: QboRow[] = [...(report.Rows?.Row ?? [])]
  while (queue.length) {
    const row = queue.shift()!
    if (row.group === group && row.Summary) return summaryValue(row, colIdx)
    if (row.Rows?.Row) queue.push(...row.Rows.Row)
  }
  return null
}

function noReportData(report: QboReport): boolean {
  const opt = report.Header?.Option?.find((o) => o.Name === 'NoReportData')
  return opt?.Value?.toLowerCase() === 'true'
}

function result(fields: Partial<ParsedReport>, expected: (keyof ParsedReport)[], report: QboReport): ParsedReport {
  const parsed: ParsedReport = {
    total_income: null,
    total_expenses: null,
    net_income: null,
    cash: null,
    ar_total: null,
    ...fields,
    noReportData: noReportData(report),
    missing: [],
  }
  parsed.missing = expected.filter((k) => parsed[k] === null) as string[]
  return parsed
}

export function parseProfitAndLoss(report: QboReport): ParsedReport {
  return result(
    {
      total_income: findGroupTotal(report, 'Income'),
      total_expenses: findGroupTotal(report, 'Expenses'),
      net_income: findGroupTotal(report, 'NetIncome'),
    },
    ['total_income', 'total_expenses', 'net_income'],
    report,
  )
}

export function parseBalanceSheet(report: QboReport): ParsedReport {
  return result(
    { cash: findGroupTotal(report, 'BankAccounts'), ar_total: findGroupTotal(report, 'AR') },
    ['cash'],
    report,
  )
}

export function parseAgedReceivables(report: QboReport): ParsedReport {
  let total = findGroupTotal(report, 'GrandTotal')
  if (total === null) {
    // Some report variants omit the group name; accept only a top-level line labelled exactly "TOTAL".
    const colIdx = totalColumnIndex(report)
    const row = (report.Rows?.Row ?? []).find(
      (r) => r.Summary?.ColData?.[0]?.value?.trim().toLowerCase() === 'total',
    )
    if (row) total = summaryValue(row, colIdx)
  }
  return result({ ar_total: total }, ['ar_total'], report)
}

export function parseReport(type: FinancialReportType, report: QboReport): ParsedReport {
  switch (type) {
    case 'profit_and_loss':
      return parseProfitAndLoss(report)
    case 'balance_sheet':
      return parseBalanceSheet(report)
    case 'ar_aging':
      return parseAgedReceivables(report)
  }
}
