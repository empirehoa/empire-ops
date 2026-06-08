/**
 * Automation: Client Retention Agent
 * POST /api/automation/client-retention
 *
 * Scheduled intelligence agent that detects early churn signals:
 * 1. Queries community_health_scores for declining trends
 * 2. Identifies communities with rising violation counts (compliance fatigue)
 * 3. Detects communities with declining payment rates (financial stress)
 * 4. Cross-references community_offboarding for active offboarding signals
 * 5. Posts an early churn warning list to Discord
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

interface ChurnSignal {
  association_id: string
  association_name: string
  signals: string[]
  risk_score: number // 0-100
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const db = supabase as any

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0]

  try {
    // Build a map of association_id -> signals
    const signalMap = new Map<string, { signals: string[]; riskPoints: number }>()

    function addSignal(assocId: string, signal: string, points: number) {
      const existing = signalMap.get(assocId) ?? { signals: [], riskPoints: 0 }
      existing.signals.push(signal)
      existing.riskPoints += points
      signalMap.set(assocId, existing)
    }

    // Signal 1: Declining community health scores
    const { data: decliningScores } = await supabase
      .from('community_health_scores')
      .select('association_id, overall_score, financial_score, compliance_score, maintenance_score, score_trend')
      .eq('score_trend', 'declining')

    for (const score of decliningScores ?? []) {
      const details: string[] = []
      if (score.overall_score !== null && score.overall_score < 50) details.push(`overall: ${score.overall_score}`)
      if (score.financial_score !== null && score.financial_score < 50) details.push(`financial: ${score.financial_score}`)
      if (score.compliance_score !== null && score.compliance_score < 50) details.push(`compliance: ${score.compliance_score}`)
      if (score.maintenance_score !== null && score.maintenance_score < 50) details.push(`maintenance: ${score.maintenance_score}`)

      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''
      addSignal(score.association_id, `Health score declining${detailStr}`, 30)
    }

    // Signal 2: Rising violation counts — compare last 30 days vs prior 30 days
    const { data: recentViolations } = await supabase
      .from('violations')
      .select('association_id')
      .gte('created_at', thirtyDaysAgoStr)

    const { data: priorViolations } = await supabase
      .from('violations')
      .select('association_id')
      .gte('created_at', sixtyDaysAgoStr)
      .lt('created_at', thirtyDaysAgoStr)

    const recentViolationCounts = new Map<string, number>()
    for (const v of recentViolations ?? []) {
      recentViolationCounts.set(v.association_id, (recentViolationCounts.get(v.association_id) ?? 0) + 1)
    }
    const priorViolationCounts = new Map<string, number>()
    for (const v of priorViolations ?? []) {
      priorViolationCounts.set(v.association_id, (priorViolationCounts.get(v.association_id) ?? 0) + 1)
    }

    for (const [assocId, recentCount] of recentViolationCounts) {
      const priorCount = priorViolationCounts.get(assocId) ?? 0
      if (recentCount > priorCount && recentCount >= 5) {
        const increase = priorCount > 0 ? Math.round(((recentCount - priorCount) / priorCount) * 100) : 100
        addSignal(assocId, `Violations rising: ${priorCount} -> ${recentCount} (${increase}% increase)`, 20)
      }
    }

    // Signal 3: Declining payment rates
    const { data: recentCharges } = await supabase
      .from('charges')
      .select('association_id, amount, amount_paid, due_date')
      .gte('charge_date', sixtyDaysAgoStr)
      .limit(10000)

    // Group charges by association and time period
    const paymentRates = new Map<string, { recent: { charged: number; paid: number }; prior: { charged: number; paid: number } }>()

    for (const charge of recentCharges ?? []) {
      const existing = paymentRates.get(charge.association_id) ?? {
        recent: { charged: 0, paid: 0 },
        prior: { charged: 0, paid: 0 },
      }
      if (charge.due_date >= thirtyDaysAgoStr) {
        existing.recent.charged += charge.amount
        existing.recent.paid += charge.amount_paid
      } else {
        existing.prior.charged += charge.amount
        existing.prior.paid += charge.amount_paid
      }
      paymentRates.set(charge.association_id, existing)
    }

    for (const [assocId, rates] of paymentRates) {
      if (rates.prior.charged > 0 && rates.recent.charged > 0) {
        const priorRate = rates.prior.paid / rates.prior.charged
        const recentRate = rates.recent.paid / rates.recent.charged
        const decline = priorRate - recentRate

        if (decline > 0.10 && priorRate > 0.5) {
          addSignal(
            assocId,
            `Payment rate declining: ${(priorRate * 100).toFixed(0)}% -> ${(recentRate * 100).toFixed(0)}%`,
            25,
          )
        }
      }
    }

    // Signal 4: Active offboarding processes
    const { data: offboardings } = await db
      .from('community_offboarding')
      .select('association_id, status, reason, termination_date')
      .in('status', ['initiated', 'in_progress', 'pending'])

    for (const ob of offboardings ?? []) {
      const reason = ob.reason ? ` (${ob.reason})` : ''
      addSignal(ob.association_id, `Active offboarding: ${ob.status}${reason}`, 50)
    }

    // Step 5: Resolve association names for flagged communities
    const flaggedAssocIds = Array.from(signalMap.keys())

    if (flaggedAssocIds.length === 0) {
      await postToDiscord({
        title: 'Client Retention: No Churn Signals',
        description: 'All communities are healthy. No early warning signals detected.',
        color: 0x10b981,
        timestamp: now.toISOString(),
        footer: { text: 'Vera Client Retention Agent' },
      })

      return NextResponse.json({
        communities_analyzed: recentViolationCounts.size + paymentRates.size,
        at_risk_communities: 0,
        message: 'No churn signals detected',
      })
    }

    const { data: associations } = await supabase
      .from('associations')
      .select('id, name, unit_count')
      .in('id', flaggedAssocIds)

    const assocMap = new Map((associations ?? []).map((a) => [a.id, a]))

    // Build sorted risk list
    const riskList: ChurnSignal[] = flaggedAssocIds
      .map((assocId) => {
        const data = signalMap.get(assocId)!
        const assoc = assocMap.get(assocId)
        return {
          association_id: assocId,
          association_name: assoc?.name ?? assocId.slice(0, 8),
          signals: data.signals,
          risk_score: Math.min(data.riskPoints, 100),
        }
      })
      .sort((a, b) => b.risk_score - a.risk_score)

    // Step 6: Determine severity
    const criticalCount = riskList.filter((r) => r.risk_score >= 70).length
    const warningCount = riskList.filter((r) => r.risk_score >= 40 && r.risk_score < 70).length

    let color = 0x10b981
    let title = 'Client Retention: Monitoring'

    if (criticalCount > 0) {
      color = 0xef4444
      title = `Client Retention: ${criticalCount} Critical Risk${criticalCount > 1 ? 's' : ''}`
    } else if (warningCount > 0) {
      color = 0xfbbf24
      title = `Client Retention: ${warningCount} Warning${warningCount > 1 ? 's' : ''}`
    }

    // Step 7: Build Discord embed
    const fields = [
      {
        name: 'Summary',
        value: `**${riskList.length}** communities flagged | **${criticalCount}** critical | **${warningCount}** warning`,
        inline: false,
      },
    ]

    // Show top 8 at-risk communities
    const topRisks = riskList.slice(0, 8)
    for (const risk of topRisks) {
      const riskEmoji = risk.risk_score >= 70 ? ':red_circle:' : risk.risk_score >= 40 ? ':yellow_circle:' : ':green_circle:'
      const assoc = assocMap.get(risk.association_id)
      const units = assoc?.unit_count ? ` (${assoc.unit_count} units)` : ''

      fields.push({
        name: `${riskEmoji} ${risk.association_name}${units} — Risk: ${risk.risk_score}/100`,
        value: risk.signals.map((s) => `- ${s}`).join('\n'),
        inline: false,
      })
    }

    if (riskList.length > 8) {
      fields.push({
        name: 'Additional',
        value: `${riskList.length - 8} more communities with signals not shown.`,
        inline: false,
      })
    }

    await postToDiscord({
      title,
      color,
      fields,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Client Retention Agent' },
    })

    return NextResponse.json({
      communities_analyzed: new Set([
        ...recentViolationCounts.keys(),
        ...paymentRates.keys(),
        ...(decliningScores ?? []).map((s) => s.association_id),
      ]).size,
      at_risk_communities: riskList.length,
      critical_risk: criticalCount,
      warning_risk: warningCount,
      top_risks: riskList.slice(0, 5).map((r) => ({
        name: r.association_name,
        risk_score: r.risk_score,
        signals: r.signals,
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
