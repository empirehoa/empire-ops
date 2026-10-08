import { describe, expect, it } from 'vitest'
import { RETENTION_METHOD, scoreRetentionRisk } from '../retention'
import { community, item, NOW, snapshot } from './fixtures'

describe('scoreRetentionRisk', () => {
  const communities = [
    community({ id: 'risky', name: 'Risky Isles' }),
    community({ id: 'calm', name: 'Calm Acres' }),
    community({ id: 'test', name: 'Test HOA', is_test: true }),
    community({ id: 'gone', name: 'Former HOA', status: 'Terminated' }),
  ]

  const agedItems = Array.from({ length: 10 }, (_, i) =>
    item({ xn: `r${i}`, community_id: 'risky', opened_on: '2026-05-01' }),
  )

  it('scores each signal with an explanation and ranks by score', () => {
    const result = scoreRetentionRisk({
      communities,
      snapshots: [
        snapshot({ community_id: 'risky', as_of: '2026-08-15', total: 10000, days_90_plus: 2000 }),
        snapshot({ community_id: 'risky', as_of: '2026-10-01', total: 10000, days_90_plus: 4000 }),
        snapshot({ community_id: 'calm', as_of: '2026-10-01', total: 10000, days_90_plus: 500 }),
        snapshot({ community_id: 'test', as_of: '2026-10-01', total: 10000, days_90_plus: 10000 }),
      ],
      items: [...agedItems, item({ xn: 'c1', community_id: 'calm', opened_on: '2026-10-01' })],
      actionItemsImported: true,
      now: NOW,
    })

    expect(result.method).toBe(RETENTION_METHOD)
    expect(result.scored.map((r) => r.name)).toEqual(['Risky Isles', 'Calm Acres'])

    const risky = result.scored[0]
    // 40% 90+ share (30) + 90+ doubled over 47 days (20) + 10 aged items (30) + 100% aged share (20)
    expect(risky.score).toBe(100)
    expect(risky.band).toBe('elevated')
    expect(risky.signals.map((s) => [s.key, s.points])).toEqual([
      ['ar_90_share', 30],
      ['ar_90_trend', 20],
      ['aged_items', 30],
      ['aged_share', 20],
    ])
    expect(risky.signals[0].explanation).toContain('40%')
    expect(risky.signals[1].explanation).toContain('2026-08-15')

    const calm = result.scored[1]
    expect(calm.score).toBe(0)
    expect(calm.band).toBe('low')
    expect(calm.dataGaps.join(' ')).toContain('trend is not measured')
  })

  it('reports data gaps instead of scoring missing sources', () => {
    const result = scoreRetentionRisk({
      communities: [community({ id: 'a' })],
      snapshots: [],
      items: [],
      actionItemsImported: true,
      now: NOW,
    })
    expect(result.scored[0].dataGaps).toContain('No Vantaca AR aging snapshot for this association.')
    expect(result.scored[0].signals.map((s) => s.key)).toEqual(['aged_items', 'aged_share'])
  })

  it('leaves associations unscored when neither source has data for them', () => {
    const result = scoreRetentionRisk({
      communities: [community({ id: 'a' })],
      snapshots: [],
      items: [],
      actionItemsImported: false,
      now: NOW,
    })
    expect(result.scored).toHaveLength(0)
    expect(result.unscoredCount).toBe(1)
  })
})
