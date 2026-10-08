/**
 * Agent: Notion daily report
 * POST /api/automation/sync-notion-daily (x-automation-secret)
 *
 * Builds the intelligence snapshot straight from the database (the same data
 * the dashboards show), adds the latest headline from each agent, and creates or
 * replaces today's page in Notion. Skips, naming the settings, when Notion is
 * not configured.
 */

import type { NextRequest } from 'next/server'
import { loadLatestAgentRuns } from '@/lib/intelligence/load'
import { buildIntelligenceSnapshot } from '@/lib/intelligence/snapshot'
import { notionConfigured, publishDailyReport } from '@/lib/services/notion-sync'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  return runAgent(request, 'sync-notion-daily', async (db, now) => {
    if (!notionConfigured()) {
      return {
        status: 'skipped',
        headline:
          'Skipped: Notion is not configured. Set NOTION_API_KEY and either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID.',
      }
    }
    const [snapshot, agentRuns] = await Promise.all([buildIntelligenceSnapshot(db, now), loadLatestAgentRuns(db)])
    const page = await publishDailyReport(
      snapshot,
      agentRuns.filter((r) => r.agent !== 'sync-notion-daily'),
    )
    const sections = {
      pipeline: snapshot.pipeline !== null,
      ar: snapshot.ar !== null,
      action_items: snapshot.aging !== null,
      retention: snapshot.retention !== null,
      cross_sell: snapshot.crossSell !== null,
      pricing: snapshot.pricing !== null,
      companies_with_qbo_data: snapshot.revenue.companies.filter((c) => c.hasData).length,
    }
    return {
      status: 'succeeded',
      headline: `Published "${page.title}" to Notion.`,
      metrics: { page_url: page.url, companies_with_qbo_data: sections.companies_with_qbo_data },
      findings: { page, sections },
      discordFields: { Page: page.url },
    }
  })
}
