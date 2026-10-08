// Retention risk per association.
//
// THIS IS A HEURISTIC, NOT A PREDICTION. The signals are facts from Vantaca data;
// the points attached to them are hand-set weights chosen to rank associations for
// a manager's attention. They have not been fit to historical churn and should not
// be presented as a probability of losing a client. Change the weights here (and
// only here) if the ranking does not match what managers see on the ground.
//
// Signals (max 100 points):
//   ar_90_share   Share of the association's homeowner AR that is 90+ days.     >=25%: 30, >=10%: 15
//   ar_90_trend   Growth in 90+ AR vs a snapshot at least 28 days older.         >=25% and >=$1,000: 20
//   aged_items    Open action items open 60+ days.                               >=10: 30, >=3: 15
//   aged_share    Share of open action items that are 60+ days (min 4 open).     >=50%: 20
// Bands: score >= 50 elevated, >= 25 watch, otherwise low.

import { isOpenItem, itemAgeDays, AGED_ITEM_DAYS, type ActionItemInput } from './action-items'
import { latestSnapshotPerCommunity, type ArSnapshotInput } from './ar'
import { activeCommunities, addDays, num, parseDate, ratio, type CommunityInput } from './shared'

export const RETENTION_WEIGHTS = {
  ar90ShareHigh: { threshold: 0.25, points: 30 },
  ar90ShareMid: { threshold: 0.1, points: 15 },
  ar90Trend: { minGrowth: 0.25, minDollars: 1000, minGapDays: 28, points: 20 },
  agedItemsHigh: { threshold: 10, points: 30 },
  agedItemsMid: { threshold: 3, points: 15 },
  agedShare: { threshold: 0.5, minOpen: 4, points: 20 },
} as const

export const RETENTION_BANDS = { elevated: 50, watch: 25 } as const

export type RetentionSignal = {
  key: 'ar_90_share' | 'ar_90_trend' | 'aged_items' | 'aged_share'
  label: string
  /** Raw measured value (a share 0..1, a count, or a growth ratio); null when not measurable. */
  value: number | null
  points: number
  maxPoints: number
  /** Plain-English statement of what was measured. */
  explanation: string
}

export type RetentionRisk = {
  communityId: string
  name: string
  manager: string | null
  doors: number | null
  score: number
  band: 'elevated' | 'watch' | 'low'
  signals: RetentionSignal[]
  /** Signals that could not be measured for this association, and why. */
  dataGaps: string[]
}

export type RetentionResult = {
  method: string
  scored: RetentionRisk[]
  /** Active associations with no AR snapshot and no action-item data. */
  unscoredCount: number
}

const pct = (v: number) => `${Math.round(v * 100)}%`
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`

export const RETENTION_METHOD =
  'Heuristic ranking from Vantaca AR aging and action items. Points are hand-set weights documented in src/lib/intelligence/retention.ts, not a churn probability.'

export function scoreRetentionRisk(input: {
  communities: CommunityInput[]
  snapshots: ArSnapshotInput[]
  items: ActionItemInput[]
  /** True when any action items were imported at all, so "zero open items" is a real zero. */
  actionItemsImported: boolean
  now: Date
}): RetentionResult {
  const { communities, snapshots, items, actionItemsImported, now } = input
  const active = activeCommunities(communities)
  const activeIds = new Set(active.map((c) => c.id))

  const snapsByCommunity = new Map<string, ArSnapshotInput[]>()
  for (const s of snapshots) {
    if (!activeIds.has(s.community_id)) continue
    const list = snapsByCommunity.get(s.community_id) ?? []
    list.push(s)
    snapsByCommunity.set(s.community_id, list)
  }
  const latest = latestSnapshotPerCommunity(snapshots.filter((s) => activeIds.has(s.community_id)))

  const openByCommunity = new Map<string, { open: number; aged: number }>()
  for (const item of items) {
    if (!item.community_id || !activeIds.has(item.community_id) || !isOpenItem(item)) continue
    const agg = openByCommunity.get(item.community_id) ?? { open: 0, aged: 0 }
    agg.open++
    const age = itemAgeDays(item, now)
    if (age !== null && age >= AGED_ITEM_DAYS) agg.aged++
    openByCommunity.set(item.community_id, agg)
  }

  const W = RETENTION_WEIGHTS
  const scored: RetentionRisk[] = []
  let unscoredCount = 0

  for (const c of active) {
    const snap = latest.get(c.id)
    if (!snap && !actionItemsImported) {
      unscoredCount++
      continue
    }
    const signals: RetentionSignal[] = []
    const dataGaps: string[] = []

    // AR signals
    if (snap) {
      const total = num(snap.total) ?? 0
      const d90 = num(snap.days_90_plus) ?? 0
      const share = ratio(d90, total)
      const points =
        share === null ? 0 : share >= W.ar90ShareHigh.threshold ? W.ar90ShareHigh.points : share >= W.ar90ShareMid.threshold ? W.ar90ShareMid.points : 0
      signals.push({
        key: 'ar_90_share',
        label: 'Homeowner AR 90+ days',
        value: share,
        points,
        maxPoints: W.ar90ShareHigh.points,
        explanation:
          share === null
            ? `No homeowner AR balance on the ${snap.as_of} snapshot.`
            : `${pct(share)} of ${usd(total)} homeowner AR is 90+ days (${usd(d90)}) as of ${snap.as_of}.`,
      })

      const cutoff = addDays(parseDate(snap.as_of)!, -W.ar90Trend.minGapDays)
      const prior = (snapsByCommunity.get(c.id) ?? [])
        .filter((s) => parseDate(s.as_of)! <= cutoff)
        .sort((a, b) => (a.as_of < b.as_of ? 1 : -1))[0]
      if (prior) {
        const before = num(prior.days_90_plus) ?? 0
        const growth = before > 0 ? (d90 - before) / before : d90 > 0 ? null : 0
        const grew = d90 - before >= W.ar90Trend.minDollars && (growth === null || growth >= W.ar90Trend.minGrowth)
        signals.push({
          key: 'ar_90_trend',
          label: '90+ AR trend',
          value: growth,
          points: grew ? W.ar90Trend.points : 0,
          maxPoints: W.ar90Trend.points,
          explanation: `90+ AR went from ${usd(before)} on ${prior.as_of} to ${usd(d90)} on ${snap.as_of}.`,
        })
      } else {
        dataGaps.push(`No AR snapshot ${W.ar90Trend.minGapDays}+ days before ${snap.as_of}, so the 90+ trend is not measured.`)
      }
    } else {
      dataGaps.push('No Vantaca AR aging snapshot for this association.')
    }

    // Action-item signals
    if (actionItemsImported) {
      const agg = openByCommunity.get(c.id) ?? { open: 0, aged: 0 }
      const agedPoints =
        agg.aged >= W.agedItemsHigh.threshold ? W.agedItemsHigh.points : agg.aged >= W.agedItemsMid.threshold ? W.agedItemsMid.points : 0
      signals.push({
        key: 'aged_items',
        label: `Action items open ${AGED_ITEM_DAYS}+ days`,
        value: agg.aged,
        points: agedPoints,
        maxPoints: W.agedItemsHigh.points,
        explanation: `${agg.aged} of ${agg.open} open action items have been open ${AGED_ITEM_DAYS}+ days.`,
      })
      const share = agg.open >= W.agedShare.minOpen ? ratio(agg.aged, agg.open) : null
      signals.push({
        key: 'aged_share',
        label: `Share of open items ${AGED_ITEM_DAYS}+ days`,
        value: share,
        points: share !== null && share >= W.agedShare.threshold ? W.agedShare.points : 0,
        maxPoints: W.agedShare.points,
        explanation:
          share === null
            ? `Fewer than ${W.agedShare.minOpen} open items, so the aged share is not scored.`
            : `${pct(share)} of open action items are ${AGED_ITEM_DAYS}+ days old.`,
      })
    } else {
      dataGaps.push('No Vantaca action items imported.')
    }

    const score = Math.min(100, signals.reduce((s, sig) => s + sig.points, 0))
    scored.push({
      communityId: c.id,
      name: c.name,
      manager: c.manager_name,
      doors: c.doors,
      score,
      band: score >= RETENTION_BANDS.elevated ? 'elevated' : score >= RETENTION_BANDS.watch ? 'watch' : 'low',
      signals,
      dataGaps,
    })
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return { method: RETENTION_METHOD, scored, unscoredCount }
}
