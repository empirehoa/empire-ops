/**
 * POST /api/admin/sync-notion
 *
 * Manual run of the Notion daily report for an admin: builds the intelligence
 * snapshot from the database and creates or replaces today's Notion page.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { loadLatestAgentRuns } from '@/lib/intelligence/load'
import { buildIntelligenceSnapshot } from '@/lib/intelligence/snapshot'
import { NotionApiError, notionConfigured, publishDailyReport } from '@/lib/services/notion-sync'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 120

export async function POST() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  if (!notionConfigured()) {
    return NextResponse.json(
      { error: 'Notion is not configured. Set NOTION_API_KEY and either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID.' },
      { status: 400 },
    )
  }

  try {
    const db = createAdminClient()
    const [snapshot, agentRuns] = await Promise.all([buildIntelligenceSnapshot(db), loadLatestAgentRuns(db)])
    const page = await publishDailyReport(snapshot, agentRuns)
    return NextResponse.json({ synced_at: new Date().toISOString(), page })
  } catch (err) {
    if (err instanceof NotionApiError) {
      return NextResponse.json({ error: err.message, status: err.status }, { status: 502 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Notion sync failed' }, { status: 500 })
  }
}
