/**
 * GET /api/admin/intelligence/cross-sell
 *
 * Cross-sell opportunity detection across the Riance LLC portfolio:
 *   - Empire Management Group (HOA management)
 *   - WFW Restoration (water/fire damage)
 *   - FixIQ (maintenance/handyman)
 *   - Riance Realty (real estate brokerage)
 *
 * Scans violations, work orders, property lifecycle, and maintenance
 * backlog to identify revenue opportunities across the four companies.
 *
 * Requires super_admin or tenant_admin role.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRoutePermission } from '@/lib/auth/rbac'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Opportunity = {
  association_id: string
  association_name: string
  city: string
  unit_count: number
  opportunity_type: 'wfw_restoration' | 'fixiq_maintenance' | 'riance_realty' | 'empire_expansion'
  target_company: string
  title: string
  description: string
  evidence: string[]
  estimated_value: number | null
  priority: 'high' | 'medium' | 'low'
  source_data: {
    entity_type: string
    entity_count: number
  }
}

// ---------------------------------------------------------------------------
// Detection keywords / patterns
// ---------------------------------------------------------------------------

const WFW_KEYWORDS = [
  'water damage', 'water leak', 'flood', 'flooding', 'mold', 'mould',
  'fire damage', 'fire', 'smoke damage', 'storm damage', 'hurricane',
  'roof leak', 'pipe burst', 'sewage', 'water intrusion', 'moisture',
  'remediation', 'restoration needed',
]

const FIXIQ_CATEGORIES = [
  'plumbing', 'electrical', 'hvac', 'painting', 'carpentry',
  'general maintenance', 'landscaping', 'pressure washing',
  'pest control', 'roofing',
]

const REALTY_INDICATORS = [
  'for sale', 'listed', 'selling', 'transfer', 'deed transfer',
  'foreclosure', 'short sale', 'estate sale', 'probate',
  'new construction', 'pre-construction',
]

function matchesKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw))
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  const supabase = await createClient()
  const tenantId = auth.tenantId
  const today = new Date()

  // 30-day window for recent activity
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  // ---- Parallel data fetches ----------------------------------------------
  const [
    assocResult,
    violationsResult,
    workOrdersResult,
    workOrdersBacklogResult,
    propertiesResult,
  ] = await Promise.all([
    // All associations for name/city lookup
    supabase
      .from('associations')
      .select('id, name, city, county, unit_count, status')
      .eq('tenant_id', tenantId),

    // Recent violations — look for water/fire/damage keywords
    supabase
      .from('violations')
      .select('id, association_id, title, description, violation_category, severity, status, created_at')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("resolved","closed")'),

    // Open work orders — look for maintenance categories
    supabase
      .from('work_orders')
      .select('id, association_id, title, description, category, priority, status, created_at, estimated_cost')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("closed","cancelled","completed")'),

    // Backlog work orders (open > 30 days) for FixIQ
    supabase
      .from('work_orders')
      .select('id, association_id, title, category, priority, created_at, estimated_cost')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("closed","cancelled","completed")')
      .lt('created_at', thirtyDaysAgoStr),

    // Properties with lifecycle indicators
    supabase
      .from('properties')
      .select('id, association_id, status, property_lifecycle, unit_number')
      .eq('tenant_id', tenantId),
  ])

  const associations = assocResult.data ?? []
  const violations = violationsResult.data ?? []
  const workOrders = workOrdersResult.data ?? []
  const backlogOrders = workOrdersBacklogResult.data ?? []
  const properties = propertiesResult.data ?? []

  // Build association lookup
  const assocMap = new Map(
    associations.map((a) => [
      a.id,
      { name: a.name, city: a.city ?? 'Unknown', unit_count: a.unit_count ?? 0 },
    ])
  )

  const opportunities: Opportunity[] = []

  // ========================================================================
  // 1. WFW RESTORATION — Water/fire damage violations
  // ========================================================================
  const wfwByAssoc: Record<string, { violations: typeof violations; keywords: Set<string> }> = {}

  for (const v of violations) {
    const searchText = `${v.title ?? ''} ${v.description ?? ''} ${v.violation_category ?? ''}`
    const matched = matchesKeywords(searchText, WFW_KEYWORDS)
    if (matched.length > 0) {
      if (!wfwByAssoc[v.association_id]) {
        wfwByAssoc[v.association_id] = { violations: [], keywords: new Set() }
      }
      wfwByAssoc[v.association_id].violations.push(v)
      matched.forEach((k) => wfwByAssoc[v.association_id].keywords.add(k))
    }
  }

  for (const [assocId, data] of Object.entries(wfwByAssoc)) {
    const assoc = assocMap.get(assocId)
    if (!assoc) continue

    const keywords = Array.from(data.keywords)
    const isHighSeverity = data.violations.some((v) => v.severity === 'critical' || v.severity === 'high')

    opportunities.push({
      association_id: assocId,
      association_name: assoc.name,
      city: assoc.city,
      unit_count: assoc.unit_count,
      opportunity_type: 'wfw_restoration',
      target_company: 'WFW Restoration',
      title: `Water/fire restoration opportunity at ${assoc.name}`,
      description: `${data.violations.length} open violation(s) involving ${keywords.join(', ')}. WFW can provide restoration and remediation services.`,
      evidence: data.violations.map(
        (v) => `Violation: "${v.title}" (${v.severity}) — ${v.status}`
      ),
      estimated_value: data.violations.length * 5000, // conservative per-incident estimate
      priority: isHighSeverity ? 'high' : data.violations.length >= 3 ? 'high' : 'medium',
      source_data: { entity_type: 'violations', entity_count: data.violations.length },
    })
  }

  // Also check work orders for WFW keywords
  for (const wo of workOrders) {
    const searchText = `${wo.title ?? ''} ${wo.description ?? ''} ${wo.category ?? ''}`
    const matched = matchesKeywords(searchText, WFW_KEYWORDS)
    if (matched.length > 0) {
      const assoc = assocMap.get(wo.association_id)
      if (!assoc) continue

      // Skip if we already have a violation-based opportunity for this association
      if (wfwByAssoc[wo.association_id]) continue

      opportunities.push({
        association_id: wo.association_id,
        association_name: assoc.name,
        city: assoc.city,
        unit_count: assoc.unit_count,
        opportunity_type: 'wfw_restoration',
        target_company: 'WFW Restoration',
        title: `Restoration work order at ${assoc.name}`,
        description: `Work order "${wo.title}" involves ${matched.join(', ')}. Potential WFW engagement.`,
        evidence: [`Work Order: "${wo.title}" (${wo.priority} priority, est. $${wo.estimated_cost ?? 'TBD'})`],
        estimated_value: wo.estimated_cost ?? 3000,
        priority: wo.priority === 'urgent' || wo.priority === 'high' ? 'high' : 'medium',
        source_data: { entity_type: 'work_orders', entity_count: 1 },
      })
    }
  }

  // ========================================================================
  // 2. FIXIQ MAINTENANCE — High backlog communities
  // ========================================================================
  const backlogByAssoc: Record<string, typeof backlogOrders> = {}
  for (const wo of backlogOrders) {
    if (!backlogByAssoc[wo.association_id]) backlogByAssoc[wo.association_id] = []
    backlogByAssoc[wo.association_id].push(wo)
  }

  for (const [assocId, orders] of Object.entries(backlogByAssoc)) {
    const assoc = assocMap.get(assocId)
    if (!assoc) continue

    // Only flag communities with significant backlog (3+ overdue work orders)
    if (orders.length < 3) continue

    const totalEstCost = orders.reduce((sum, wo) => sum + (wo.estimated_cost ?? 0), 0)
    const urgentCount = orders.filter(
      (wo) => wo.priority === 'urgent' || wo.priority === 'high'
    ).length

    opportunities.push({
      association_id: assocId,
      association_name: assoc.name,
      city: assoc.city,
      unit_count: assoc.unit_count,
      opportunity_type: 'fixiq_maintenance',
      target_company: 'FixIQ',
      title: `Maintenance backlog at ${assoc.name} (${orders.length} overdue)`,
      description: `${orders.length} work orders open 30+ days (${urgentCount} urgent/high priority). FixIQ can clear the backlog with a dedicated maintenance crew.`,
      evidence: orders.slice(0, 5).map(
        (wo) => `WO: "${wo.title}" — ${wo.category ?? 'general'}, ${wo.priority} priority, open since ${wo.created_at.split('T')[0]}`
      ),
      estimated_value: totalEstCost > 0 ? totalEstCost : orders.length * 750,
      priority: urgentCount >= 2 ? 'high' : orders.length >= 5 ? 'high' : 'medium',
      source_data: { entity_type: 'work_orders', entity_count: orders.length },
    })
  }

  // Also flag associations with many open work orders matching FixIQ categories
  const woByAssocCategory: Record<string, { count: number; categories: Set<string>; orders: typeof workOrders }> = {}
  for (const wo of workOrders) {
    const cat = (wo.category ?? '').toLowerCase()
    if (FIXIQ_CATEGORIES.some((fc) => cat.includes(fc))) {
      if (!woByAssocCategory[wo.association_id]) {
        woByAssocCategory[wo.association_id] = { count: 0, categories: new Set(), orders: [] }
      }
      woByAssocCategory[wo.association_id].count += 1
      woByAssocCategory[wo.association_id].categories.add(wo.category ?? 'general')
      woByAssocCategory[wo.association_id].orders.push(wo)
    }
  }

  for (const [assocId, data] of Object.entries(woByAssocCategory)) {
    // Skip if already flagged via backlog
    if (backlogByAssoc[assocId] && backlogByAssoc[assocId].length >= 3) continue
    if (data.count < 3) continue

    const assoc = assocMap.get(assocId)
    if (!assoc) continue

    const categories = Array.from(data.categories)

    opportunities.push({
      association_id: assocId,
      association_name: assoc.name,
      city: assoc.city,
      unit_count: assoc.unit_count,
      opportunity_type: 'fixiq_maintenance',
      target_company: 'FixIQ',
      title: `FixIQ service opportunity at ${assoc.name}`,
      description: `${data.count} open work orders in FixIQ service categories: ${categories.join(', ')}.`,
      evidence: data.orders.slice(0, 5).map(
        (wo) => `WO: "${wo.title}" — ${wo.category ?? 'general'}, ${wo.priority}`
      ),
      estimated_value: data.count * 500,
      priority: data.count >= 5 ? 'high' : 'medium',
      source_data: { entity_type: 'work_orders', entity_count: data.count },
    })
  }

  // ========================================================================
  // 3. RIANCE REALTY — Property sales / lifecycle activity
  // ========================================================================

  // Check violations and work orders for realty keywords
  const realtySignals: Record<string, { evidence: string[]; count: number }> = {}

  for (const v of violations) {
    const searchText = `${v.title ?? ''} ${v.description ?? ''}`
    const matched = matchesKeywords(searchText, REALTY_INDICATORS)
    if (matched.length > 0) {
      if (!realtySignals[v.association_id]) realtySignals[v.association_id] = { evidence: [], count: 0 }
      realtySignals[v.association_id].evidence.push(`Violation: "${v.title}" — matches: ${matched.join(', ')}`)
      realtySignals[v.association_id].count += 1
    }
  }

  // Check properties with lifecycle indicating sales activity
  const propertiesByAssoc: Record<string, { forSale: number; newConstruction: number; foreclosure: number }> = {}
  for (const p of properties) {
    const lifecycle = (p.property_lifecycle ?? '').toLowerCase()
    const status = (p.status ?? '').toLowerCase()

    const isSaleSignal =
      lifecycle === 'for_sale' || lifecycle === 'listed' ||
      status === 'for_sale' || status === 'listed' ||
      lifecycle === 'foreclosure' || lifecycle === 'pre-construction' ||
      lifecycle === 'new_construction'

    if (isSaleSignal) {
      if (!propertiesByAssoc[p.association_id]) {
        propertiesByAssoc[p.association_id] = { forSale: 0, newConstruction: 0, foreclosure: 0 }
      }
      if (lifecycle === 'foreclosure') {
        propertiesByAssoc[p.association_id].foreclosure += 1
      } else if (lifecycle === 'pre-construction' || lifecycle === 'new_construction') {
        propertiesByAssoc[p.association_id].newConstruction += 1
      } else {
        propertiesByAssoc[p.association_id].forSale += 1
      }
    }
  }

  for (const [assocId, data] of Object.entries(propertiesByAssoc)) {
    const assoc = assocMap.get(assocId)
    if (!assoc) continue

    const total = data.forSale + data.newConstruction + data.foreclosure
    if (total === 0) continue

    const evidenceItems: string[] = []
    if (data.forSale > 0) evidenceItems.push(`${data.forSale} unit(s) listed/for sale`)
    if (data.newConstruction > 0) evidenceItems.push(`${data.newConstruction} new construction unit(s)`)
    if (data.foreclosure > 0) evidenceItems.push(`${data.foreclosure} foreclosure(s)`)

    // Add any keyword-matched evidence
    if (realtySignals[assocId]) {
      evidenceItems.push(...realtySignals[assocId].evidence)
    }

    // Estimate value: average commission per transaction
    const estimatedCommission = total * 8500 // ~$350k avg home * 2.5% commission

    opportunities.push({
      association_id: assocId,
      association_name: assoc.name,
      city: assoc.city,
      unit_count: assoc.unit_count,
      opportunity_type: 'riance_realty',
      target_company: 'Riance Realty',
      title: `${total} real estate opportunity(ies) at ${assoc.name}`,
      description: `Property activity detected: ${evidenceItems.slice(0, 3).join('; ')}. Riance Realty can provide listing or buyer representation services.`,
      evidence: evidenceItems,
      estimated_value: estimatedCommission,
      priority: total >= 5 ? 'high' : total >= 2 ? 'medium' : 'low',
      source_data: { entity_type: 'properties', entity_count: total },
    })
  }

  // Handle realty signals from violations that did not match properties
  for (const [assocId, data] of Object.entries(realtySignals)) {
    if (propertiesByAssoc[assocId]) continue // already covered
    if (data.count === 0) continue

    const assoc = assocMap.get(assocId)
    if (!assoc) continue

    opportunities.push({
      association_id: assocId,
      association_name: assoc.name,
      city: assoc.city,
      unit_count: assoc.unit_count,
      opportunity_type: 'riance_realty',
      target_company: 'Riance Realty',
      title: `Real estate activity signals at ${assoc.name}`,
      description: `${data.count} violation(s) reference property transfers or sales activity.`,
      evidence: data.evidence,
      estimated_value: data.count * 8500,
      priority: data.count >= 3 ? 'high' : 'low',
      source_data: { entity_type: 'violations', entity_count: data.count },
    })
  }

  // ========================================================================
  // Summary stats
  // ========================================================================
  const summary = {
    total_opportunities: opportunities.length,
    by_company: {
      wfw_restoration: opportunities.filter((o) => o.opportunity_type === 'wfw_restoration').length,
      fixiq_maintenance: opportunities.filter((o) => o.opportunity_type === 'fixiq_maintenance').length,
      riance_realty: opportunities.filter((o) => o.opportunity_type === 'riance_realty').length,
    },
    by_priority: {
      high: opportunities.filter((o) => o.priority === 'high').length,
      medium: opportunities.filter((o) => o.priority === 'medium').length,
      low: opportunities.filter((o) => o.priority === 'low').length,
    },
    total_estimated_value: opportunities.reduce((sum, o) => sum + (o.estimated_value ?? 0), 0),
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    tenant_id: tenantId,
    summary,
    opportunities: opportunities.sort((a, b) => {
      // Sort by priority (high > medium > low), then by estimated value desc
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (pDiff !== 0) return pDiff
      return (b.estimated_value ?? 0) - (a.estimated_value ?? 0)
    }),
  })
}
