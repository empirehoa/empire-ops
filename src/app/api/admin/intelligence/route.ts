/**
 * GET /api/admin/intelligence
 *
 * Comprehensive portfolio intelligence endpoint for Riance LLC analysis.
 * Aggregates data across all Vera tables to produce a single intelligence
 * payload covering portfolio metrics, financial health, compliance,
 * operations, pipeline, revenue concentration, geography, and churn risk.
 *
 * Requires super_admin or tenant_admin role.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRoutePermission } from '@/lib/auth/rbac'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: string | Date, b: string | Date): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 10000) / 100 // two decimals
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  // ---- Auth ---------------------------------------------------------------
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  const supabase = await createClient()
  const tenantId = auth.tenantId
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // 90 days ago for aging threshold
  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]

  // Start of current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthStart = startOfMonth.toISOString().split('T')[0]

  // ---- Parallel data fetches ----------------------------------------------
  const [
    assocResult,
    contactCountResult,
    chargesResult,
    violationsAllResult,
    violationsResolvedResult,
    workOrdersOpenResult,
    workOrdersCompletedResult,
    leadsResult,
    healthScoresResult,
    contractsResult,
  ] = await Promise.all([
    // 1. All associations
    supabase
      .from('associations')
      .select('id, name, city, county, state, unit_count, status')
      .eq('tenant_id', tenantId)
      .order('name'),

    // 2. Total contacts
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),

    // 3. All non-voided charges (for AR, revenue, aging)
    supabase
      .from('charges')
      .select('id, association_id, amount, amount_paid, balance_due, due_date, charge_date, status')
      .eq('tenant_id', tenantId)
      .neq('status', 'voided'),

    // 4. All violations (open + closed)
    supabase
      .from('violations')
      .select('id, association_id, status, created_at, resolved_date, violation_category')
      .eq('tenant_id', tenantId),

    // 5. Resolved violations (for average resolution time)
    supabase
      .from('violations')
      .select('id, created_at, resolved_date')
      .eq('tenant_id', tenantId)
      .not('resolved_date', 'is', null),

    // 6. Open work orders
    supabase
      .from('work_orders')
      .select('id, association_id, created_at, scheduled_date, priority, category')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("closed","cancelled","completed")'),

    // 7. Completed work orders (for avg response time)
    supabase
      .from('work_orders')
      .select('id, created_at, completed_date')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('completed_date', 'is', null),

    // 8. Leads pipeline
    supabase
      .from('leads')
      .select('id, stage, estimated_monthly_fee, estimated_annual_value, won_at, unit_count')
      .eq('tenant_id', tenantId),

    // 9. Community health scores
    supabase
      .from('community_health_scores')
      .select('association_id, overall_score, financial_score, compliance_score, maintenance_score, score_trend')
      .eq('tenant_id', tenantId),

    // 10. Contracts with monthly_fee
    supabase
      .from('contracts')
      .select('id, association_id, monthly_fee, status, term_start_date, term_end_date')
      .eq('tenant_id', tenantId),
  ])

  // ---- Unpack results (fail gracefully per section) -----------------------
  const associations = assocResult.data ?? []
  const totalContacts = contactCountResult.count ?? 0
  const charges = chargesResult.data ?? []
  const allViolations = violationsAllResult.data ?? []
  const resolvedViolations = violationsResolvedResult.data ?? []
  const openWorkOrders = workOrdersOpenResult.data ?? []
  const completedWorkOrders = workOrdersCompletedResult.data ?? []
  const leads = leadsResult.data ?? []
  const healthScores = healthScoresResult.data ?? []
  const contracts = contractsResult.data ?? []

  // ========================================================================
  // 1. PORTFOLIO METRICS
  // ========================================================================
  const totalAssociations = associations.length
  const activeAssociations = associations.filter((a) => a.status === 'active').length
  const totalUnits = associations.reduce((sum, a) => sum + (a.unit_count ?? 0), 0)

  const portfolioMetrics = {
    total_associations: totalAssociations,
    active_associations: activeAssociations,
    total_units: totalUnits,
    total_contacts: totalContacts,
  }

  // ========================================================================
  // 2. FINANCIAL HEALTH
  // ========================================================================
  const totalAR = charges.reduce((sum, c) => {
    const balance = c.balance_due ?? (c.amount - c.amount_paid)
    return sum + Math.max(0, balance)
  }, 0)

  const delinquentCharges = charges.filter((c) => {
    const balance = c.balance_due ?? (c.amount - c.amount_paid)
    return balance > 0 && c.due_date < todayStr
  })
  const totalDelinquent = delinquentCharges.reduce((sum, c) => {
    return sum + (c.balance_due ?? (c.amount - c.amount_paid))
  }, 0)

  const aging90Plus = charges.filter((c) => {
    const balance = c.balance_due ?? (c.amount - c.amount_paid)
    return balance > 0 && c.due_date < ninetyDaysAgoStr
  })
  const total90PlusAging = aging90Plus.reduce((sum, c) => {
    return sum + (c.balance_due ?? (c.amount - c.amount_paid))
  }, 0)

  const totalCharged = charges.reduce((sum, c) => sum + c.amount, 0)
  const totalCollected = charges.reduce((sum, c) => sum + c.amount_paid, 0)
  const collectionsRate = pct(totalCollected, totalCharged)

  // Monthly revenue (current month charges collected)
  const monthlyCharges = charges.filter((c) => c.charge_date >= monthStart)
  const monthlyRevenue = monthlyCharges.reduce((sum, c) => sum + c.amount_paid, 0)

  const financialHealth = {
    total_ar: Math.round(totalAR * 100) / 100,
    total_delinquent: Math.round(totalDelinquent * 100) / 100,
    aging_90_plus: Math.round(total90PlusAging * 100) / 100,
    collections_rate: collectionsRate,
    total_charged: Math.round(totalCharged * 100) / 100,
    total_collected: Math.round(totalCollected * 100) / 100,
    monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
    delinquency_rate: pct(totalDelinquent, totalAR || 1),
  }

  // ========================================================================
  // 3. COMPLIANCE HEALTH
  // ========================================================================
  const openViolations = allViolations.filter(
    (v) => !['resolved', 'closed'].includes(v.status)
  )

  // Average resolution time (in days) for violations that have been resolved
  let avgResolutionDays = 0
  if (resolvedViolations.length > 0) {
    const totalDays = resolvedViolations.reduce((sum, v) => {
      return sum + daysBetween(v.created_at, v.resolved_date!)
    }, 0)
    avgResolutionDays = Math.round(totalDays / resolvedViolations.length)
  }

  const complianceRate = pct(
    allViolations.length - openViolations.length,
    allViolations.length || 1
  )

  // Violation breakdown by category
  const violationsByCategory: Record<string, number> = {}
  for (const v of openViolations) {
    const cat = v.violation_category ?? 'uncategorized'
    violationsByCategory[cat] = (violationsByCategory[cat] ?? 0) + 1
  }

  const complianceHealth = {
    open_violations: openViolations.length,
    total_violations: allViolations.length,
    resolved_violations: resolvedViolations.length,
    avg_resolution_days: avgResolutionDays,
    compliance_rate: complianceRate,
    violations_by_category: violationsByCategory,
  }

  // ========================================================================
  // 4. OPERATIONAL METRICS
  // ========================================================================
  // Avg response time for completed work orders
  let avgResponseDays = 0
  if (completedWorkOrders.length > 0) {
    const totalDays = completedWorkOrders.reduce((sum, wo) => {
      return sum + daysBetween(wo.created_at, wo.completed_date!)
    }, 0)
    avgResponseDays = Math.round(totalDays / completedWorkOrders.length)
  }

  // Priority breakdown of open work orders
  const openByPriority: Record<string, number> = {}
  for (const wo of openWorkOrders) {
    const pri = wo.priority ?? 'normal'
    openByPriority[pri] = (openByPriority[pri] ?? 0) + 1
  }

  // Category breakdown of open work orders
  const openByCategory: Record<string, number> = {}
  for (const wo of openWorkOrders) {
    const cat = wo.category ?? 'general'
    openByCategory[cat] = (openByCategory[cat] ?? 0) + 1
  }

  // Maintenance backlog: work orders open > 30 days
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const maintenanceBacklog = openWorkOrders.filter(
    (wo) => new Date(wo.created_at) < thirtyDaysAgo
  ).length

  const operationalMetrics = {
    open_work_orders: openWorkOrders.length,
    completed_work_orders: completedWorkOrders.length,
    avg_response_days: avgResponseDays,
    maintenance_backlog: maintenanceBacklog,
    open_by_priority: openByPriority,
    open_by_category: openByCategory,
  }

  // ========================================================================
  // 5. CLIENT PIPELINE (from leads table)
  // ========================================================================
  const activeStages = ['prospect', 'contacted', 'proposal', 'negotiation']
  const activeLeads = leads.filter((l) => activeStages.includes(l.stage))
  const wonLeads = leads.filter((l) => l.stage === 'won')
  const lostLeads = leads.filter((l) => l.stage === 'lost')

  const pipelineValue = activeLeads.reduce(
    (sum, l) => sum + (l.estimated_annual_value ?? (l.estimated_monthly_fee ?? 0) * 12),
    0
  )

  const wonThisMonth = wonLeads.filter(
    (l) => l.won_at && l.won_at >= monthStart
  ).length

  // Conversion rate: won / (won + lost)
  const totalDecided = wonLeads.length + lostLeads.length
  const conversionRate = pct(wonLeads.length, totalDecided || 1)

  // Pipeline by stage
  const byStage: Record<string, { count: number; value: number }> = {}
  for (const l of leads) {
    if (!byStage[l.stage]) byStage[l.stage] = { count: 0, value: 0 }
    byStage[l.stage].count += 1
    byStage[l.stage].value += l.estimated_monthly_fee ?? 0
  }

  const clientPipeline = {
    total_leads: leads.length,
    active_leads: activeLeads.length,
    pipeline_value: Math.round(pipelineValue * 100) / 100,
    won_this_month: wonThisMonth,
    won_total: wonLeads.length,
    lost_total: lostLeads.length,
    conversion_rate: conversionRate,
    by_stage: byStage,
  }

  // ========================================================================
  // 6. REVENUE CONCENTRATION — Top 10 communities by total charges
  // ========================================================================
  const revenueByAssoc: Record<string, number> = {}
  for (const c of charges) {
    revenueByAssoc[c.association_id] = (revenueByAssoc[c.association_id] ?? 0) + c.amount_paid
  }

  const assocNameMap = new Map(associations.map((a) => [a.id, a.name]))
  const assocUnitMap = new Map(associations.map((a) => [a.id, a.unit_count ?? 0]))

  const revenueConcentration = Object.entries(revenueByAssoc)
    .map(([assocId, revenue]) => ({
      association_id: assocId,
      name: assocNameMap.get(assocId) ?? 'Unknown',
      unit_count: assocUnitMap.get(assocId) ?? 0,
      total_collected: Math.round(revenue * 100) / 100,
      revenue_per_unit: assocUnitMap.get(assocId)
        ? Math.round((revenue / assocUnitMap.get(assocId)!) * 100) / 100
        : 0,
    }))
    .sort((a, b) => b.total_collected - a.total_collected)
    .slice(0, 10)

  // Concentration metrics
  const topThreeRevenue = revenueConcentration.slice(0, 3).reduce((s, r) => s + r.total_collected, 0)
  const totalRevenue = Object.values(revenueByAssoc).reduce((s, v) => s + v, 0)
  const top3ConcentrationPct = pct(topThreeRevenue, totalRevenue || 1)

  // ========================================================================
  // 7. GEOGRAPHIC DISTRIBUTION
  // ========================================================================
  const byCity: Record<string, { count: number; units: number }> = {}
  const byCounty: Record<string, { count: number; units: number }> = {}

  for (const a of associations) {
    const city = a.city ?? 'Unknown'
    const county = a.county ?? 'Unknown'

    if (!byCity[city]) byCity[city] = { count: 0, units: 0 }
    byCity[city].count += 1
    byCity[city].units += a.unit_count ?? 0

    if (!byCounty[county]) byCounty[county] = { count: 0, units: 0 }
    byCounty[county].count += 1
    byCounty[county].units += a.unit_count ?? 0
  }

  const geographicDistribution = {
    by_city: Object.entries(byCity)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.units - a.units),
    by_county: Object.entries(byCounty)
      .map(([county, data]) => ({ county, ...data }))
      .sort((a, b) => b.units - a.units),
  }

  // ========================================================================
  // 8. CHURN RISK — Communities with health score < 60
  // ========================================================================
  const healthByAssoc = new Map(healthScores.map((h) => [h.association_id, h]))

  const churnRisk = associations
    .map((a) => {
      const health = healthByAssoc.get(a.id)
      if (!health || (health.overall_score ?? 100) >= 60) return null

      return {
        association_id: a.id,
        name: a.name,
        city: a.city ?? 'Unknown',
        unit_count: a.unit_count ?? 0,
        overall_score: health.overall_score,
        financial_score: health.financial_score,
        compliance_score: health.compliance_score,
        maintenance_score: health.maintenance_score,
        score_trend: health.score_trend,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a!.overall_score ?? 0) - (b!.overall_score ?? 0))

  // ========================================================================
  // 9. CONTRACT INSIGHTS (bonus — useful for pricing route and cross-sell)
  // ========================================================================
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'signed')
  const contractedRevenue = activeContracts.reduce(
    (sum, c) => sum + (c.monthly_fee ?? 0),
    0
  )

  const contractInsights = {
    total_contracts: contracts.length,
    active_contracts: activeContracts.length,
    total_monthly_contracted: Math.round(contractedRevenue * 100) / 100,
    total_annual_contracted: Math.round(contractedRevenue * 12 * 100) / 100,
  }

  // ========================================================================
  // Build response
  // ========================================================================
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    tenant_id: tenantId,
    portfolio_metrics: portfolioMetrics,
    financial_health: financialHealth,
    compliance_health: complianceHealth,
    operational_metrics: operationalMetrics,
    client_pipeline: clientPipeline,
    revenue_concentration: {
      top_communities: revenueConcentration,
      top_3_concentration_pct: top3ConcentrationPct,
      total_revenue: Math.round(totalRevenue * 100) / 100,
    },
    geographic_distribution: geographicDistribution,
    churn_risk: churnRisk,
    contract_insights: contractInsights,
  })
}
