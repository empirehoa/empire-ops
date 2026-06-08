/**
 * Automation: Run All
 * POST /api/automation/run-all
 *
 * Convenience endpoint that runs all automation jobs in parallel:
 * 1. Assessment auto-posting (billing_day match)
 * 2. Late fee posting
 * 3. Payment plan installment processing
 * 4. Collection escalation
 * 5. Violation lifecycle auto-escalation
 * 6. Board meeting packet auto-generation (14 days ahead)
 * 7. Recurring work order generation
 * 8. Sales intelligence briefing
 * 9. Financial health analysis
 * 10. Client retention / churn detection
 * 11. Cross-sell opportunity scanning
 * 12. Competitive intelligence / market positioning
 * 13. Notion daily sync
 * 14. Deliver managers reports (monthly email reports)
 *
 * Protected by AUTOMATION_SECRET header.
 * Posts a Discord alert if any job fails.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'

// ─── Discord alert ────────────────────────────────────────────────────────────

async function sendDiscordAlert(failures: string[], elapsed: number): Promise<void> {
  const webhookUrl = process.env.DISCORD_AUTOMATION_WEBHOOK_URL
  if (!webhookUrl) return

  const description =
    failures.length === 0
      ? `All automation jobs completed successfully in ${elapsed}ms.`
      : `**${failures.length} job(s) failed** (${elapsed}ms total):\n${failures.map((f) => `• ${f}`).join('\n')}`

  const color = failures.length === 0 ? 0x10b981 : 0xef4444 // emerald or red

  const payload = JSON.stringify({
    embeds: [
      {
        title: failures.length === 0 ? 'Automation Run: All Clear' : 'Automation Run: Failures Detected',
        description,
        color,
        timestamp: new Date().toISOString(),
        footer: { text: 'Vera Automation' },
      },
    ],
  })

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  } catch {
    // Non-fatal — don't let Discord failure block the response
  }
}

// ─── Internal caller — forwards the auth header ───────────────────────────────

async function callAutomation(
  path: string,
  secret: string,
  baseUrl: string
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  try {
    const url = `${baseUrl}/api/automation/${path}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-automation-secret': secret,
      },
    })
    const data = await res.json()
    return { ok: res.ok, data }
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown fetch error',
    }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!process.env.AUTOMATION_SECRET) {
    return NextResponse.json(
      { error: 'AUTOMATION_SECRET environment variable is not configured' },
      { status: 500 }
    )
  }

  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = process.env.AUTOMATION_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const startTime = Date.now()

  const [
    postAssessmentsResult,
    lateFeesResult,
    paymentPlansResult,
    escalationResult,
    violationEscalationResult,
    meetingPacketsResult,
    recurringWorkOrdersResult,
    salesIntelligenceResult,
    financialHealthResult,
    clientRetentionResult,
    crossSellResult,
    competitiveIntelResult,
    syncNotionResult,
    deliverManagersReportsResult,
  ] = await Promise.allSettled([
    callAutomation('post-assessments', secret, appUrl),
    callAutomation('late-fees', secret, appUrl),
    callAutomation('payment-plans', secret, appUrl),
    callAutomation('collection-escalation', secret, appUrl),
    callAutomation('escalate-violations', secret, appUrl),
    callAutomation('generate-meeting-packets', secret, appUrl),
    callAutomation('generate-recurring-work-orders', secret, appUrl),
    callAutomation('sales-intelligence', secret, appUrl),
    callAutomation('financial-health', secret, appUrl),
    callAutomation('client-retention', secret, appUrl),
    callAutomation('cross-sell', secret, appUrl),
    callAutomation('competitive-intel', secret, appUrl),
    callAutomation('sync-notion-daily', secret, appUrl),
    callAutomation('deliver-managers-reports', secret, appUrl),
  ])

  const elapsed = Date.now() - startTime

  function unwrap(result: PromiseSettledResult<{ ok: boolean; data: unknown; error?: string }>) {
    if (result.status === 'fulfilled') return result.value.data
    return { error: result.reason }
  }

  function didFail(result: PromiseSettledResult<{ ok: boolean; data: unknown; error?: string }>): boolean {
    if (result.status === 'rejected') return true
    if (!result.value.ok) return true
    const data = result.value.data as Record<string, unknown> | null
    if (data && typeof data === 'object' && 'error' in data) return true
    return false
  }

  const jobResults = {
    post_assessments: unwrap(postAssessmentsResult),
    late_fees: unwrap(lateFeesResult),
    payment_plans: unwrap(paymentPlansResult),
    collection_escalation: unwrap(escalationResult),
    violation_escalation: unwrap(violationEscalationResult),
    meeting_packets: unwrap(meetingPacketsResult),
    recurring_work_orders: unwrap(recurringWorkOrdersResult),
    sales_intelligence: unwrap(salesIntelligenceResult),
    financial_health: unwrap(financialHealthResult),
    client_retention: unwrap(clientRetentionResult),
    cross_sell: unwrap(crossSellResult),
    competitive_intel: unwrap(competitiveIntelResult),
    sync_notion: unwrap(syncNotionResult),
    deliver_managers_reports: unwrap(deliverManagersReportsResult),
  }

  // Collect failures for Discord alert
  const jobNames: Record<string, PromiseSettledResult<{ ok: boolean; data: unknown; error?: string }>> = {
    'post-assessments': postAssessmentsResult,
    'late-fees': lateFeesResult,
    'payment-plans': paymentPlansResult,
    'collection-escalation': escalationResult,
    'escalate-violations': violationEscalationResult,
    'generate-meeting-packets': meetingPacketsResult,
    'generate-recurring-work-orders': recurringWorkOrdersResult,
    'sales-intelligence': salesIntelligenceResult,
    'financial-health': financialHealthResult,
    'client-retention': clientRetentionResult,
    'cross-sell': crossSellResult,
    'competitive-intel': competitiveIntelResult,
    'sync-notion-daily': syncNotionResult,
    'deliver-managers-reports': deliverManagersReportsResult,
  }

  const failures = Object.entries(jobNames)
    .filter(([, result]) => didFail(result))
    .map(([name]) => name)

  // Fire-and-forget Discord alert
  await sendDiscordAlert(failures, elapsed)

  return NextResponse.json({
    run_at: new Date().toISOString(),
    elapsed_ms: elapsed,
    jobs_run: 14,
    jobs_failed: failures.length,
    failures: failures.length > 0 ? failures : undefined,
    results: jobResults,
  })
}
