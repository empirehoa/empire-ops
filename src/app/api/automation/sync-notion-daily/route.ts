/**
 * Automation: Daily Notion Sync
 * POST /api/automation/sync-notion-daily
 *
 * Scheduled automation agent that pushes a daily intelligence snapshot to Notion:
 *   1. Fetches portfolio intelligence, cross-sell, and pricing data using a
 *      service-role Supabase client (bypasses RLS for automation).
 *   2. Creates or updates structured Notion pages with the latest data.
 *   3. Posts a confirmation or failure alert to Discord.
 *
 * Designed to be added to the cron schedule in /api/cron/run-all.
 *
 * Protected by AUTOMATION_SECRET header (x-automation-secret).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'
import {
  upsertIntelligenceReport,
  NotionApiError,
  type IntelligenceReportData,
} from '@/lib/services/notion-sync'

// ─── Discord embed post ──────────────────────────────────────────────────────

async function postToDiscord(embed: Record<string, unknown>): Promise<void> {
  const webhookUrl =
    process.env.DISCORD_WEBHOOK_URL ?? process.env.DISCORD_AUTOMATION_WEBHOOK_URL
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

// ─── Internal data fetcher — calls intelligence APIs with automation secret ──

async function fetchIntelligenceViaApi(
  appUrl: string,
  secret: string
): Promise<{
  intelligence: Record<string, unknown> | null
  crossSell: Record<string, unknown> | null
  pricing: Record<string, unknown> | null
}> {
  // The intelligence APIs require admin auth, so we call them with the
  // automation secret and rely on the internal routing. For automation,
  // we fetch via the app URL so the routes process with full context.
  //
  // Alternative: directly query Supabase with the service role key.
  // We use the API approach to keep logic DRY — the intelligence routes
  // already handle all the aggregation.

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-automation-secret': secret,
  }

  const [intelligenceRes, crossSellRes, pricingRes] = await Promise.allSettled([
    fetch(`${appUrl}/api/admin/intelligence`, { headers }),
    fetch(`${appUrl}/api/admin/intelligence/cross-sell`, { headers }),
    fetch(`${appUrl}/api/admin/intelligence/pricing`, { headers }),
  ])

  async function extractJson(
    result: PromiseSettledResult<Response>
  ): Promise<Record<string, unknown> | null> {
    if (result.status === 'rejected') return null
    if (!result.value.ok) return null
    try {
      return (await result.value.json()) as Record<string, unknown>
    } catch {
      return null
    }
  }

  return {
    intelligence: await extractJson(intelligenceRes),
    crossSell: await extractJson(crossSellRes),
    pricing: await extractJson(pricingRes),
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const startTime = Date.now()

  // ---- Validate Notion env vars -------------------------------------------
  if (!process.env.NOTION_API_KEY) {
    await postToDiscord({
      title: 'Notion Sync: Configuration Error',
      description: 'NOTION_API_KEY is not configured. Skipping daily sync.',
      color: 0xef4444,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Notion Sync Agent' },
    })

    return NextResponse.json(
      { error: 'NOTION_API_KEY is not configured' },
      { status: 500 }
    )
  }

  if (!process.env.NOTION_WORKSPACE_DATABASE_ID && !process.env.NOTION_INTELLIGENCE_PAGE_ID) {
    await postToDiscord({
      title: 'Notion Sync: Configuration Error',
      description:
        'Neither NOTION_WORKSPACE_DATABASE_ID nor NOTION_INTELLIGENCE_PAGE_ID is configured. Skipping daily sync.',
      color: 0xef4444,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Notion Sync Agent' },
    })

    return NextResponse.json(
      { error: 'Notion database/page ID not configured' },
      { status: 500 }
    )
  }

  try {
    // ---- Fetch intelligence data ------------------------------------------
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const secret = process.env.AUTOMATION_SECRET ?? ''

    const { intelligence, crossSell, pricing } = await fetchIntelligenceViaApi(appUrl, secret)

    const dataSources: string[] = []
    if (intelligence) dataSources.push('intelligence')
    if (crossSell) dataSources.push('cross-sell')
    if (pricing) dataSources.push('pricing')

    if (!intelligence) {
      await postToDiscord({
        title: 'Notion Sync: Data Fetch Failed',
        description:
          'Could not retrieve portfolio intelligence data. The Notion sync was skipped.',
        color: 0xef4444,
        timestamp: now.toISOString(),
        footer: { text: 'Vera Notion Sync Agent' },
      })

      return NextResponse.json(
        { error: 'Failed to fetch intelligence data' },
        { status: 502 }
      )
    }

    // ---- Push to Notion ---------------------------------------------------
    const reportData: IntelligenceReportData = {
      intelligence,
      crossSell: crossSell ?? undefined,
      pricing: pricing ?? undefined,
    }

    const result = await upsertIntelligenceReport(reportData)
    const elapsed = Date.now() - startTime

    // ---- Build success summary --------------------------------------------
    const pageLinks: string[] = []
    if (result.intelligence_page) {
      pageLinks.push(`[Intelligence Report](${result.intelligence_page.url})`)
    }
    if (result.cross_sell_page) {
      pageLinks.push(`[Cross-Sell](${result.cross_sell_page.url})`)
    }
    if (result.pricing_page) {
      pageLinks.push(`[Pricing Analysis](${result.pricing_page.url})`)
    }

    // Extract headline metrics for the Discord summary
    const portfolio = intelligence.portfolio_metrics as Record<string, number> | undefined
    const financial = intelligence.financial_health as Record<string, number> | undefined

    const metricsLine = portfolio
      ? `${portfolio.active_associations ?? 0} communities, ${portfolio.total_units ?? 0} doors`
      : 'Metrics unavailable'

    const financialLine = financial
      ? `AR: $${((financial.total_ar ?? 0) / 1000).toFixed(0)}k | Collections: ${financial.collections_rate ?? 0}% | Delinquency: ${financial.delinquency_rate ?? 0}%`
      : ''

    await postToDiscord({
      title: 'Notion Sync: Daily Report Published',
      description: [
        `**${result.pages_synced.length} pages** synced to Notion in ${elapsed}ms`,
        '',
        `**Portfolio**: ${metricsLine}`,
        financialLine ? `**Financial**: ${financialLine}` : '',
        '',
        pageLinks.length > 0 ? pageLinks.join(' | ') : '',
      ]
        .filter(Boolean)
        .join('\n'),
      color: 0x10b981, // green
      fields: [
        {
          name: 'Data Sources',
          value: dataSources.join(', '),
          inline: true,
        },
        {
          name: 'Pages Synced',
          value: result.pages_synced.join(', '),
          inline: true,
        },
      ],
      timestamp: now.toISOString(),
      footer: { text: 'Vera Notion Sync Agent' },
    })

    return NextResponse.json({
      synced_at: now.toISOString(),
      elapsed_ms: elapsed,
      data_sources: dataSources,
      pages_synced: result.pages_synced,
      intelligence_page: result.intelligence_page,
      cross_sell_page: result.cross_sell_page,
      pricing_page: result.pricing_page,
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    const errorMessage =
      err instanceof NotionApiError
        ? `Notion API error (${err.status}): ${err.message}`
        : err instanceof Error
          ? err.message
          : 'Unknown error'

    await postToDiscord({
      title: 'Notion Sync: Failed',
      description: `Daily Notion sync failed after ${elapsed}ms.\n\n**Error**: ${errorMessage}`,
      color: 0xef4444,
      timestamp: now.toISOString(),
      footer: { text: 'Vera Notion Sync Agent' },
    })

    return NextResponse.json(
      { error: errorMessage, elapsed_ms: elapsed },
      { status: 500 }
    )
  }
}
