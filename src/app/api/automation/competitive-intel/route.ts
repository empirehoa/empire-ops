/**
 * Automation: Competitive Intelligence Agent
 * POST /api/automation/competitive-intel
 *
 * Scheduled intelligence agent that calculates market positioning metrics:
 * 1. Calculates per-door management fee benchmarks from Vera's own contracts
 * 2. Segments communities by size tier and type for accurate comparisons
 * 3. Computes portfolio growth trends (new communities vs offboardings)
 * 4. Provides a scaffold for competitive data ingestion (manual or future API)
 * 5. Posts a market positioning summary to Discord
 *
 * This agent works with internal data only. External competitive data can be
 * passed in the request body for comparison when available.
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

interface CompetitorBenchmark {
  name: string
  avg_per_door_fee: number // in cents
  total_communities: number
  total_doors: number
}

interface SizeTier {
  label: string
  min: number
  max: number
}

const SIZE_TIERS: SizeTier[] = [
  { label: 'Small (1-50 units)', min: 1, max: 50 },
  { label: 'Mid-size (51-150 units)', min: 51, max: 150 },
  { label: 'Large (151-500 units)', min: 151, max: 500 },
  { label: 'Enterprise (500+ units)', min: 501, max: Infinity },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const db = supabase as any

  const now = new Date()

  // Accept optional competitor benchmarks in request body
  let competitorData: CompetitorBenchmark[] = []
  try {
    const body = await request.json()
    if (body?.competitors && Array.isArray(body.competitors)) {
      competitorData = body.competitors
    }
  } catch {
    // No body or invalid JSON — proceed with internal data only
  }

  try {
    // Step 1: Fetch active associations with unit counts
    const { data: associations, error: assocErr } = await supabase
      .from('associations')
      .select('id, name, unit_count, type, status, created_at')
      .eq('status', 'active')
      .limit(1000)

    if (assocErr) {
      return NextResponse.json(
        { error: `Failed to query associations: ${assocErr.message}` },
        { status: 500 },
      )
    }

    const activeAssociations = associations ?? []
    const totalDoors = activeAssociations.reduce((sum, a) => sum + (a.unit_count ?? 0), 0)

    // Step 2: Fetch contracts with monthly fees for per-door calculation
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, association_id, monthly_fee, status')
      .eq('status', 'active')
      .limit(1000)

    // Build per-door fee by association
    const contractByAssoc = new Map<string, number>()
    for (const contract of contracts ?? []) {
      if (contract.association_id && contract.monthly_fee) {
        contractByAssoc.set(contract.association_id, contract.monthly_fee)
      }
    }

    // Step 3: Calculate per-door fees by size tier
    const tierStats = SIZE_TIERS.map((tier) => {
      const tierAssociations = activeAssociations.filter((a) => {
        const units = a.unit_count ?? 0
        return units >= tier.min && units <= tier.max
      })

      const withFees = tierAssociations
        .map((a) => {
          const monthlyFee = contractByAssoc.get(a.id)
          const units = a.unit_count ?? 0
          if (!monthlyFee || units === 0) return null
          return { name: a.name, perDoor: monthlyFee / units, units, monthlyFee }
        })
        .filter(Boolean) as Array<{ name: string; perDoor: number; units: number; monthlyFee: number }>

      const avgPerDoor = withFees.length > 0
        ? withFees.reduce((sum, f) => sum + f.perDoor, 0) / withFees.length
        : 0

      const minPerDoor = withFees.length > 0 ? Math.min(...withFees.map((f) => f.perDoor)) : 0
      const maxPerDoor = withFees.length > 0 ? Math.max(...withFees.map((f) => f.perDoor)) : 0

      return {
        label: tier.label,
        community_count: tierAssociations.length,
        with_fee_data: withFees.length,
        avg_per_door: Math.round(avgPerDoor),
        min_per_door: Math.round(minPerDoor),
        max_per_door: Math.round(maxPerDoor),
        total_units: tierAssociations.reduce((sum, a) => sum + (a.unit_count ?? 0), 0),
      }
    })

    // Step 4: Portfolio growth — communities added in last 90 days
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString()

    const newCommunities = activeAssociations.filter((a) => a.created_at >= ninetyDaysAgoStr)

    // Check for recent offboardings
    const { data: recentOffboardings } = await db
      .from('community_offboarding')
      .select('id, association_id, status, termination_date')
      .gte('created_at', ninetyDaysAgoStr)

    const offboardingCount = (recentOffboardings ?? []).length

    // Step 5: Segment by community type
    const typeBreakdown = new Map<string, { count: number; units: number }>()
    for (const assoc of activeAssociations) {
      const existing = typeBreakdown.get(assoc.type) ?? { count: 0, units: 0 }
      existing.count++
      existing.units += assoc.unit_count ?? 0
      typeBreakdown.set(assoc.type, existing)
    }

    // Step 6: Calculate overall portfolio per-door fee
    let totalMonthlyRevenue = 0
    let doorsWithFees = 0

    for (const assoc of activeAssociations) {
      const fee = contractByAssoc.get(assoc.id)
      if (fee && assoc.unit_count) {
        totalMonthlyRevenue += fee
        doorsWithFees += assoc.unit_count
      }
    }

    const overallPerDoor = doorsWithFees > 0 ? Math.round(totalMonthlyRevenue / doorsWithFees) : 0

    // Step 7: Build Discord embed
    const fields = [
      {
        name: 'Portfolio Overview',
        value: [
          `Communities: **${activeAssociations.length}**`,
          `Total Doors: **${totalDoors.toLocaleString()}**`,
          `Avg Per-Door Fee: **${formatCents(overallPerDoor)}**/mo`,
          `Monthly Revenue (mgmt fees): **${formatCents(totalMonthlyRevenue)}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Growth (90 days)',
        value: [
          `New Communities: **+${newCommunities.length}**`,
          `Offboardings: **-${offboardingCount}**`,
          `Net: **${newCommunities.length - offboardingCount >= 0 ? '+' : ''}${newCommunities.length - offboardingCount}**`,
        ].join('\n'),
        inline: true,
      },
    ]

    // Per-door fees by tier
    const tierLines = tierStats
      .filter((t) => t.community_count > 0)
      .map((t) => {
        const feeStr = t.with_fee_data > 0
          ? `${formatCents(t.avg_per_door)}/door (range: ${formatCents(t.min_per_door)}-${formatCents(t.max_per_door)})`
          : 'No fee data'
        return `**${t.label}**: ${t.community_count} communities, ${t.total_units.toLocaleString()} units — ${feeStr}`
      })

    fields.push({
      name: 'Per-Door Fees by Size Tier',
      value: tierLines.join('\n') || 'No data',
      inline: false,
    })

    // Type breakdown
    const typeLines = Array.from(typeBreakdown.entries())
      .sort((a, b) => b[1].units - a[1].units)
      .map(([type, data]) => `**${type}**: ${data.count} communities, ${data.units.toLocaleString()} units`)

    fields.push({
      name: 'Community Type Breakdown',
      value: typeLines.join('\n') || 'No data',
      inline: false,
    })

    // Competitor comparison (if data was provided)
    if (competitorData.length > 0) {
      const compLines = competitorData.map((c) => {
        const diff = overallPerDoor - c.avg_per_door_fee
        const direction = diff > 0 ? 'above' : 'below'
        return `**${c.name}**: ${formatCents(c.avg_per_door_fee)}/door, ${c.total_communities} communities, ${c.total_doors.toLocaleString()} doors — Empire is ${formatCents(Math.abs(diff))} ${direction}`
      })

      fields.push({
        name: 'Competitor Comparison',
        value: compLines.join('\n'),
        inline: false,
      })
    } else {
      fields.push({
        name: 'Competitor Comparison',
        value: '_No external competitor data provided. Pass `{ "competitors": [...] }` in request body to enable comparison._',
        inline: false,
      })
    }

    const netGrowth = newCommunities.length - offboardingCount
    const color = netGrowth < 0 ? 0xef4444 : netGrowth === 0 ? 0xfbbf24 : 0x10b981

    await postToDiscord({
      title: 'Competitive Intelligence: Market Position',
      color,
      fields,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Competitive Intel Agent' },
    })

    return NextResponse.json({
      portfolio: {
        active_communities: activeAssociations.length,
        total_doors: totalDoors,
        overall_per_door_fee: overallPerDoor,
        monthly_management_revenue: totalMonthlyRevenue,
      },
      growth_90d: {
        new_communities: newCommunities.length,
        offboardings: offboardingCount,
        net: netGrowth,
      },
      tier_benchmarks: tierStats,
      type_breakdown: Object.fromEntries(typeBreakdown),
      competitor_data_provided: competitorData.length > 0,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
