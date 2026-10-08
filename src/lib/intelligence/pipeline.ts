// Sales pipeline statistics from HubSpot deals (crm_deals).

import type { CrmDealRow } from '@/lib/types/database'
import { addDays, daysBetween, num, parseDate, ratio } from './shared'

export type DealInput = Pick<
  CrmDealRow,
  | 'id'
  | 'name'
  | 'stage_label'
  | 'stage_probability'
  | 'is_closed'
  | 'is_won'
  | 'amount'
  | 'close_date'
  | 'owner_name'
  | 'updated_at_source'
>

/** An open deal with no HubSpot update for this many days counts as stale. */
export const STALE_DEAL_DAYS = 14
/** Win rate looks at deals whose close date falls in this trailing window. */
export const WIN_RATE_WINDOW_DAYS = 365

export type StaleDeal = {
  id: string
  name: string
  stage: string
  owner: string | null
  amount: number | null
  daysSinceUpdate: number
}

export type StageSummary = { stage: string; count: number; value: number; weightedValue: number }

export type PipelineStats = {
  openCount: number
  openValue: number
  weightedValue: number
  /** Open deals with no amount in HubSpot (count toward openCount, not openValue). */
  openMissingAmount: number
  /** Open deals with no stage probability (count toward openValue, not weightedValue). */
  openMissingProbability: number
  staleCount: number
  staleValue: number
  staleDeals: StaleDeal[]
  /** Open deals whose HubSpot last-modified date is missing; not counted as stale or fresh. */
  openMissingUpdateDate: number
  byStage: StageSummary[]
  winRate: {
    windowDays: number
    closedCount: number
    wonCount: number
    /** won / closed by deal count, or null when nothing closed in the window. */
    byCount: number | null
    closedValue: number
    wonValue: number
    /** won $ / closed $ (deals with an amount only), or null when no closed dollars. */
    byValue: number | null
    /** Closed deals with no close date; excluded from the win rate. */
    closedMissingCloseDate: number
  }
}

export function computePipelineStats(deals: DealInput[], now: Date): PipelineStats {
  const open = deals.filter((d) => !d.is_closed)
  let openValue = 0
  let weightedValue = 0
  let openMissingAmount = 0
  let openMissingProbability = 0
  let openMissingUpdateDate = 0
  const stale: StaleDeal[] = []
  const stages = new Map<string, StageSummary>()

  for (const d of open) {
    const amount = num(d.amount)
    const prob = num(d.stage_probability)
    if (amount === null) openMissingAmount++
    else openValue += amount
    if (prob === null) openMissingProbability++
    const weighted = amount !== null && prob !== null ? amount * prob : 0
    weightedValue += weighted

    const stage = d.stage_label?.trim() || 'Unlabeled stage'
    const s = stages.get(stage) ?? { stage, count: 0, value: 0, weightedValue: 0 }
    s.count++
    s.value += amount ?? 0
    s.weightedValue += weighted
    stages.set(stage, s)

    const updated = parseDate(d.updated_at_source)
    if (!updated) {
      openMissingUpdateDate++
      continue
    }
    const days = daysBetween(updated, now)
    if (days >= STALE_DEAL_DAYS) {
      stale.push({ id: d.id, name: d.name, stage, owner: d.owner_name, amount, daysSinceUpdate: days })
    }
  }

  stale.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0) || b.daysSinceUpdate - a.daysSinceUpdate)

  const windowStart = addDays(now, -WIN_RATE_WINDOW_DAYS)
  let closedCount = 0
  let wonCount = 0
  let closedValue = 0
  let wonValue = 0
  let closedMissingCloseDate = 0
  for (const d of deals) {
    if (!d.is_closed) continue
    const closed = parseDate(d.close_date)
    if (!closed) {
      closedMissingCloseDate++
      continue
    }
    if (closed <= windowStart || closed > now) continue
    const amount = num(d.amount)
    closedCount++
    if (amount !== null) closedValue += amount
    if (d.is_won) {
      wonCount++
      if (amount !== null) wonValue += amount
    }
  }

  return {
    openCount: open.length,
    openValue,
    weightedValue,
    openMissingAmount,
    openMissingProbability,
    staleCount: stale.length,
    staleValue: stale.reduce((s, d) => s + (d.amount ?? 0), 0),
    staleDeals: stale,
    openMissingUpdateDate,
    byStage: [...stages.values()].sort((a, b) => b.value - a.value),
    winRate: {
      windowDays: WIN_RATE_WINDOW_DAYS,
      closedCount,
      wonCount,
      byCount: ratio(wonCount, closedCount),
      closedValue,
      wonValue,
      byValue: ratio(wonValue, closedValue),
      closedMissingCloseDate,
    },
  }
}
