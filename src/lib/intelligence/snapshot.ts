// One read of everything the dashboards, the admin intelligence API and the Notion
// report need. Each section is null when its source has no data yet, so callers
// can say which source to connect instead of showing zeros.

import type { AdminClient } from '@/lib/supabase/admin'
import { computeActionItemAging, type ActionItemAging } from './action-items'
import { computeArStats, type ArStats } from './ar'
import { matchCrossSell, type CrossSellResult } from './cross-sell'
import {
  countActionItems,
  countDeals,
  loadActionItems,
  loadArSnapshots,
  loadCommunities,
  loadCompanies,
  loadDeals,
  loadPnl,
  loadQboConnections,
} from './load'
import { computePipelineStats, type PipelineStats } from './pipeline'
import { computePricingBenchmarks, type PricingBenchmarks } from './pricing'
import { scoreRetentionRisk, type RetentionResult } from './retention'
import { trailingRevenueByCompany, trailingWindow, type CompanyRevenue, type TrailingWindow } from './revenue'
import { activeCommunities } from './shared'
import { computeManagerWorkload, type ManagerWorkload } from './workload'

export type IntelligenceSnapshot = {
  generatedAt: string
  sources: {
    /** Portfolio (non-test) communities imported from Vantaca. */
    communities: number
    activeCommunities: number
    arSnapshots: boolean
    actionItems: boolean
    hubspotDeals: boolean
    qboConnectedCompanyIds: string[]
  }
  pipeline: PipelineStats | null
  ar: ArStats | null
  aging: ActionItemAging | null
  retention: RetentionResult | null
  crossSell: CrossSellResult | null
  pricing: PricingBenchmarks | null
  workload: ManagerWorkload[] | null
  revenue: { window: TrailingWindow; companies: CompanyRevenue[] }
}

export async function buildIntelligenceSnapshot(db: AdminClient, now = new Date()): Promise<IntelligenceSnapshot> {
  const window = trailingWindow(now)
  const [communities, snapshots, items, itemCount, deals, dealCount, companies, connections, pnl] = await Promise.all([
    loadCommunities(db),
    loadArSnapshots(db),
    loadActionItems(db, now),
    countActionItems(db),
    loadDeals(db, now),
    countDeals(db),
    loadCompanies(db),
    loadQboConnections(db),
    loadPnl(db, window.start),
  ])

  const hasCommunities = communities.length > 0
  const actionItemsImported = itemCount > 0
  const ar = computeArStats(snapshots, communities)
  const retention =
    hasCommunities && (ar !== null || actionItemsImported)
      ? scoreRetentionRisk({ communities, snapshots, items, actionItemsImported, now })
      : null

  return {
    generatedAt: now.toISOString(),
    sources: {
      communities: communities.length,
      activeCommunities: activeCommunities(communities).length,
      arSnapshots: ar !== null,
      actionItems: actionItemsImported,
      hubspotDeals: dealCount > 0,
      qboConnectedCompanyIds: connections.map((c) => c.company_id),
    },
    pipeline: dealCount > 0 ? computePipelineStats(deals, now) : null,
    ar,
    aging: actionItemsImported ? computeActionItemAging(items, communities, now) : null,
    retention,
    crossSell: actionItemsImported && hasCommunities ? matchCrossSell(items, communities, now) : null,
    pricing: computePricingBenchmarks(communities),
    workload: hasCommunities ? computeManagerWorkload(communities, items, snapshots, now) : null,
    revenue: trailingRevenueByCompany(pnl, companies, now),
  }
}
