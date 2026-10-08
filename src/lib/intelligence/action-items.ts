// Aging of Vantaca action items (XN numbers): violations, work orders, ARC, collections, etc.

import type { ActionItemRow } from '@/lib/types/database'
import { byIdMap, daysBetween, num, parseDate, portfolioCommunities, type CommunityInput } from './shared'

export type ActionItemInput = Pick<
  ActionItemRow,
  'xn' | 'community_id' | 'category' | 'item_type' | 'step' | 'status' | 'opened_on' | 'closed_on' | 'days_open'
>

/** Open items at least this many days old count as aged. */
export const AGED_ITEM_DAYS = 60

const CLOSED_STATUS = /^(closed|complete|completed|cancell?ed|resolved|void)\b/i

/** Open = no close date and not carrying a closed-type status. */
export function isOpenItem(item: Pick<ActionItemInput, 'closed_on' | 'status'>): boolean {
  if (item.closed_on) return false
  return !CLOSED_STATUS.test((item.status ?? '').trim())
}

/**
 * Days open as of `now`. Uses opened_on when present (fresh as of today);
 * falls back to the days_open figure from the last export.
 */
export function itemAgeDays(item: Pick<ActionItemInput, 'opened_on' | 'days_open'>, now: Date): number | null {
  const opened = parseDate(item.opened_on)
  if (opened) return Math.max(0, daysBetween(opened, now))
  return num(item.days_open)
}

export type CategoryAging = { category: string; open: number; aged: number }
export type CommunityAging = {
  communityId: string
  name: string
  manager: string | null
  open: number
  aged: number
  oldestDays: number | null
}

export type ActionItemAging = {
  agedThresholdDays: number
  openCount: number
  agedCount: number
  /** Open items with neither an opened date nor a days-open figure. */
  unknownAgeCount: number
  /** Open items with no community, or a community not in the portfolio; excluded from every figure above. */
  excludedOpenCount: number
  byCategory: CategoryAging[]
  byCommunity: CommunityAging[]
}

/** Aging of open items in portfolio (non-test) communities. */
export function computeActionItemAging(
  items: ActionItemInput[],
  communities: CommunityInput[],
  now: Date,
): ActionItemAging {
  const portfolio = byIdMap(portfolioCommunities(communities))
  const categories = new Map<string, CategoryAging>()
  const byCommunity = new Map<string, CommunityAging>()
  let openCount = 0
  let agedCount = 0
  let unknownAgeCount = 0
  let excludedOpenCount = 0

  for (const item of items) {
    if (!isOpenItem(item)) continue
    const community = item.community_id ? portfolio.get(item.community_id) : undefined
    if (!community) {
      excludedOpenCount++
      continue
    }
    openCount++
    const age = itemAgeDays(item, now)
    const aged = age !== null && age >= AGED_ITEM_DAYS
    if (age === null) unknownAgeCount++
    if (aged) agedCount++

    const category = item.category?.trim() || 'Uncategorized'
    const c = categories.get(category) ?? { category, open: 0, aged: 0 }
    c.open++
    if (aged) c.aged++
    categories.set(category, c)

    const m = byCommunity.get(community.id) ?? {
      communityId: community.id,
      name: community.name,
      manager: community.manager_name,
      open: 0,
      aged: 0,
      oldestDays: null,
    }
    m.open++
    if (aged) m.aged++
    if (age !== null && (m.oldestDays === null || age > m.oldestDays)) m.oldestDays = age
    byCommunity.set(community.id, m)
  }

  return {
    agedThresholdDays: AGED_ITEM_DAYS,
    openCount,
    agedCount,
    unknownAgeCount,
    excludedOpenCount,
    byCategory: [...categories.values()].sort((a, b) => b.open - a.open),
    byCommunity: [...byCommunity.values()].sort((a, b) => b.aged - a.aged || b.open - a.open),
  }
}
