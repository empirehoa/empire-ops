/**
 * Agent: Cross-sell
 * POST /api/automation/cross-sell (x-automation-secret)
 *
 * Matches Vantaca action items (open, or opened in the last 90 days) whose
 * category or type mentions work the sister companies do:
 *   water/leak/mold/flood/fire/storm                         -> Wind Fire & Water
 *   repair/maintenance/handyman/landscape/paint/pressure wash -> FixIQ
 *   sale/resale/estoppel/closing                               -> Riance Realty
 * Matches are conversation leads per association; no dollar values are estimated.
 * Skips when no action items or communities are imported.
 */

import type { NextRequest } from 'next/server'
import { matchCrossSell } from '@/lib/intelligence/cross-sell'
import { count } from '@/lib/intelligence/format'
import { countActionItems, loadActionItems, loadCommunities } from '@/lib/intelligence/load'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  return runAgent(request, 'cross-sell', async (db, now) => {
    const [itemCount, communities] = await Promise.all([countActionItems(db), loadCommunities(db)])
    if (itemCount === 0) {
      return {
        status: 'skipped',
        headline: 'Skipped: no Vantaca action items imported. Upload an action item export at /admin/imports.',
      }
    }
    if (communities.length === 0) {
      return {
        status: 'skipped',
        headline:
          'Skipped: no Vantaca communities imported, so action items cannot be tied to associations. Upload the community list at /admin/imports.',
      }
    }

    const result = matchCrossSell(await loadActionItems(db, now), communities, now)
    const associations = new Set(result.byCommunity.map((m) => m.communityId)).size
    const headline =
      `${count(result.totalMatches)} cross-sell signals in ${count(associations)} associations from action items open or opened in the last ${result.windowDays} days: ` +
      result.byCompany.map((c) => `${c.companyName} ${count(c.matches)}`).join(', ') +
      '. Leads for a conversation, not revenue estimates.'

    const discordFields: Record<string, string> = {}
    for (const c of result.byCompany) discordFields[c.companyName] = `${count(c.matches)} in ${count(c.communities)} associations`

    const metrics: Record<string, number> = { total_matches: result.totalMatches, associations }
    for (const c of result.byCompany) metrics[`${c.company}_matches`] = c.matches

    return {
      status: 'succeeded',
      headline,
      metrics,
      findings: { window_days: result.windowDays, by_company: result.byCompany, by_community: result.byCommunity.slice(0, 50) },
      discordFields,
    }
  })
}
