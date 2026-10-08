/**
 * Agent: Client retention
 * POST /api/automation/client-retention (x-automation-secret)
 *
 * Ranks active associations by a heuristic retention-risk score built from
 * Vantaca AR aging (90+ share and trend) and action items (items open 60+ days).
 * Every point is tied to a stated signal; the weights are documented in
 * src/lib/intelligence/retention.ts and are not a churn probability.
 * Skips when no Vantaca communities, or no AR aging and no action items, are imported.
 */

import type { NextRequest } from 'next/server'
import { count } from '@/lib/intelligence/format'
import { countActionItems, loadActionItems, loadArSnapshots, loadCommunities } from '@/lib/intelligence/load'
import { scoreRetentionRisk } from '@/lib/intelligence/retention'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  return runAgent(request, 'client-retention', async (db, now) => {
    const communities = await loadCommunities(db)
    if (communities.length === 0) {
      return {
        status: 'skipped',
        headline: 'Skipped: no Vantaca communities imported. Upload the community list at /admin/imports.',
      }
    }
    const [snapshots, items, itemCount] = await Promise.all([
      loadArSnapshots(db),
      loadActionItems(db, now),
      countActionItems(db),
    ])
    if (snapshots.length === 0 && itemCount === 0) {
      return {
        status: 'skipped',
        headline: 'Skipped: no Vantaca AR aging or action items imported. Upload either export at /admin/imports.',
      }
    }

    const result = scoreRetentionRisk({ communities, snapshots, items, actionItemsImported: itemCount > 0, now })
    const elevated = result.scored.filter((r) => r.band === 'elevated')
    const watch = result.scored.filter((r) => r.band === 'watch')
    const top = result.scored[0]
    const headline = [
      `${count(result.scored.length)} associations scored: ${count(elevated.length)} elevated, ${count(watch.length)} watch.`,
      top && top.score > 0 ? `Highest: ${top.name} (${top.score} of 100).` : 'No association triggered a risk signal.',
      'Heuristic ranking for manager attention, not a churn prediction.',
    ].join(' ')

    return {
      status: 'succeeded',
      headline,
      severity: elevated.length > 0 ? 'warning' : 'healthy',
      metrics: {
        scored: result.scored.length,
        elevated: elevated.length,
        watch: watch.length,
        unscored: result.unscoredCount,
      },
      findings: {
        method: result.method,
        top: result.scored
          .filter((r) => r.score > 0)
          .slice(0, 20)
          .map((r) => ({
            community: r.name,
            manager: r.manager,
            score: r.score,
            band: r.band,
            signals: r.signals.filter((s) => s.points > 0).map((s) => ({ signal: s.label, points: s.points, detail: s.explanation })),
            data_gaps: r.dataGaps,
          })),
      },
      discordFields: {
        Scored: count(result.scored.length),
        Elevated: count(elevated.length),
        Watch: count(watch.length),
      },
    }
  })
}
