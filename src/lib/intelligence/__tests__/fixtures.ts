import type { ActionItemInput } from '../action-items'
import type { ArSnapshotInput } from '../ar'
import type { DealInput } from '../pipeline'
import type { CommunityInput } from '../shared'

export const NOW = new Date('2026-10-08T12:00:00Z')

export function community(overrides: Partial<CommunityInput> & { id: string }): CommunityInput {
  return {
    name: `Community ${overrides.id}`,
    doors: 100,
    monthly_management_fee: 1500,
    manager_name: 'Pat Manager',
    status: 'active',
    is_test: false,
    ...overrides,
  }
}

export function snapshot(overrides: Partial<ArSnapshotInput> & { community_id: string }): ArSnapshotInput {
  return {
    as_of: '2026-10-01',
    current_due: 0,
    days_30: 0,
    days_60: 0,
    days_90_plus: 0,
    total: 0,
    ...overrides,
  }
}

export function item(overrides: Partial<ActionItemInput> & { xn: string }): ActionItemInput {
  return {
    community_id: 'c1',
    category: 'Violation',
    item_type: 'Landscaping',
    step: null,
    status: 'Open',
    opened_on: '2026-09-01',
    closed_on: null,
    days_open: null,
    ...overrides,
  }
}

export function deal(overrides: Partial<DealInput> & { id: string }): DealInput {
  return {
    name: `Deal ${overrides.id}`,
    stage_label: 'Proposal',
    stage_probability: 0.5,
    is_closed: false,
    is_won: false,
    amount: 10000,
    close_date: null,
    owner_name: 'Sam Seller',
    updated_at_source: '2026-10-07T00:00:00Z',
    ...overrides,
  }
}
