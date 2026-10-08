// Homeowner AR aging across managed associations, from Vantaca AR aging exports.
// These are balances owed to each association by its owners, not EMG revenue.

import type { ArAgingSnapshotRow } from '@/lib/types/database'
import { byIdMap, num, portfolioCommunities, ratio, type CommunityInput } from './shared'

export type ArSnapshotInput = Pick<
  ArAgingSnapshotRow,
  'community_id' | 'as_of' | 'current_due' | 'days_30' | 'days_60' | 'days_90_plus' | 'total'
>

export type ArCommunityLine = {
  communityId: string
  name: string
  asOf: string
  total: number
  days90Plus: number
  /** days_90_plus / total for this association, null when total is zero. */
  share90Plus: number | null
  /** This association's share of total portfolio AR. */
  shareOfPortfolio: number | null
}

export type ArStats = {
  communityCount: number
  total: number
  current: number
  days30: number
  days60: number
  days90Plus: number
  share90Plus: number | null
  /** Oldest and newest "latest snapshot" dates; differ when associations were exported on different days. */
  asOfMin: string
  asOfMax: string
  topBy90Plus: ArCommunityLine[]
  topByTotal: ArCommunityLine[]
  concentration: { top5Share: number | null; top10Share: number | null }
}

/** The most recent snapshot per community (by as_of). */
export function latestSnapshotPerCommunity<S extends Pick<ArSnapshotInput, 'community_id' | 'as_of'>>(
  snapshots: S[],
): Map<string, S> {
  const latest = new Map<string, S>()
  for (const s of snapshots) {
    const cur = latest.get(s.community_id)
    if (!cur || s.as_of > cur.as_of) latest.set(s.community_id, s)
  }
  return latest
}

/** AR totals from the latest snapshot of each portfolio (non-test) community. Null when there is none. */
export function computeArStats(
  snapshots: ArSnapshotInput[],
  communities: CommunityInput[],
  options: { top?: number } = {},
): ArStats | null {
  const top = options.top ?? 10
  const portfolio = byIdMap(portfolioCommunities(communities))
  const latest = latestSnapshotPerCommunity(snapshots.filter((s) => portfolio.has(s.community_id)))
  if (latest.size === 0) return null

  let total = 0
  let current = 0
  let days30 = 0
  let days60 = 0
  let days90Plus = 0
  let asOfMin = ''
  let asOfMax = ''
  const lines: Omit<ArCommunityLine, 'shareOfPortfolio'>[] = []

  for (const [communityId, s] of latest) {
    const t = num(s.total) ?? 0
    const d90 = num(s.days_90_plus) ?? 0
    total += t
    current += num(s.current_due) ?? 0
    days30 += num(s.days_30) ?? 0
    days60 += num(s.days_60) ?? 0
    days90Plus += d90
    if (!asOfMin || s.as_of < asOfMin) asOfMin = s.as_of
    if (!asOfMax || s.as_of > asOfMax) asOfMax = s.as_of
    lines.push({
      communityId,
      name: portfolio.get(communityId)!.name,
      asOf: s.as_of,
      total: t,
      days90Plus: d90,
      share90Plus: ratio(d90, t),
    })
  }

  const withShare = lines.map((l) => ({ ...l, shareOfPortfolio: ratio(l.total, total) }))
  const byTotal = [...withShare].sort((a, b) => b.total - a.total)
  const sumTop = (n: number) => byTotal.slice(0, n).reduce((s, l) => s + l.total, 0)

  return {
    communityCount: latest.size,
    total,
    current,
    days30,
    days60,
    days90Plus,
    share90Plus: ratio(days90Plus, total),
    asOfMin,
    asOfMax,
    topBy90Plus: [...withShare]
      .filter((l) => l.days90Plus > 0)
      .sort((a, b) => b.days90Plus - a.days90Plus)
      .slice(0, top),
    topByTotal: byTotal.slice(0, top),
    concentration: { top5Share: ratio(sumTop(5), total), top10Share: ratio(sumTop(10), total) },
  }
}
