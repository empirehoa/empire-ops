import { describe, expect, it } from 'vitest'
import { computePipelineStats, STALE_DEAL_DAYS } from '../pipeline'
import { deal, NOW } from './fixtures'

describe('computePipelineStats', () => {
  it('sums open value and weights it by stage probability', () => {
    const stats = computePipelineStats(
      [
        deal({ id: 'a', amount: 10000, stage_probability: 0.5 }),
        deal({ id: 'b', amount: 20000, stage_probability: 0.25, stage_label: 'Discovery' }),
        deal({ id: 'c', amount: 99999, is_closed: true, is_won: true, close_date: '2026-09-01' }),
      ],
      NOW,
    )
    expect(stats.openCount).toBe(2)
    expect(stats.openValue).toBe(30000)
    expect(stats.weightedValue).toBe(10000)
    expect(stats.byStage.map((s) => s.stage)).toEqual(['Discovery', 'Proposal'])
  })

  it('counts missing amounts and probabilities instead of guessing', () => {
    const stats = computePipelineStats(
      [deal({ id: 'a', amount: null }), deal({ id: 'b', amount: 5000, stage_probability: null })],
      NOW,
    )
    expect(stats.openMissingAmount).toBe(1)
    expect(stats.openMissingProbability).toBe(1)
    expect(stats.openValue).toBe(5000)
    expect(stats.weightedValue).toBe(0)
  })

  it(`flags open deals with no update in ${STALE_DEAL_DAYS}+ days as stale`, () => {
    const stats = computePipelineStats(
      [
        deal({ id: 'fresh', updated_at_source: '2026-10-01T12:00:00Z' }), // 7 days
        deal({ id: 'edge', updated_at_source: '2026-09-24T12:00:00Z', amount: 1 }), // exactly 14 days
        deal({ id: 'old', updated_at_source: '2026-06-01T00:00:00Z', amount: 50000 }),
        deal({ id: 'unknown', updated_at_source: null }),
        deal({ id: 'closed-old', is_closed: true, updated_at_source: '2025-01-01T00:00:00Z' }),
      ],
      NOW,
    )
    expect(stats.staleDeals.map((d) => d.id)).toEqual(['old', 'edge'])
    expect(stats.staleCount).toBe(2)
    expect(stats.staleValue).toBe(50001)
    expect(stats.openMissingUpdateDate).toBe(1)
    expect(stats.staleDeals[1].daysSinceUpdate).toBe(14)
  })

  it('computes win rate by count and by dollars over the trailing 365 days', () => {
    const stats = computePipelineStats(
      [
        deal({ id: 'w1', is_closed: true, is_won: true, amount: 30000, close_date: '2026-05-01' }),
        deal({ id: 'l1', is_closed: true, is_won: false, amount: 10000, close_date: '2026-06-01' }),
        deal({ id: 'l2', is_closed: true, is_won: false, amount: null, close_date: '2026-07-01' }),
        deal({ id: 'too-old', is_closed: true, is_won: true, amount: 1e6, close_date: '2025-09-01' }),
        deal({ id: 'no-date', is_closed: true, is_won: true, amount: 5, close_date: null }),
      ],
      NOW,
    )
    expect(stats.winRate.closedCount).toBe(3)
    expect(stats.winRate.wonCount).toBe(1)
    expect(stats.winRate.byCount).toBeCloseTo(1 / 3)
    expect(stats.winRate.closedValue).toBe(40000)
    expect(stats.winRate.wonValue).toBe(30000)
    expect(stats.winRate.byValue).toBeCloseTo(0.75)
    expect(stats.winRate.closedMissingCloseDate).toBe(1)
  })

  it('returns null win rates when nothing closed in the window', () => {
    const stats = computePipelineStats([deal({ id: 'a' })], NOW)
    expect(stats.winRate.byCount).toBeNull()
    expect(stats.winRate.byValue).toBeNull()
  })
})
