// Parser tests run against SYNTHETIC fixtures (see ./fixtures.ts) built to
// match Intuit's documented report JSON shape; they are not live data.

import { describe, expect, it } from 'vitest'
import {
  findGroupTotal,
  parseAgedReceivables,
  parseBalanceSheet,
  parseProfitAndLoss,
  parseQboAmount,
  parseReport,
  totalColumnIndex,
} from '../report-parser'
import {
  agedReceivablesFixture,
  agedReceivablesNoMetaFixture,
  balanceSheetFixture,
  balanceSheetWithoutBankFixture,
  emptyProfitAndLossFixture,
  profitAndLossByMonthFixture,
  profitAndLossFixture,
} from './fixtures'

describe('parseQboAmount', () => {
  it('parses decimal strings to dollars', () => {
    expect(parseQboAmount('125430.50')).toBe(125430.5)
    expect(parseQboAmount('-20.00')).toBe(-20)
    expect(parseQboAmount('0.00')).toBe(0)
    expect(parseQboAmount('1,234.56')).toBe(1234.56)
    expect(parseQboAmount('(250.00)')).toBe(-250)
  })

  it('returns null for blanks and non-numbers', () => {
    expect(parseQboAmount('')).toBeNull()
    expect(parseQboAmount(undefined)).toBeNull()
    expect(parseQboAmount('Total Income')).toBeNull()
  })
})

describe('ProfitAndLoss', () => {
  it('reads Total Income, Total Expenses and Net Income from their group summaries', () => {
    expect(parseProfitAndLoss(profitAndLossFixture)).toEqual({
      total_income: 125430.5,
      total_expenses: 98210.25,
      net_income: 28420.25,
      cash: null,
      ar_total: null,
      noReportData: false,
      missing: [],
    })
  })

  it('does not mistake a nested parent-account subtotal for the Income total', () => {
    expect(findGroupTotal(profitAndLossFixture, 'Income')).toBe(125430.5)
  })

  it('uses the Total column when the report is summarised by month', () => {
    expect(totalColumnIndex(profitAndLossByMonthFixture)).toBe(3)
    const parsed = parseProfitAndLoss(profitAndLossByMonthFixture)
    expect(parsed.total_income).toBe(3000)
    expect(parsed.total_expenses).toBe(4250.75)
    expect(parsed.net_income).toBe(-1250.75)
  })

  it('stores null, not zero, when QuickBooks reports no data', () => {
    const parsed = parseProfitAndLoss(emptyProfitAndLossFixture)
    expect(parsed.noReportData).toBe(true)
    expect(parsed.total_income).toBeNull()
    expect(parsed.total_expenses).toBeNull()
    expect(parsed.net_income).toBeNull()
    expect(parsed.missing).toEqual(['total_income', 'total_expenses', 'net_income'])
  })
})

describe('BalanceSheet', () => {
  it('reads cash from Total Bank Accounts and A/R from Total Accounts Receivable', () => {
    const parsed = parseBalanceSheet(balanceSheetFixture)
    expect(parsed.cash).toBe(62345.67)
    expect(parsed.ar_total).toBe(18900)
    expect(parsed.total_income).toBeNull()
    expect(parsed.missing).toEqual([])
  })

  it('leaves cash null when there is no bank-accounts section (never guesses)', () => {
    const parsed = parseBalanceSheet(balanceSheetWithoutBankFixture)
    expect(parsed.cash).toBeNull()
    expect(parsed.ar_total).toBeNull()
    expect(parsed.missing).toEqual(['cash'])
  })
})

describe('AgedReceivables', () => {
  it('reads the GrandTotal line from the Total column, not the Current bucket', () => {
    const parsed = parseAgedReceivables(agedReceivablesFixture)
    expect(parsed.ar_total).toBe(18900)
    expect(parsed.missing).toEqual([])
  })

  it('handles columns without MetaData and a TOTAL line without a group name', () => {
    expect(totalColumnIndex(agedReceivablesNoMetaFixture)).toBe(2)
    expect(parseAgedReceivables(agedReceivablesNoMetaFixture).ar_total).toBe(334.11)
  })

  it('returns null when no total line exists', () => {
    const parsed = parseAgedReceivables({ ...agedReceivablesFixture, Rows: { Row: [] } })
    expect(parsed.ar_total).toBeNull()
    expect(parsed.missing).toEqual(['ar_total'])
  })
})

describe('parseReport dispatch', () => {
  it('routes by report type', () => {
    expect(parseReport('profit_and_loss', profitAndLossFixture).net_income).toBe(28420.25)
    expect(parseReport('balance_sheet', balanceSheetFixture).cash).toBe(62345.67)
    expect(parseReport('ar_aging', agedReceivablesFixture).ar_total).toBe(18900)
  })
})
