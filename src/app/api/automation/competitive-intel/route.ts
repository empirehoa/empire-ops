/**
 * Agent: Fee benchmarks (route name kept as competitive-intel)
 * POST /api/automation/competitive-intel (x-automation-secret)
 *
 * INTERNAL BENCHMARKS ONLY. Computes EMG's own monthly management fee per door
 * by association size band from the Vantaca community list. There is no market
 * or competitor data in this system, so the report makes no market claims.
 * Skips when no active association has both doors and a monthly fee.
 */

import type { NextRequest } from 'next/server'
import { count, usd } from '@/lib/intelligence/format'
import { loadCommunities } from '@/lib/intelligence/load'
import { computePricingBenchmarks } from '@/lib/intelligence/pricing'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  return runAgent(request, 'competitive-intel', async (db) => {
    const pricing = computePricingBenchmarks(await loadCommunities(db))
    if (!pricing) {
      return {
        status: 'skipped',
        headline:
          'Skipped: no active Vantaca community has both a door count and a monthly management fee. Import the community list with those columns at /admin/imports.',
      }
    }

    const bands = pricing.bands.filter((b) => b.count > 0)
    const headline = [
      `Internal benchmark (EMG data only, no market comparison): ${usd(pricing.weightedFeePerDoor, 2)} per door per month across ${count(pricing.communityCount)} associations and ${count(pricing.totalDoors)} doors; median association ${usd(pricing.medianFeePerDoor, 2)}.`,
      `Median by size: ${bands.map((b) => `${b.label} ${usd(b.median, 2)} (${b.count})`).join(', ')}.`,
      pricing.lowestQuartile.length > 0
        ? `${count(pricing.lowestQuartile.length)} associations are below the 25th percentile of their size band.`
        : '',
      pricing.missingFee || pricing.missingDoors
        ? `Not included: ${count(pricing.missingFee)} associations with no fee, ${count(pricing.missingDoors)} with no door count.`
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    const discordFields: Record<string, string> = {
      'Fee per door (portfolio)': usd(pricing.weightedFeePerDoor, 2),
      Associations: count(pricing.communityCount),
    }
    for (const b of bands) discordFields[b.label] = `${usd(b.median, 2)} median (${b.count})`

    return {
      status: 'succeeded',
      headline,
      metrics: {
        communities: pricing.communityCount,
        doors: pricing.totalDoors,
        monthly_fees: pricing.totalMonthlyFees,
        weighted_fee_per_door: pricing.weightedFeePerDoor,
        median_fee_per_door: pricing.medianFeePerDoor,
        missing_fee: pricing.missingFee,
        missing_doors: pricing.missingDoors,
      },
      findings: {
        label: pricing.label,
        bands: pricing.bands,
        lowest_quartile: pricing.lowestQuartile.slice(0, 25).map((p) => ({
          community: p.name,
          manager: p.manager,
          doors: p.doors,
          fee_per_door: p.feePerDoor,
          band_p25: p.bandP25,
        })),
      },
      discordFields,
    }
  })
}
