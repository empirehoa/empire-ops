import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { encryptToken } from '@/lib/crypto/tokens'
import type { QuickBooksConfig } from '../config'
import { syncAllQuickBooks } from '../sync'
import { createFakeDb, syncRunsHandler, type Op } from './fake-db'
import { agedReceivablesFixture, balanceSheetFixture, profitAndLossFixture } from './fixtures'

const config: QuickBooksConfig = {
  clientId: 'id',
  clientSecret: 'secret',
  redirectUri: 'https://ops.example.com/api/integrations/quickbooks/callback',
  environment: 'production',
  apiBase: 'https://quickbooks.api.intuit.com',
}
const now = new Date('2026-10-08T10:00:00Z') // 06:00 in Florida

let prevKey: string | undefined
beforeAll(() => {
  prevKey = process.env.TOKEN_ENCRYPTION_KEY
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})
afterAll(() => {
  if (prevKey === undefined) delete process.env.TOKEN_ENCRYPTION_KEY
  else process.env.TOKEN_ENCRYPTION_KEY = prevKey
})

function dbWith(connections: Record<string, unknown>[]) {
  return createFakeDb((op: Op) => {
    if (op.table === 'companies' && op.action === 'select') {
      return {
        data: [
          { id: 'c-empire', slug: 'empire' },
          { id: 'c-wfw', slug: 'wfw' },
        ],
      }
    }
    if (op.table === 'oauth_connections' && op.action === 'select') return { data: connections }
    return syncRunsHandler(op)
  })
}

const empireConnection = () => ({
  id: 'conn-empire',
  provider: 'quickbooks',
  company_id: 'c-empire',
  realm_id: '4620816365',
  access_token_enc: encryptToken('live-access'),
  refresh_token_enc: encryptToken('live-refresh'),
  access_expires_at: new Date(now.getTime() + 50 * 60 * 1000).toISOString(),
  refresh_expires_at: null,
})

function reportsFetch(failOn?: string) {
  return vi.fn(async (url: string) => {
    const u = new URL(url)
    expect(u.host).toBe('quickbooks.api.intuit.com')
    expect(u.searchParams.get('minorversion')).toBe('75')
    const name = u.pathname.split('/').pop()
    if (name === failOn) {
      return new Response(JSON.stringify({ Fault: { Error: [{ Message: 'Report error', code: '2020' }] } }), { status: 400 })
    }
    const body =
      name === 'ProfitAndLoss' ? profitAndLossFixture : name === 'BalanceSheet' ? balanceSheetFixture : agedReceivablesFixture
    return new Response(JSON.stringify(body), { status: 200 })
  })
}

describe('syncAllQuickBooks', () => {
  it('syncs connected companies, skips the rest and upserts one row per report period', async () => {
    const { db, ops } = dbWith([empireConnection()])
    const fetchImpl = reportsFetch()

    const result = await syncAllQuickBooks(db, { now, config, fetchImpl, sleep: async () => {} })

    expect(result).toEqual({ companies: 1, reports: 15, skipped: ['wfw'], failed: [] })
    expect(fetchImpl).toHaveBeenCalledTimes(15)
    expect(new URL(fetchImpl.mock.calls[0][0]).pathname).toBe('/v3/company/4620816365/reports/ProfitAndLoss')

    const runs = ops.filter((o) => o.table === 'sync_runs' && o.action === 'insert')
    expect(runs.map((r) => r.payload)).toEqual([{ source: 'quickbooks', company_id: 'c-empire' }])

    const upserts = ops.filter((o) => o.table === 'financial_reports' && o.action === 'upsert')
    expect(upserts).toHaveLength(15)
    expect(upserts[0].options).toEqual({ onConflict: 'company_id,report_type,period_start,period_end' })
    expect(upserts[0].payload).toMatchObject({
      company_id: 'c-empire',
      report_type: 'profit_and_loss',
      period_start: '2026-10-01',
      period_end: '2026-10-08',
      total_income: 125430.5,
      total_expenses: 98210.25,
      net_income: 28420.25,
      raw: profitAndLossFixture,
    })
    expect(upserts[14].payload).toMatchObject({ report_type: 'ar_aging', period_start: '2026-10-08', ar_total: 18900 })
    expect(upserts[13].payload).toMatchObject({ report_type: 'balance_sheet', cash: 62345.67 })

    // Earlier month-to-date snapshots for October are removed.
    const cleanup = ops.find((o) => o.table === 'financial_reports' && o.action === 'delete')!
    expect(cleanup.filters).toEqual([
      ['eq', 'company_id', 'c-empire'],
      ['eq', 'report_type', 'profit_and_loss'],
      ['eq', 'period_start', '2026-10-01'],
      ['neq', 'period_end', '2026-10-08'],
    ])

    const finish = ops.find((o) => o.table === 'sync_runs' && o.action === 'update')!
    expect(finish.payload).toMatchObject({ status: 'succeeded', rows_written: 15 })
  })

  it('records a failed company run but keeps the reports that did sync', async () => {
    const { db, ops } = dbWith([empireConnection()])
    const result = await syncAllQuickBooks(db, { now, config, fetchImpl: reportsFetch('AgedReceivables'), sleep: async () => {} })

    expect(result.companies).toBe(0)
    expect(result.reports).toBe(14)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].company).toBe('empire')
    expect(result.failed[0].error).toMatch(/AgedReceivables .*HTTP 400.*Report error/)
    expect(result.failed[0].error).not.toContain('live-access')

    const finish = ops.find((o) => o.table === 'sync_runs' && o.action === 'update')!
    expect(finish.payload).toMatchObject({ status: 'failed', rows_written: 14 })
  })

  it('skips every company when none are connected', async () => {
    const { db } = dbWith([])
    const fetchImpl = vi.fn()
    const result = await syncAllQuickBooks(db, { now, config, fetchImpl })
    expect(result).toEqual({ companies: 0, reports: 0, skipped: ['empire', 'wfw'], failed: [] })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
