/**
 * Automation: Run All
 * POST /api/automation/run-all
 *
 * Convenience endpoint that runs all intelligence jobs in parallel:
 * 1. Sales intelligence briefing
 * 2. Financial health analysis
 * 3. Client retention / churn detection
 * 4. Cross-sell opportunity scanning
 * 5. Competitive intelligence / market positioning
 * 6. Notion daily sync
 *
 * Core HOA operations jobs (assessments, late fees, violations, meeting
 * packets, work orders) run in the Vera platform — not this repo.
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

  // Intelligence-only repo: core HOA operations jobs (assessments, late fees,
  // violations, etc.) run in the Vera platform, not here.
  const [
    salesIntelligenceResult,
    financialHealthResult,
    clientRetentionResult,
    crossSellResult,
    competitiveIntelResult,
    syncNotionResult,
  ] = await Promise.allSettled([
    callAutomation('sales-intelligence', secret, appUrl),
    callAutomation('financial-health', secret, appUrl),
    callAutomation('client-retention', secret, appUrl),
    callAutomation('cross-sell', secret, appUrl),
    callAutomation('competitive-intel', secret, appUrl),
    callAutomation('sync-notion-daily', secret, appUrl),
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
    sales_intelligence: unwrap(salesIntelligenceResult),
    financial_health: unwrap(financialHealthResult),
    client_retention: unwrap(clientRetentionResult),
    cross_sell: unwrap(crossSellResult),
    competitive_intel: unwrap(competitiveIntelResult),
    sync_notion: unwrap(syncNotionResult),
  }

  // Collect failures for Discord alert
  const jobNames: Record<string, PromiseSettledResult<{ ok: boolean; data: unknown; error?: string }>> = {
    'sales-intelligence': salesIntelligenceResult,
    'financial-health': financialHealthResult,
    'client-retention': clientRetentionResult,
    'cross-sell': crossSellResult,
    'competitive-intel': competitiveIntelResult,
    'sync-notion-daily': syncNotionResult,
  }

  const failures = Object.entries(jobNames)
    .filter(([, result]) => didFail(result))
    .map(([name]) => name)

  // Fire-and-forget Discord alert
  await sendDiscordAlert(failures, elapsed)

  return NextResponse.json({
    run_at: new Date().toISOString(),
    elapsed_ms: elapsed,
    jobs_run: 6,
    jobs_failed: failures.length,
    failures: failures.length > 0 ? failures : undefined,
    results: jobResults,
  })
}
