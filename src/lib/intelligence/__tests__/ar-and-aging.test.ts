import { describe, expect, it } from 'vitest'
import { computeActionItemAging, isOpenItem, itemAgeDays } from '../action-items'
import { computeArStats, latestSnapshotPerCommunity } from '../ar'
import { community, item, NOW, snapshot } from './fixtures'

const communities = [
  community({ id: 'c1', name: 'Oak Hollow' }),
  community({ id: 'c2', name: 'Bay Pointe' }),
  community({ id: 'test', name: 'Practice HOA', is_test: true }),
]

describe('latestSnapshotPerCommunity', () => {
  it('keeps the newest as_of per community', () => {
    const latest = latestSnapshotPerCommunity([
      snapshot({ community_id: 'c1', as_of: '2026-09-01', total: 1 }),
      snapshot({ community_id: 'c1', as_of: '2026-10-01', total: 2 }),
      snapshot({ community_id: 'c1', as_of: '2026-08-01', total: 3 }),
    ])
    expect(latest.get('c1')?.total).toBe(2)
  })
})

describe('computeArStats', () => {
  it('returns null without snapshots', () => {
    expect(computeArStats([], communities)).toBeNull()
  })

  it('totals the latest snapshot per community and excludes test communities', () => {
    const stats = computeArStats(
      [
        snapshot({ community_id: 'c1', as_of: '2026-09-01', total: 999, days_90_plus: 999 }),
        snapshot({ community_id: 'c1', as_of: '2026-10-01', total: 1000, current_due: 600, days_30: 100, days_60: 100, days_90_plus: 200 }),
        snapshot({ community_id: 'c2', as_of: '2026-09-28', total: 3000, current_due: 1500, days_90_plus: 1500 }),
        snapshot({ community_id: 'test', as_of: '2026-10-01', total: 1e6, days_90_plus: 1e6 }),
      ],
      communities,
    )!
    expect(stats.communityCount).toBe(2)
    expect(stats.total).toBe(4000)
    expect(stats.days90Plus).toBe(1700)
    expect(stats.share90Plus).toBeCloseTo(0.425)
    expect(stats.asOfMin).toBe('2026-09-28')
    expect(stats.asOfMax).toBe('2026-10-01')
    expect(stats.topBy90Plus.map((l) => l.name)).toEqual(['Bay Pointe', 'Oak Hollow'])
    expect(stats.topBy90Plus[0].share90Plus).toBeCloseTo(0.5)
    expect(stats.topByTotal[0].shareOfPortfolio).toBeCloseTo(0.75)
    expect(stats.concentration.top5Share).toBe(1)
  })
})

describe('action item aging', () => {
  it('treats closed dates and closed statuses as closed', () => {
    expect(isOpenItem({ closed_on: null, status: 'Open' })).toBe(true)
    expect(isOpenItem({ closed_on: '2026-01-01', status: 'Open' })).toBe(false)
    expect(isOpenItem({ closed_on: null, status: 'Closed - Resolved' })).toBe(false)
    expect(isOpenItem({ closed_on: null, status: null })).toBe(true)
  })

  it('ages from opened_on, falling back to days_open', () => {
    expect(itemAgeDays({ opened_on: '2026-08-09', days_open: 5 }, NOW)).toBe(60)
    expect(itemAgeDays({ opened_on: null, days_open: 75 }, NOW)).toBe(75)
    expect(itemAgeDays({ opened_on: null, days_open: null }, NOW)).toBeNull()
  })

  it('counts open and 60+ day items by category and community, excluding test and unattributed items', () => {
    const aging = computeActionItemAging(
      [
        item({ xn: '1', community_id: 'c1', category: 'Violation', opened_on: '2026-01-01' }),
        item({ xn: '2', community_id: 'c1', category: 'Violation', opened_on: '2026-10-01' }),
        item({ xn: '3', community_id: 'c2', category: 'Work Order', opened_on: '2026-07-01' }),
        item({ xn: '4', community_id: 'c2', category: 'Work Order', opened_on: null, days_open: null }),
        item({ xn: '5', community_id: 'c2', category: 'Work Order', closed_on: '2026-10-01' }),
        item({ xn: '6', community_id: 'test', opened_on: '2025-01-01' }),
        item({ xn: '7', community_id: null, opened_on: '2025-01-01' }),
      ],
      communities,
      NOW,
    )
    expect(aging.openCount).toBe(4)
    expect(aging.agedCount).toBe(2)
    expect(aging.unknownAgeCount).toBe(1)
    expect(aging.excludedOpenCount).toBe(2)
    expect(aging.byCategory).toEqual([
      { category: 'Violation', open: 2, aged: 1 },
      { category: 'Work Order', open: 2, aged: 1 },
    ])
    const oak = aging.byCommunity.find((c) => c.name === 'Oak Hollow')!
    expect(oak).toMatchObject({ open: 2, aged: 1, oldestDays: 280 })
  })
})
