/**
 * GET /api/admin/intelligence/pricing
 *
 * Pricing benchmarks and analysis for the Riance LLC / Empire Management
 * portfolio. Calculates per-door management fees, tier distribution,
 * revenue-per-door comparison, and flags under-priced communities.
 *
 * Data sources (in priority order):
 *   1. contracts.monthly_fee — explicit contracted fees per association
 *   2. assessment_schedules — recurring billing amounts per association
 *   3. charges — actual collected revenue as fallback
 *
 * Requires super_admin or tenant_admin role.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRoutePermission } from '@/lib/auth/rbac'

// ---------------------------------------------------------------------------
// Size tiers
// ---------------------------------------------------------------------------

type SizeTier = 'small' | 'medium' | 'large' | 'enterprise'

function getSizeTier(unitCount: number): SizeTier {
  if (unitCount <= 50) return 'small'
  if (unitCount <= 150) return 'medium'
  if (unitCount <= 500) return 'large'
  return 'enterprise'
}

const TIER_LABELS: Record<SizeTier, string> = {
  small: '1-50 units',
  medium: '51-150 units',
  large: '151-500 units',
  enterprise: '500+ units',
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 10000) / 100
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  const supabase = await createClient()
  const tenantId = auth.tenantId

  // Trailing-12-month window for revenue calculation
  const today = new Date()
  const twelveMonthsAgo = new Date(today)
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  const t12Start = twelveMonthsAgo.toISOString().split('T')[0]

  // ---- Parallel data fetches ----------------------------------------------
  const [
    assocResult,
    contractsResult,
    schedulesResult,
    chargesResult,
  ] = await Promise.all([
    // All associations
    supabase
      .from('associations')
      .select('id, name, city, county, unit_count, status')
      .eq('tenant_id', tenantId)
      .order('name'),

    // Active contracts with monthly_fee
    supabase
      .from('contracts')
      .select('id, association_id, monthly_fee, status, term_start_date, term_end_date, schedule_b_items')
      .eq('tenant_id', tenantId)
      .in('status', ['active', 'signed']),

    // Active assessment schedules (for management fee calculation)
    supabase
      .from('assessment_schedules')
      .select('id, association_id, name, amount, frequency, schedule_type, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    // Trailing 12-month charges (actual revenue)
    supabase
      .from('charges')
      .select('association_id, amount, amount_paid, charge_date')
      .eq('tenant_id', tenantId)
      .neq('status', 'voided')
      .gte('charge_date', t12Start),
  ])

  const associations = assocResult.data ?? []
  const contracts = contractsResult.data ?? []
  const schedules = schedulesResult.data ?? []
  const charges = chargesResult.data ?? []

  // ========================================================================
  // Build per-association pricing data
  // ========================================================================

  // Contract monthly fee by association
  const contractFeeByAssoc: Record<string, number> = {}
  for (const c of contracts) {
    if (c.association_id && c.monthly_fee) {
      // Take the highest fee if multiple contracts exist
      contractFeeByAssoc[c.association_id] = Math.max(
        contractFeeByAssoc[c.association_id] ?? 0,
        c.monthly_fee
      )
    }
  }

  // Assessment schedule total monthly amount by association
  const scheduleFeeByAssoc: Record<string, number> = {}
  for (const s of schedules) {
    let monthlyAmount = s.amount
    // Normalize to monthly
    if (s.frequency === 'quarterly') monthlyAmount = s.amount / 3
    else if (s.frequency === 'annually' || s.frequency === 'annual') monthlyAmount = s.amount / 12
    else if (s.frequency === 'semi-annually' || s.frequency === 'semi_annual') monthlyAmount = s.amount / 6

    scheduleFeeByAssoc[s.association_id] = (scheduleFeeByAssoc[s.association_id] ?? 0) + monthlyAmount
  }

  // Trailing 12-month collected revenue by association
  const t12RevenueByAssoc: Record<string, number> = {}
  for (const c of charges) {
    t12RevenueByAssoc[c.association_id] = (t12RevenueByAssoc[c.association_id] ?? 0) + c.amount_paid
  }

  // ========================================================================
  // Per-community pricing analysis
  // ========================================================================

  type CommunityPricing = {
    association_id: string
    name: string
    city: string
    county: string
    unit_count: number
    size_tier: SizeTier
    monthly_fee: number | null
    fee_source: 'contract' | 'assessment_schedule' | 'revenue_estimate' | 'unknown'
    fee_per_door: number | null
    annual_revenue_t12: number
    revenue_per_door_t12: number
    has_contract: boolean
    is_under_priced: boolean
    pricing_gap: number | null // difference from tier median
  }

  const communityPricing: CommunityPricing[] = []

  for (const a of associations) {
    const unitCount = a.unit_count ?? 0
    if (unitCount === 0) continue // skip associations with no units

    // Determine monthly fee (priority: contract > schedule > estimate)
    let monthlyFee: number | null = null
    let feeSource: CommunityPricing['fee_source'] = 'unknown'

    if (contractFeeByAssoc[a.id]) {
      monthlyFee = contractFeeByAssoc[a.id]
      feeSource = 'contract'
    } else if (scheduleFeeByAssoc[a.id]) {
      monthlyFee = scheduleFeeByAssoc[a.id]
      feeSource = 'assessment_schedule'
    } else if (t12RevenueByAssoc[a.id]) {
      // Estimate monthly from trailing 12-month revenue
      monthlyFee = t12RevenueByAssoc[a.id] / 12
      feeSource = 'revenue_estimate'
    }

    const feePerDoor = monthlyFee ? Math.round((monthlyFee / unitCount) * 100) / 100 : null
    const annualT12 = t12RevenueByAssoc[a.id] ?? 0
    const revenuePerDoorT12 = unitCount > 0 ? Math.round((annualT12 / unitCount) * 100) / 100 : 0

    communityPricing.push({
      association_id: a.id,
      name: a.name,
      city: a.city ?? 'Unknown',
      county: a.county ?? 'Unknown',
      unit_count: unitCount,
      size_tier: getSizeTier(unitCount),
      monthly_fee: monthlyFee ? Math.round(monthlyFee * 100) / 100 : null,
      fee_source: feeSource,
      fee_per_door: feePerDoor,
      annual_revenue_t12: Math.round(annualT12 * 100) / 100,
      revenue_per_door_t12: revenuePerDoorT12,
      has_contract: !!contractFeeByAssoc[a.id],
      is_under_priced: false, // computed below after we have tier medians
      pricing_gap: null,
    })
  }

  // ========================================================================
  // Tier-level benchmarks
  // ========================================================================

  type TierBenchmark = {
    tier: SizeTier
    label: string
    community_count: number
    total_units: number
    avg_fee_per_door: number
    median_fee_per_door: number
    min_fee_per_door: number
    max_fee_per_door: number
    avg_revenue_per_door_t12: number
    total_monthly_revenue: number
  }

  const tiers: SizeTier[] = ['small', 'medium', 'large', 'enterprise']
  const tierBenchmarks: TierBenchmark[] = []

  for (const tier of tiers) {
    const tierCommunities = communityPricing.filter((c) => c.size_tier === tier)
    const feesPerDoor = tierCommunities
      .map((c) => c.fee_per_door)
      .filter((f): f is number => f !== null && f > 0)

    const revenuePerDoor = tierCommunities.map((c) => c.revenue_per_door_t12).filter((r) => r > 0)
    const totalUnits = tierCommunities.reduce((sum, c) => sum + c.unit_count, 0)
    const totalMonthly = tierCommunities.reduce((sum, c) => sum + (c.monthly_fee ?? 0), 0)

    const avgFee = feesPerDoor.length > 0
      ? Math.round((feesPerDoor.reduce((s, f) => s + f, 0) / feesPerDoor.length) * 100) / 100
      : 0
    const medFee = Math.round(median(feesPerDoor) * 100) / 100
    const minFee = feesPerDoor.length > 0 ? Math.round(Math.min(...feesPerDoor) * 100) / 100 : 0
    const maxFee = feesPerDoor.length > 0 ? Math.round(Math.max(...feesPerDoor) * 100) / 100 : 0
    const avgRevPerDoor = revenuePerDoor.length > 0
      ? Math.round((revenuePerDoor.reduce((s, r) => s + r, 0) / revenuePerDoor.length) * 100) / 100
      : 0

    tierBenchmarks.push({
      tier,
      label: TIER_LABELS[tier],
      community_count: tierCommunities.length,
      total_units: totalUnits,
      avg_fee_per_door: avgFee,
      median_fee_per_door: medFee,
      min_fee_per_door: minFee,
      max_fee_per_door: maxFee,
      avg_revenue_per_door_t12: avgRevPerDoor,
      total_monthly_revenue: Math.round(totalMonthly * 100) / 100,
    })
  }

  // ========================================================================
  // Flag under-priced communities (below 75% of tier median)
  // ========================================================================

  const tierMedianMap = new Map(tierBenchmarks.map((t) => [t.tier, t.median_fee_per_door]))

  const underPriced: CommunityPricing[] = []
  for (const c of communityPricing) {
    const tierMedian = tierMedianMap.get(c.size_tier) ?? 0
    if (tierMedian > 0 && c.fee_per_door !== null && c.fee_per_door > 0) {
      const threshold = tierMedian * 0.75
      if (c.fee_per_door < threshold) {
        c.is_under_priced = true
        c.pricing_gap = Math.round((tierMedian - c.fee_per_door) * 100) / 100
        underPriced.push(c)
      }
    }
  }

  // Sort under-priced by gap descending (largest gap = biggest upside)
  underPriced.sort((a, b) => (b.pricing_gap ?? 0) - (a.pricing_gap ?? 0))

  // ========================================================================
  // Portfolio-level stats
  // ========================================================================

  const allFeesPerDoor = communityPricing
    .map((c) => c.fee_per_door)
    .filter((f): f is number => f !== null && f > 0)

  const portfolioAvgFeePerDoor = allFeesPerDoor.length > 0
    ? Math.round((allFeesPerDoor.reduce((s, f) => s + f, 0) / allFeesPerDoor.length) * 100) / 100
    : 0
  const portfolioMedianFeePerDoor = Math.round(median(allFeesPerDoor) * 100) / 100
  const totalMonthlyFees = communityPricing.reduce((s, c) => s + (c.monthly_fee ?? 0), 0)
  const totalT12Revenue = communityPricing.reduce((s, c) => s + c.annual_revenue_t12, 0)
  const totalPortfolioUnits = communityPricing.reduce((s, c) => s + c.unit_count, 0)

  // Revenue lift opportunity: if under-priced communities were brought to tier median
  const potentialLift = underPriced.reduce((sum, c) => {
    return sum + (c.pricing_gap ?? 0) * c.unit_count
  }, 0)

  const portfolioStats = {
    total_communities_analyzed: communityPricing.length,
    total_units: totalPortfolioUnits,
    avg_fee_per_door: portfolioAvgFeePerDoor,
    median_fee_per_door: portfolioMedianFeePerDoor,
    total_monthly_fees: Math.round(totalMonthlyFees * 100) / 100,
    total_annual_fees: Math.round(totalMonthlyFees * 12 * 100) / 100,
    total_t12_revenue: Math.round(totalT12Revenue * 100) / 100,
    communities_with_contract: communityPricing.filter((c) => c.has_contract).length,
    communities_under_priced: underPriced.length,
    under_priced_pct: pct(underPriced.length, communityPricing.length),
    potential_monthly_revenue_lift: Math.round(potentialLift * 100) / 100,
    potential_annual_revenue_lift: Math.round(potentialLift * 12 * 100) / 100,
  }

  // ========================================================================
  // Build response
  // ========================================================================

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    tenant_id: tenantId,
    portfolio_stats: portfolioStats,
    tier_benchmarks: tierBenchmarks,
    under_priced_communities: underPriced,
    community_pricing: communityPricing.sort(
      (a, b) => (b.fee_per_door ?? 0) - (a.fee_per_door ?? 0)
    ),
  })
}
