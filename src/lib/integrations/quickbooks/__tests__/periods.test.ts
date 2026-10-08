import { describe, expect, it } from 'vitest'
import { lastFullMonths, monthToDate, todayInZone } from '../periods'
import { buildReportJobs } from '../sync'

describe('report periods', () => {
  it('uses the Florida calendar date, not UTC', () => {
    // 03:00 UTC on Oct 8 is still Oct 7 in Eastern time.
    expect(todayInZone(new Date('2026-10-08T03:00:00Z'))).toBe('2026-10-07')
    expect(todayInZone(new Date('2026-10-08T06:00:00Z'))).toBe('2026-10-08')
  })

  it('month-to-date runs from the 1st through today', () => {
    expect(monthToDate('2026-10-08')).toEqual({ start: '2026-10-01', end: '2026-10-08' })
    expect(monthToDate('2026-10-01')).toEqual({ start: '2026-10-01', end: '2026-10-01' })
  })

  it('lists the last 12 full months, most recent first, across a year boundary', () => {
    const months = lastFullMonths('2026-02-10')
    expect(months).toHaveLength(12)
    expect(months[0]).toEqual({ start: '2026-01-01', end: '2026-01-31' })
    expect(months[1]).toEqual({ start: '2025-12-01', end: '2025-12-31' })
    expect(months[11]).toEqual({ start: '2025-02-01', end: '2025-02-28' })
  })

  it('handles leap-year February', () => {
    expect(lastFullMonths('2028-03-15', 1)).toEqual([{ start: '2028-02-01', end: '2028-02-29' }])
  })

  it('builds 15 report jobs: MTD + 12 months P&L, balance sheet and AR aging as of today', () => {
    const jobs = buildReportJobs('2026-10-08')
    expect(jobs).toHaveLength(15)
    expect(jobs[0]).toEqual({
      type: 'profit_and_loss',
      period: { start: '2026-10-01', end: '2026-10-08' },
      params: { start_date: '2026-10-01', end_date: '2026-10-08' },
    })
    expect(jobs.filter((j) => j.type === 'profit_and_loss')).toHaveLength(13)
    expect(jobs.at(-2)).toEqual({
      type: 'balance_sheet',
      period: { start: '2026-10-08', end: '2026-10-08' },
      params: { start_date: '2026-10-08', end_date: '2026-10-08' },
    })
    expect(jobs.at(-1)).toEqual({
      type: 'ar_aging',
      period: { start: '2026-10-08', end: '2026-10-08' },
      params: { report_date: '2026-10-08' },
    })
  })
})
