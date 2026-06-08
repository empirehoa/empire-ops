/**
 * Automation: Financial Health Agent
 * POST /api/automation/financial-health
 *
 * Scheduled intelligence agent that:
 * 1. Queries charges and payment_applications to compute AR totals
 * 2. Calculates delinquency rate (overdue charges / total charges)
 * 3. Calculates collections efficiency (amount_paid / amount charged)
 * 4. Compares actuals against budget targets if budget data exists
 * 5. Flags any variance > 10% for immediate attention
 * 6. Posts a financial health summary to Discord
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.0%'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

const VARIANCE_THRESHOLD = 0.10 // 10%

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Calculate fiscal year date range (Jan-Dec default)
  const fiscalYearStart = `${currentYear}-01-01`

  try {
    // Step 1: Fetch all charges for current fiscal year
    const { data: charges, error: chargesErr } = await supabase
      .from('charges')
      .select('id, amount, amount_paid, balance_due, status, due_date, charge_type, association_id, tenant_id')
      .gte('charge_date', fiscalYearStart)
      .limit(10000)

    if (chargesErr) {
      return NextResponse.json(
        { error: `Failed to query charges: ${chargesErr.message}` },
        { status: 500 },
      )
    }

    if (!charges || charges.length === 0) {
      await postToDiscord({
        title: 'Financial Health: No Charge Data',
        description: 'No charges found for the current fiscal year. Financial health analysis skipped.',
        color: 0xfbbf24,
        timestamp: now.toISOString(),
        footer: { text: 'Vera Financial Health Agent' },
      })

      return NextResponse.json({
        message: 'No charges found for current fiscal year',
        total_charges: 0,
      })
    }

    // Step 2: Calculate aggregate financial metrics
    const totalCharged = charges.reduce((sum, c) => sum + c.amount, 0)
    const totalPaid = charges.reduce((sum, c) => sum + c.amount_paid, 0)
    const totalBalanceDue = charges.reduce((sum, c) => sum + (c.balance_due ?? (c.amount - c.amount_paid)), 0)

    // Overdue charges: past due_date and still have balance
    const overdueCharges = charges.filter(
      (c) => c.due_date < todayStr && (c.balance_due ?? (c.amount - c.amount_paid)) > 0,
    )
    const overdueAmount = overdueCharges.reduce(
      (sum, c) => sum + (c.balance_due ?? (c.amount - c.amount_paid)),
      0,
    )

    const delinquencyRate = totalCharged > 0 ? overdueAmount / totalCharged : 0
    const collectionsEfficiency = totalCharged > 0 ? totalPaid / totalCharged : 0

    // Step 3: Group by association for per-community analysis
    const byAssociation = new Map<string, { charged: number; paid: number; overdue: number; count: number }>()
    for (const charge of charges) {
      const existing = byAssociation.get(charge.association_id) ?? { charged: 0, paid: 0, overdue: 0, count: 0 }
      existing.charged += charge.amount
      existing.paid += charge.amount_paid
      existing.count++
      if (charge.due_date < todayStr && (charge.balance_due ?? (charge.amount - charge.amount_paid)) > 0) {
        existing.overdue += (charge.balance_due ?? (charge.amount - charge.amount_paid))
      }
      byAssociation.set(charge.association_id, existing)
    }

    // Identify worst delinquency communities
    const communityDelinquency = Array.from(byAssociation.entries())
      .map(([assocId, data]) => ({
        association_id: assocId,
        delinquency_rate: data.charged > 0 ? data.overdue / data.charged : 0,
        overdue_amount: data.overdue,
        charged: data.charged,
      }))
      .filter((c) => c.overdue_amount > 0)
      .sort((a, b) => b.overdue_amount - a.overdue_amount)

    // Step 4: Look up association names for top offenders
    const topOffenderIds = communityDelinquency.slice(0, 5).map((c) => c.association_id)
    const { data: assocNames } = topOffenderIds.length > 0
      ? await supabase
          .from('associations')
          .select('id, name')
          .in('id', topOffenderIds)
      : { data: [] }

    const nameMap = new Map((assocNames ?? []).map((a) => [a.id, a.name]))

    // Step 5: Check budget variance if budgets exist for current year
    const budgetVariances: Array<{ name: string; budgeted: number; actual: number; variance: number }> = []

    const { data: budgets } = await supabase
      .from('budgets')
      .select('id, association_id, total_revenue, total_expense, name')
      .eq('fiscal_year', currentYear)
      .eq('status', 'approved')
      .limit(100)

    if (budgets && budgets.length > 0) {
      // For each budgeted association, compare actual charges (revenue) vs budget
      for (const budget of budgets) {
        const assocCharges = byAssociation.get(budget.association_id)
        if (!assocCharges) continue

        // Pro-rate the annual budget to the current month
        const monthsElapsed = currentMonth
        const proRatedBudgetRevenue = (budget.total_revenue / 12) * monthsElapsed

        if (proRatedBudgetRevenue > 0) {
          const variance = (assocCharges.charged - proRatedBudgetRevenue) / proRatedBudgetRevenue
          if (Math.abs(variance) > VARIANCE_THRESHOLD) {
            budgetVariances.push({
              name: budget.name,
              budgeted: proRatedBudgetRevenue,
              actual: assocCharges.charged,
              variance,
            })
          }
        }
      }
    }

    // Step 6: Determine severity
    let color = 0x10b981 // green
    let title = 'Financial Health: All Clear'

    if (delinquencyRate > 0.15 || budgetVariances.length > 3) {
      color = 0xef4444 // red
      title = 'Financial Health: Critical Alerts'
    } else if (delinquencyRate > 0.08 || budgetVariances.length > 0) {
      color = 0xfbbf24 // yellow
      title = 'Financial Health: Warnings Detected'
    }

    // Step 7: Build Discord embed fields
    const fields = [
      {
        name: 'AR Summary (YTD)',
        value: [
          `Total Charged: **${formatCents(totalCharged)}**`,
          `Total Collected: **${formatCents(totalPaid)}**`,
          `Outstanding AR: **${formatCents(totalBalanceDue)}**`,
          `Overdue AR: **${formatCents(overdueAmount)}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Key Ratios',
        value: [
          `Collections Efficiency: **${pct(totalPaid, totalCharged)}**`,
          `Delinquency Rate: **${pct(overdueAmount, totalCharged)}**`,
          `Overdue Accounts: **${overdueCharges.length}**`,
          `Communities Reporting: **${byAssociation.size}**`,
        ].join('\n'),
        inline: true,
      },
    ]

    if (communityDelinquency.length > 0) {
      const worstLines = communityDelinquency.slice(0, 5).map((c) => {
        const name = nameMap.get(c.association_id) ?? c.association_id.slice(0, 8)
        return `**${name}** — ${formatCents(c.overdue_amount)} overdue (${pct(c.overdue_amount, c.charged)})`
      })
      fields.push({
        name: `Highest Delinquency (${communityDelinquency.length} communities)`,
        value: worstLines.join('\n'),
        inline: false,
      })
    }

    if (budgetVariances.length > 0) {
      const varianceLines = budgetVariances.slice(0, 5).map((v) => {
        const direction = v.variance > 0 ? 'over' : 'under'
        return `**${v.name}** — ${formatCents(v.actual)} vs ${formatCents(v.budgeted)} budgeted (${(Math.abs(v.variance) * 100).toFixed(1)}% ${direction})`
      })
      fields.push({
        name: `Budget Variances > 10% (${budgetVariances.length} found)`,
        value: varianceLines.join('\n'),
        inline: false,
      })
    }

    await postToDiscord({
      title,
      color,
      fields,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Financial Health Agent' },
    })

    return NextResponse.json({
      total_charges: charges.length,
      total_charged: totalCharged,
      total_paid: totalPaid,
      outstanding_ar: totalBalanceDue,
      overdue_ar: overdueAmount,
      delinquency_rate: delinquencyRate,
      collections_efficiency: collectionsEfficiency,
      communities_analyzed: byAssociation.size,
      communities_with_delinquency: communityDelinquency.length,
      budget_variances_flagged: budgetVariances.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
