/**
 * Automation: Sales Intelligence Agent
 * POST /api/automation/sales-intelligence
 *
 * Scheduled intelligence agent that:
 * 1. Queries the leads table for active pipeline opportunities
 * 2. Ranks leads by estimated_annual_value and unit_count (community size)
 * 3. Identifies stale leads (no activity in 14+ days) that need follow-up
 * 4. Flags recently created high-value leads for immediate attention
 * 5. Posts a prioritized lead briefing to Discord
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
    // Non-fatal — don't let Discord failure block the response
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STALE_THRESHOLD_DAYS = 14
const HIGH_VALUE_UNIT_THRESHOLD = 100
const HIGH_VALUE_ANNUAL_THRESHOLD = 50000 // $50k+ annual value
const TOP_LEADS_LIMIT = 10

// Active pipeline stages (not won or lost)
const ACTIVE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation']

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  const now = new Date()
  const staleDate = new Date(now)
  staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS)
  const staleDateStr = staleDate.toISOString()

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentDateStr = sevenDaysAgo.toISOString()

  try {
    // Step 1: Fetch all active leads
    const { data: activeLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, association_name, unit_count, estimated_annual_value, estimated_monthly_fee, stage, stage_changed_at, contact_name, contact_email, county, created_at, tenant_id')
      .in('stage', ACTIVE_STAGES)
      .order('estimated_annual_value', { ascending: false, nullsFirst: false })
      .limit(200)

    if (leadsErr) {
      return NextResponse.json(
        { error: `Failed to query leads: ${leadsErr.message}` },
        { status: 500 },
      )
    }

    if (!activeLeads || activeLeads.length === 0) {
      await postToDiscord({
        title: 'Sales Intelligence: No Active Leads',
        description: 'No active leads in the pipeline. Time to generate some new opportunities.',
        color: 0xfbbf24, // yellow warning
        timestamp: now.toISOString(),
        footer: { text: 'Vera Sales Intelligence Agent' },
      })

      return NextResponse.json({
        active_leads: 0,
        high_value_leads: 0,
        stale_leads: 0,
        new_leads_this_week: 0,
        message: 'No active leads found',
      })
    }

    // Step 2: Categorize leads
    const highValueLeads = activeLeads.filter(
      (l) =>
        (l.unit_count ?? 0) >= HIGH_VALUE_UNIT_THRESHOLD ||
        (l.estimated_annual_value ?? 0) >= HIGH_VALUE_ANNUAL_THRESHOLD,
    )

    const staleLeads = activeLeads.filter(
      (l) => l.stage_changed_at && l.stage_changed_at < staleDateStr,
    )

    const newLeadsThisWeek = activeLeads.filter(
      (l) => l.created_at >= recentDateStr,
    )

    // Step 3: Check for recent activity on top leads via lead_activities
    const topLeadIds = activeLeads.slice(0, TOP_LEADS_LIMIT).map((l) => l.id)
    const { data: recentActivities } = await supabase
      .from('lead_activities')
      .select('lead_id, type, occurred_at, title')
      .in('lead_id', topLeadIds)
      .gte('occurred_at', staleDateStr)
      .order('occurred_at', { ascending: false })
      .limit(50)

    const activityByLead = new Map<string, number>()
    for (const activity of recentActivities ?? []) {
      activityByLead.set(
        activity.lead_id,
        (activityByLead.get(activity.lead_id) ?? 0) + 1,
      )
    }

    // Step 4: Build the top leads list with engagement info
    const topLeadLines = activeLeads.slice(0, TOP_LEADS_LIMIT).map((lead) => {
      const value = lead.estimated_annual_value
        ? `$${(lead.estimated_annual_value / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
        : 'TBD'
      const units = lead.unit_count ?? '?'
      const activities = activityByLead.get(lead.id) ?? 0
      const isStale = lead.stage_changed_at && lead.stage_changed_at < staleDateStr
      const staleMarker = isStale ? ' :warning:' : ''

      return `**${lead.association_name}** — ${units} units, ${value}/yr, stage: \`${lead.stage}\`, activities(14d): ${activities}${staleMarker}`
    })

    // Step 5: Build stale leads needing follow-up
    const staleLeadLines = staleLeads.slice(0, 5).map((lead) => {
      const daysSinceChange = Math.floor(
        (now.getTime() - new Date(lead.stage_changed_at).getTime()) / 86400000,
      )
      return `**${lead.association_name}** — stuck in \`${lead.stage}\` for ${daysSinceChange} days (${lead.contact_name ?? 'No contact'})`
    })

    // Step 6: Calculate pipeline value
    const totalPipelineValue = activeLeads.reduce(
      (sum, l) => sum + (l.estimated_annual_value ?? 0),
      0,
    )
    const totalUnits = activeLeads.reduce(
      (sum, l) => sum + (l.unit_count ?? 0),
      0,
    )

    // Step 7: Determine severity color
    const color =
      staleLeads.length > activeLeads.length * 0.5
        ? 0xef4444 // red — over half the pipeline is stale
        : staleLeads.length > 3
          ? 0xfbbf24 // yellow — some leads going cold
          : 0x10b981 // green — pipeline is healthy

    // Step 8: Build Discord embed
    const fields = [
      {
        name: 'Pipeline Summary',
        value: `**${activeLeads.length}** active leads | **${totalUnits.toLocaleString()}** total units | **$${(totalPipelineValue / 100).toLocaleString('en-US')}**/yr pipeline value`,
        inline: false,
      },
      {
        name: `Top ${Math.min(TOP_LEADS_LIMIT, activeLeads.length)} Leads`,
        value: topLeadLines.join('\n') || 'None',
        inline: false,
      },
    ]

    if (newLeadsThisWeek.length > 0) {
      fields.push({
        name: 'New This Week',
        value: newLeadsThisWeek
          .slice(0, 5)
          .map((l) => `**${l.association_name}** — ${l.unit_count ?? '?'} units (${l.county ?? 'FL'})`)
          .join('\n'),
        inline: false,
      })
    }

    if (staleLeadLines.length > 0) {
      fields.push({
        name: `Needs Follow-Up (${staleLeads.length} stale)`,
        value: staleLeadLines.join('\n'),
        inline: false,
      })
    }

    const embed = {
      title: 'Sales Intelligence Briefing',
      color,
      fields,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Sales Intelligence Agent' },
    }

    await postToDiscord(embed)

    return NextResponse.json({
      active_leads: activeLeads.length,
      high_value_leads: highValueLeads.length,
      stale_leads: staleLeads.length,
      new_leads_this_week: newLeadsThisWeek.length,
      total_pipeline_value: totalPipelineValue,
      total_units: totalUnits,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
