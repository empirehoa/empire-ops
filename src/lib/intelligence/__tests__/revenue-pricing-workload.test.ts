import { describe, expect, it } from 'vitest'
import { computePricingBenchmarks, sizeBandFor } from '../pricing'
import { singleMonthKey, trailingRevenueByCompany, trailingWindow, type PnlInput } from '../revenue'
import { classifySource, latestRunsBy, vantacaKindLabel, type SyncRunInput } from '../sources'
import { computeManagerWorkload, UNASSIGNED_MANAGER } from '../workload'
import { assembleIntegrationStatus } from '../integration-status'
import { community, item, NOW, snapshot } from './fixtures'

const companies = [
  { id: 'emg', slug: 'empire', name: 'Empire Management Group' },
  { id: 'wfw', slug: 'wfw', name: 'Wind Fire & Water' },
]

function pnl(company_id: string, month: string, income: number, net: number, extra: Partial<PnlInput> = {}): PnlInput {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return {
    company_id,
    report_type: 'profit_and_loss',
    period_start: `${month}-01`,
    period_end: `${month}-${String(last).padStart(2, '0')}`,
    total_income: income,
    total_expenses: income - net,
    net_income: net,
    fetched_at: '2026-10-02T06:00:00Z',
    ...extra,
  }
}

describe('trailing revenue', () => {
  it('uses the 12 complete months before the current month', () => {
    const w = trailingWindow(NOW)
    expect(w.start).toBe('2025-10-01')
    expect(w.end).toBe('2026-09-30')
    expect(w.months).toHaveLength(12)
    expect(w.months[11]).toBe('2026-09')
  })

  it('only accepts single calendar month rows', () => {
    expect(singleMonthKey({ period_start: '2026-02-01', period_end: '2026-02-28' })).toBe('2026-02')
    expect(singleMonthKey({ period_start: '2026-01-01', period_end: '2026-03-31' })).toBeNull()
    expect(singleMonthKey({ period_start: '2026-02-01', period_end: '2026-02-15' })).toBeNull()
  })

  it('sums covered months per company and never fills gaps', () => {
    const { companies: rows } = trailingRevenueByCompany(
      [
        pnl('emg', '2026-09', 600000, 50000),
        pnl('emg', '2026-08', 650000, 40000),
        pnl('emg', '2026-10', 1, 1), // current month, partial
        pnl('emg', '2025-09', 1, 1), // outside window
        pnl('emg', '2026-07', 1, 1, { report_type: 'balance_sheet' }),
        { ...pnl('emg', '2026-01', 1, 1), period_end: '2026-12-31' }, // annual row
      ],
      companies,
      NOW,
    )
    const emg = rows.find((r) => r.slug === 'empire')!
    expect(emg.hasData).toBe(true)
    expect(emg.monthsCovered).toBe(2)
    expect(emg.revenue).toBe(1250000)
    expect(emg.netIncome).toBe(90000)
    expect(emg.monthly.filter((m) => m.income !== null)).toHaveLength(2)

    const wfw = rows.find((r) => r.slug === 'wfw')!
    expect(wfw.hasData).toBe(false)
    expect(wfw.revenue).toBeNull()
    expect(wfw.netIncome).toBeNull()
  })

  it('keeps the newest fetch when a month was synced twice', () => {
    const { companies: rows } = trailingRevenueByCompany(
      [pnl('emg', '2026-09', 100, 10), pnl('emg', '2026-09', 200, 20, { fetched_at: '2026-10-05T06:00:00Z' })],
      companies,
      NOW,
    )
    expect(rows[0].revenue).toBe(200)
  })
})

describe('computePricingBenchmarks', () => {
  it('returns null when no association has a fee and doors', () => {
    expect(computePricingBenchmarks([community({ id: 'a', doors: null })])).toBeNull()
  })

  it('groups fee per door by size band and excludes test and inactive associations', () => {
    const result = computePricingBenchmarks([
      community({ id: 'a', doors: 100, monthly_management_fee: 1000 }), // 10
      community({ id: 'b', doors: 120, monthly_management_fee: 1800 }), // 15
      community({ id: 'c', doors: 80, monthly_management_fee: 1600 }), // 20
      community({ id: 'd', doors: 140, monthly_management_fee: 3500 }), // 25
      community({ id: 'e', doors: 400, monthly_management_fee: 4000 }), // 10
      community({ id: 'f', doors: null, monthly_management_fee: 900 }),
      community({ id: 't', doors: 100, monthly_management_fee: 1, is_test: true }),
      community({ id: 'x', doors: 100, monthly_management_fee: 1, status: 'Inactive' }),
    ])!
    expect(result.communityCount).toBe(5)
    expect(result.missingDoors).toBe(1)
    expect(result.totalDoors).toBe(840)
    expect(result.totalMonthlyFees).toBe(11900)
    expect(result.weightedFeePerDoor).toBeCloseTo(11900 / 840)
    const band = result.bands.find((b) => b.key === '50-149')!
    expect(band.count).toBe(4)
    expect(band.median).toBeCloseTo(17.5)
    expect(band.p25).toBeCloseTo(13.75)
    expect(result.lowestQuartile.map((p) => p.communityId)).toEqual(['a'])
    expect(result.label).toContain('Internal data only')
  })

  it('assigns size bands by door count', () => {
    expect(sizeBandFor(49).key).toBe('under-50')
    expect(sizeBandFor(50).key).toBe('50-149')
    expect(sizeBandFor(1200).key).toBe('600-plus')
  })
})

describe('computeManagerWorkload', () => {
  it('rolls up communities, doors, open and aged items, and 90+ AR per manager', () => {
    const rows = computeManagerWorkload(
      [
        community({ id: 'a', manager_name: 'Ana', doors: 200 }),
        community({ id: 'b', manager_name: 'Ana', doors: null }),
        community({ id: 'c', manager_name: null, doors: 50 }),
        community({ id: 't', manager_name: 'Ana', is_test: true, doors: 999 }),
      ],
      [
        item({ xn: '1', community_id: 'a', opened_on: '2026-01-01' }),
        item({ xn: '2', community_id: 'b', opened_on: '2026-10-01' }),
        item({ xn: '3', community_id: 't', opened_on: '2026-01-01' }),
      ],
      [snapshot({ community_id: 'a', days_90_plus: 700, total: 1000 }), snapshot({ community_id: 't', days_90_plus: 5 })],
      NOW,
    )
    expect(rows[0]).toEqual({
      manager: 'Ana',
      communities: 2,
      doors: 200,
      communitiesMissingDoors: 1,
      openItems: 2,
      agedItems: 1,
      ar90Plus: 700,
    })
    expect(rows[1].manager).toBe(UNASSIGNED_MANAGER)
  })
})

describe('sync run sources', () => {
  const run = (source: string, status: SyncRunInput['status'], started_at: string, company_id: string | null = null): SyncRunInput => ({
    source,
    company_id,
    status,
    started_at,
    finished_at: started_at,
    rows_written: 1,
    error: status === 'failed' ? 'boom' : null,
  })

  it('classifies sources by prefix', () => {
    expect(classifySource('hubspot:deals')).toBe('hubspot')
    expect(classifySource('QuickBooks')).toBe('quickbooks')
    expect(classifySource('vantaca_ar_aging')).toBe('vantaca')
    expect(classifySource('notion')).toBe('other')
  })

  it('labels Vantaca import kinds', () => {
    expect(vantacaKindLabel('vantaca:ar_aging')).toBe('AR aging')
    expect(vantacaKindLabel('vantaca-action-items')).toBe('Action items')
    expect(vantacaKindLabel('vantaca:communities')).toBe('Community list')
    expect(vantacaKindLabel('vantaca:owners')).toBe('Owners')
  })

  it('picks the latest run and latest success per key', () => {
    const runs = [
      run('hubspot', 'succeeded', '2026-10-06T06:00:00Z'),
      run('hubspot', 'failed', '2026-10-08T06:00:00Z'),
      run('hubspot', 'succeeded', '2026-10-07T06:00:00Z'),
    ]
    const latest = latestRunsBy(runs, () => 'k').get('k')!
    expect(latest.lastRun?.status).toBe('failed')
    expect(latest.lastSuccess?.started_at).toBe('2026-10-07T06:00:00Z')
  })

  it('assembles integration status per source and company', () => {
    const status = assembleIntegrationStatus({
      runs: [
        run('hubspot', 'succeeded', '2026-10-08T06:00:00Z'),
        run('quickbooks', 'succeeded', '2026-10-08T06:01:00Z', 'emg'),
        run('vantaca:ar_aging', 'succeeded', '2026-10-07T15:00:00Z'),
      ],
      companies,
      connections: [{ company_id: 'emg', updated_at: '2026-09-01T00:00:00Z', refresh_expires_at: null, connected_by: 'jr@example.com' }],
      dealRows: 12,
      env: { HUBSPOT_ACCESS_TOKEN: 'x', DISCORD_WEBHOOK_URL: '' },
      now: NOW,
    })
    expect(status.hubspot.tokenConfigured).toBe(true)
    expect(status.hubspot.lastSuccess?.started_at).toBe('2026-10-08T06:00:00Z')
    expect(status.quickbooks.appConfigured).toBe(false)
    expect(status.quickbooks.companies.map((c) => [c.slug, c.connected, Boolean(c.lastSuccess)])).toEqual([
      ['empire', true, true],
      ['wfw', false, false],
    ])
    expect(status.vantaca.kinds).toEqual([
      expect.objectContaining({ source: 'vantaca:ar_aging', label: 'AR aging' }),
    ])
    expect(status.delivery).toEqual({ discord: false, notion: false })
  })
})
