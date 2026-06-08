/**
 * POST /api/admin/sync-notion
 *
 * Manual Notion sync endpoint for admin users. Fetches intelligence data from
 * the internal intelligence APIs and pushes structured pages to Notion:
 *
 *   1. Daily Intelligence Report — portfolio metrics, financial health,
 *      compliance, operations, pipeline, revenue concentration, churn risk
 *   2. Cross-Sell Opportunities — formatted table of cross-company opportunities
 *   3. Pricing Analysis — tier benchmarks and under-priced communities
 *
 * Requires super_admin or tenant_admin role (same as /api/admin/intelligence).
 *
 * Request body (all optional):
 *   { include_cross_sell?: boolean, include_pricing?: boolean }
 *
 * Returns a summary of what was synced with page IDs and URLs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRoutePermission } from '@/lib/auth/rbac'
import {
  upsertIntelligenceReport,
  NotionApiError,
  type IntelligenceReportData,
} from '@/lib/services/notion-sync'

// ---------------------------------------------------------------------------
// Internal data fetcher — calls the intelligence APIs server-side
// ---------------------------------------------------------------------------

async function fetchIntelligenceData(
  appUrl: string,
  cookieHeader: string
): Promise<{
  intelligence: Record<string, unknown> | null
  crossSell: Record<string, unknown> | null
  pricing: Record<string, unknown> | null
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
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

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ---- Auth (same pattern as /api/admin/intelligence) ----------------------
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  // ---- Validate Notion env vars -------------------------------------------
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: 'NOTION_API_KEY is not configured. Add it to your environment variables.' },
      { status: 500 }
    )
  }
  if (!process.env.NOTION_WORKSPACE_DATABASE_ID && !process.env.NOTION_INTELLIGENCE_PAGE_ID) {
    return NextResponse.json(
      {
        error:
          'Either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID must be configured.',
      },
      { status: 500 }
    )
  }

  // ---- Parse optional request body ----------------------------------------
  let includeCrossSell = true
  let includePricing = true

  try {
    const body = await request.json()
    if (typeof body.include_cross_sell === 'boolean') includeCrossSell = body.include_cross_sell
    if (typeof body.include_pricing === 'boolean') includePricing = body.include_pricing
  } catch {
    // No body or invalid JSON — use defaults (include everything)
  }

  // ---- Fetch intelligence data from internal APIs -------------------------
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const cookieHeader = request.headers.get('cookie') ?? ''

  const { intelligence, crossSell, pricing } = await fetchIntelligenceData(appUrl, cookieHeader)

  if (!intelligence) {
    return NextResponse.json(
      { error: 'Failed to fetch intelligence data from /api/admin/intelligence' },
      { status: 502 }
    )
  }

  // ---- Push to Notion -----------------------------------------------------
  try {
    const reportData: IntelligenceReportData = {
      intelligence,
      crossSell: includeCrossSell ? crossSell ?? undefined : undefined,
      pricing: includePricing ? pricing ?? undefined : undefined,
    }

    const result = await upsertIntelligenceReport(reportData)

    return NextResponse.json({
      synced_at: new Date().toISOString(),
      tenant_id: auth.tenantId,
      pages_synced: result.pages_synced,
      intelligence_page: result.intelligence_page,
      cross_sell_page: result.cross_sell_page,
      pricing_page: result.pricing_page,
    })
  } catch (err) {
    if (err instanceof NotionApiError) {
      return NextResponse.json(
        {
          error: `Notion API error: ${err.message}`,
          status: err.status,
          details: err.body,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error during Notion sync' },
      { status: 500 }
    )
  }
}
