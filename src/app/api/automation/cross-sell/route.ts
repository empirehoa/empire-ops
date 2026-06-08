/**
 * Automation: Cross-Sell Opportunity Agent
 * POST /api/automation/cross-sell
 *
 * Scheduled intelligence agent that scans association data for cross-sell signals:
 * 1. Water damage violations -> WFW Restoration opportunity
 * 2. Maintenance request backlogs -> FixIQ opportunity
 * 3. High work order volume / deferred maintenance -> FixIQ opportunity
 * 4. Property lifecycle "for_sale" -> Riance Realty opportunity
 * 5. Large communities without insurance cert data -> CondoCerts opportunity
 *
 * Empire Management Group sister companies:
 * - WFW Restoration (water/fire/wind damage restoration)
 * - FixIQ (maintenance and handyman services)
 * - Riance Realty (real estate sales)
 *
 * Protected by AUTOMATION_SECRET header (x-automation-secret).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'

// ─── Service-role client (bypasses RLS for automation) ────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not configured')
  return createServerClient<Database>(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}

// ─── Discord embed post ──────────────────────────────────────────────────────

async function postToDiscord(embed: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? process.env.DISCORD_AUTOMATION_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {
    // Non-fatal
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrossSellOpportunity {
  association_id: string
  association_name: string
  service: 'WFW Restoration' | 'FixIQ' | 'Riance Realty' | 'CondoCerts'
  signal: string
  estimated_value: string
  priority: 'high' | 'medium' | 'low'
}

// ─── Pattern detection keywords ──────────────────────────────────────────────

const WATER_DAMAGE_KEYWORDS = ['water', 'flood', 'leak', 'pipe', 'plumbing', 'mold', 'moisture', 'storm damage']
const FIRE_DAMAGE_KEYWORDS = ['fire', 'smoke', 'burn', 'electrical fire']
const WIND_DAMAGE_KEYWORDS = ['wind', 'hurricane', 'roof damage', 'tree', 'storm']

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const opportunities: CrossSellOpportunity[] = []

  try {
    // Load associations for name resolution
    const { data: allAssociations } = await supabase
      .from('associations')
      .select('id, name, unit_count, status')
      .eq('status', 'active')
      .limit(500)

    const assocMap = new Map((allAssociations ?? []).map((a) => [a.id, a]))

    function getAssocName(id: string): string {
      return assocMap.get(id)?.name ?? id.slice(0, 8)
    }

    // Pattern 1: Water/Fire/Wind damage violations -> WFW Restoration
    const { data: recentViolations } = await supabase
      .from('violations')
      .select('id, association_id, title, description, violation_category, severity, created_at')
      .gte('created_at', thirtyDaysAgoStr)
      .limit(2000)

    const wfwByAssoc = new Map<string, string[]>()

    for (const v of recentViolations ?? []) {
      const searchText = `${v.title ?? ''} ${v.description ?? ''} ${v.violation_category ?? ''}`
      const damageTypes: string[] = []

      if (matchesKeywords(searchText, WATER_DAMAGE_KEYWORDS)) damageTypes.push('water')
      if (matchesKeywords(searchText, FIRE_DAMAGE_KEYWORDS)) damageTypes.push('fire')
      if (matchesKeywords(searchText, WIND_DAMAGE_KEYWORDS)) damageTypes.push('wind')

      if (damageTypes.length > 0) {
        const existing = wfwByAssoc.get(v.association_id) ?? []
        existing.push(...damageTypes)
        wfwByAssoc.set(v.association_id, existing)
      }
    }

    for (const [assocId, damageTypes] of wfwByAssoc) {
      const uniqueTypes = [...new Set(damageTypes)]
      const count = damageTypes.length
      opportunities.push({
        association_id: assocId,
        association_name: getAssocName(assocId),
        service: 'WFW Restoration',
        signal: `${count} damage violation(s) detected: ${uniqueTypes.join(', ')}`,
        estimated_value: count >= 3 ? 'High' : 'Medium',
        priority: count >= 3 ? 'high' : 'medium',
      })
    }

    // Pattern 2: Maintenance request backlogs -> FixIQ
    const { data: openMaintenance } = await supabase
      .from('maintenance_requests')
      .select('id, association_id, status, priority, created_at, category')
      .in('status', ['open', 'pending', 'in_progress'])
      .limit(5000)

    const maintenanceByAssoc = new Map<string, { total: number; urgent: number; categories: Set<string> }>()

    for (const mr of openMaintenance ?? []) {
      const existing = maintenanceByAssoc.get(mr.association_id) ?? { total: 0, urgent: 0, categories: new Set<string>() }
      existing.total++
      if (mr.priority === 'urgent' || mr.priority === 'high') existing.urgent++
      if (mr.category) existing.categories.add(mr.category)
      maintenanceByAssoc.set(mr.association_id, existing)
    }

    for (const [assocId, data] of maintenanceByAssoc) {
      // Flag if backlog is significant (5+ open requests or 2+ urgent)
      if (data.total >= 5 || data.urgent >= 2) {
        opportunities.push({
          association_id: assocId,
          association_name: getAssocName(assocId),
          service: 'FixIQ',
          signal: `Maintenance backlog: ${data.total} open requests (${data.urgent} urgent), categories: ${[...data.categories].slice(0, 3).join(', ') || 'general'}`,
          estimated_value: data.total >= 10 ? 'High' : 'Medium',
          priority: data.urgent >= 3 ? 'high' : 'medium',
        })
      }
    }

    // Pattern 3: High work order volume -> FixIQ
    const { data: openWorkOrders } = await supabase
      .from('work_orders')
      .select('id, association_id, status, priority, category, estimated_cost')
      .in('status', ['open', 'pending', 'in_progress'])
      .limit(5000)

    const workOrdersByAssoc = new Map<string, { total: number; totalCost: number; highPriority: number }>()

    for (const wo of openWorkOrders ?? []) {
      const existing = workOrdersByAssoc.get(wo.association_id) ?? { total: 0, totalCost: 0, highPriority: 0 }
      existing.total++
      existing.totalCost += wo.estimated_cost ?? 0
      if (wo.priority === 'urgent' || wo.priority === 'high') existing.highPriority++
      workOrdersByAssoc.set(wo.association_id, existing)
    }

    for (const [assocId, data] of workOrdersByAssoc) {
      // Only add FixIQ opportunity if not already flagged via maintenance requests
      if (data.total >= 8 && !maintenanceByAssoc.has(assocId)) {
        const costStr = data.totalCost > 0 ? `, est. cost: $${(data.totalCost / 100).toLocaleString('en-US')}` : ''
        opportunities.push({
          association_id: assocId,
          association_name: getAssocName(assocId),
          service: 'FixIQ',
          signal: `${data.total} open work orders (${data.highPriority} high priority${costStr})`,
          estimated_value: data.total >= 15 ? 'High' : 'Medium',
          priority: data.highPriority >= 3 ? 'high' : 'medium',
        })
      }
    }

    // Pattern 4: Properties for sale -> Riance Realty
    const { data: forSaleProperties } = await supabase
      .from('properties')
      .select('id, association_id, unit_number, address_line1, property_lifecycle')
      .eq('property_lifecycle', 'for_sale')
      .limit(500)

    const salesByAssoc = new Map<string, number>()

    for (const prop of forSaleProperties ?? []) {
      salesByAssoc.set(prop.association_id, (salesByAssoc.get(prop.association_id) ?? 0) + 1)
    }

    for (const [assocId, count] of salesByAssoc) {
      opportunities.push({
        association_id: assocId,
        association_name: getAssocName(assocId),
        service: 'Riance Realty',
        signal: `${count} propert${count === 1 ? 'y' : 'ies'} listed for sale`,
        estimated_value: count >= 5 ? 'High' : count >= 2 ? 'Medium' : 'Low',
        priority: count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low',
      })
    }

    // Sort by priority then service
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    // Build Discord embed
    if (opportunities.length === 0) {
      await postToDiscord({
        title: 'Cross-Sell Scan: No New Opportunities',
        description: 'No cross-sell patterns detected in the last 30 days.',
        color: 0x10b981,
        timestamp: now.toISOString(),
        footer: { text: 'Vera Cross-Sell Agent' },
      })

      return NextResponse.json({
        opportunities_found: 0,
        message: 'No cross-sell opportunities detected',
      })
    }

    // Group by service for the summary
    const byService = new Map<string, CrossSellOpportunity[]>()
    for (const opp of opportunities) {
      const existing = byService.get(opp.service) ?? []
      existing.push(opp)
      byService.set(opp.service, existing)
    }

    const highCount = opportunities.filter((o) => o.priority === 'high').length
    const color = highCount >= 3 ? 0xef4444 : highCount >= 1 ? 0xfbbf24 : 0x10b981

    const fields = [
      {
        name: 'Summary',
        value: `**${opportunities.length}** opportunities across **${byService.size}** services | **${highCount}** high priority`,
        inline: false,
      },
    ]

    for (const [service, opps] of byService) {
      const lines = opps.slice(0, 5).map((o) => {
        const priorityIcon = o.priority === 'high' ? ':fire:' : o.priority === 'medium' ? ':chart_with_upwards_trend:' : ':small_blue_diamond:'
        return `${priorityIcon} **${o.association_name}** — ${o.signal}`
      })
      if (opps.length > 5) {
        lines.push(`... and ${opps.length - 5} more`)
      }

      fields.push({
        name: `${service} (${opps.length})`,
        value: lines.join('\n'),
        inline: false,
      })
    }

    await postToDiscord({
      title: `Cross-Sell Intelligence: ${opportunities.length} Opportunities`,
      color,
      fields,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Cross-Sell Agent' },
    })

    return NextResponse.json({
      opportunities_found: opportunities.length,
      high_priority: highCount,
      by_service: Object.fromEntries(
        Array.from(byService.entries()).map(([service, opps]) => [
          service,
          {
            count: opps.length,
            high_priority: opps.filter((o) => o.priority === 'high').length,
          },
        ]),
      ),
      top_opportunities: opportunities.slice(0, 10).map((o) => ({
        association: o.association_name,
        service: o.service,
        signal: o.signal,
        priority: o.priority,
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
