import { describe, expect, it } from 'vitest'
import { matchCrossSell, matchItem } from '../cross-sell'
import { community, item, NOW } from './fixtures'

describe('matchItem', () => {
  const companiesFor = (category: string | null, item_type: string | null) =>
    matchItem({ category, item_type }).map((m) => m.rule.company)

  it.each([
    ['Work Order', 'Roof Leak', ['wfw']],
    ['Work Order', 'Mold remediation', ['wfw']],
    ['Insurance', 'Storm damage', ['wfw']],
    ['Work Order', 'Water damage repair', ['wfw', 'fixiq']],
    ['Maintenance', 'Pressure washing', ['fixiq']],
    ['Work Order', 'Landscaping', ['fixiq']],
    ['Violation', 'Paint', ['fixiq']],
    ['Resale', 'Estoppel request', ['riance-realty']],
    ['Closing', null, ['riance-realty']],
    ['Violation', 'Trash cans', []],
  ])('%s / %s -> %j', (category, type, expected) => {
    expect(companiesFor(category, type)).toEqual(expected)
  })

  it('does not match words that merely contain a keyword', () => {
    expect(companiesFor('Waterfront access', 'Firewall')).toEqual([])
  })
})

describe('matchCrossSell', () => {
  const communities = [
    community({ id: 'c1', name: 'Oak Hollow' }),
    community({ id: 'c2', name: 'Bay Pointe' }),
    community({ id: 'test', name: 'Test HOA', is_test: true }),
  ]

  it('groups matches per association and company, using open or recent items only', () => {
    const result = matchCrossSell(
      [
        item({ xn: '1', community_id: 'c1', item_type: 'Roof leak' }),
        item({ xn: '2', community_id: 'c1', item_type: 'Water intrusion', closed_on: '2026-09-20', opened_on: '2026-09-10' }),
        item({ xn: '3', community_id: 'c1', item_type: 'Flooding', closed_on: '2026-01-10', opened_on: '2026-01-01' }),
        item({ xn: '4', community_id: 'c2', category: 'Resale', item_type: 'Estoppel' }),
        item({ xn: '5', community_id: 'test', item_type: 'Mold' }),
        item({ xn: '6', community_id: null, item_type: 'Mold' }),
      ],
      communities,
      NOW,
    )
    expect(result.totalMatches).toBe(3)
    expect(result.byCompany).toEqual([
      { company: 'wfw', companyName: 'Wind Fire & Water', matches: 2, communities: 1 },
      { company: 'fixiq', companyName: 'FixIQ', matches: 0, communities: 0 },
      { company: 'riance-realty', companyName: 'Riance Realty', matches: 1, communities: 1 },
    ])
    const oak = result.byCommunity[0]
    expect(oak).toMatchObject({ name: 'Oak Hollow', company: 'wfw', count: 2, openCount: 1 })
    expect(oak.keywords).toEqual(['leak', 'water'])
    expect(oak.samples.map((s) => s.xn)).toEqual(['1', '2'])
  })
})
