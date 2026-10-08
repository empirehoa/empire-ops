/**
 * Agent: Sales intelligence
 * POST /api/automation/sales-intelligence (x-automation-secret)
 *
 * Reads HubSpot deals (crm_deals) and reports open pipeline value, weighted
 * value (amount x stage probability), stale deals (open, no HubSpot update in
 * 14+ days) and win rate by count and by dollars over the trailing 365 days.
 * Skips, naming HubSpot, when no deals have been synced.
 */

import type { NextRequest } from 'next/server'
import { count, pct, usd } from '@/lib/intelligence/format'
import { countDeals, loadDeals } from '@/lib/intelligence/load'
import { computePipelineStats, STALE_DEAL_DAYS } from '@/lib/intelligence/pipeline'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 60

/** Warn when at least this share of open deals is stale (alert threshold, a judgment call). */
const STALE_SHARE_WARNING = 0.25

export async function POST(request: NextRequest) {
  return runAgent(request, 'sales-intelligence', async (db, now) => {
    if ((await countDeals(db)) === 0) {
      return {
        status: 'skipped',
        headline:
          'Skipped: no HubSpot deals in the database. Connect HubSpot (set HUBSPOT_ACCESS_TOKEN) and run a sync from /admin/integrations.',
      }
    }

    const stats = computePipelineStats(await loadDeals(db, now), now)
    const { winRate } = stats
    const winLine =
      winRate.closedCount === 0
        ? 'No deals closed in the trailing 365 days.'
        : `Win rate over the trailing 365 days: ${pct(winRate.byCount)} of ${count(winRate.closedCount)} closed deals, ${pct(winRate.byValue)} of closed dollars.`
    const headline = [
      `Open pipeline ${usd(stats.openValue)} across ${count(stats.openCount)} deals (${usd(stats.weightedValue)} weighted by stage probability).`,
      `${count(stats.staleCount)} open deals have had no HubSpot update in ${STALE_DEAL_DAYS}+ days.`,
      winLine,
    ].join(' ')

    const notes: string[] = []
    if (stats.openMissingAmount) notes.push(`${stats.openMissingAmount} open deals have no amount in HubSpot and are not in the pipeline value.`)
    if (stats.openMissingProbability) notes.push(`${stats.openMissingProbability} open deals have no stage probability and are not in the weighted value.`)
    if (stats.openMissingUpdateDate) notes.push(`${stats.openMissingUpdateDate} open deals have no last-modified date, so staleness is unknown.`)
    if (winRate.closedMissingCloseDate) notes.push(`${winRate.closedMissingCloseDate} closed deals have no close date and are left out of the win rate.`)

    const staleShare = stats.openCount > 0 ? stats.staleCount / stats.openCount : 0
    return {
      status: 'succeeded',
      headline,
      severity: staleShare >= STALE_SHARE_WARNING ? 'warning' : 'healthy',
      metrics: {
        open_deals: stats.openCount,
        open_value: stats.openValue,
        weighted_value: stats.weightedValue,
        stale_deals: stats.staleCount,
        stale_value: stats.staleValue,
        closed_deals_365d: winRate.closedCount,
        win_rate_by_count: winRate.byCount,
        win_rate_by_value: winRate.byValue,
      },
      findings: { stale_deals: stats.staleDeals.slice(0, 25), by_stage: stats.byStage, notes },
      discordFields: {
        'Open pipeline': usd(stats.openValue),
        Weighted: usd(stats.weightedValue),
        'Open deals': count(stats.openCount),
        [`Stale (${STALE_DEAL_DAYS}+ days)`]: count(stats.staleCount),
        'Win rate, deals': pct(winRate.byCount),
        'Win rate, dollars': pct(winRate.byValue),
      },
    }
  })
}
