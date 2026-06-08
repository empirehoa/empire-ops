/**
 * GET /api/admin/agent-status
 *
 * Consolidated agent dashboard API. Returns the current status of all
 * automation agents in a single JSON response, including:
 * - Agent metadata (name, type, endpoint, schedule)
 * - Latest report file and parsed date/status from markdown headers
 * - System-level totals
 *
 * Requires admin read permission (super_admin or tenant_admin).
 */

import { NextResponse } from 'next/server'
import { checkRoutePermission } from '@/lib/auth/rbac'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Agent registry — canonical list of all automation agents
// ---------------------------------------------------------------------------

interface AgentDefinition {
  name: string
  type: 'core' | 'intelligence'
  endpoint: string
  schedule: 'daily' | 'weekly' | 'monthly'
  description: string
}

const AGENT_REGISTRY: AgentDefinition[] = [
  // Core Operations (7)
  {
    name: 'post-assessments',
    type: 'core',
    endpoint: '/api/automation/post-assessments',
    schedule: 'daily',
    description: 'Monthly assessment billing by billing_day',
  },
  {
    name: 'late-fees',
    type: 'core',
    endpoint: '/api/automation/late-fees',
    schedule: 'daily',
    description: 'Apply late fees (flat/pct/daily calculation)',
  },
  {
    name: 'payment-plans',
    type: 'core',
    endpoint: '/api/automation/payment-plans',
    schedule: 'daily',
    description: 'Process payment plan installments',
  },
  {
    name: 'collection-escalation',
    type: 'core',
    endpoint: '/api/automation/collection-escalation',
    schedule: 'daily',
    description: 'Rule-based collection escalation with 30-day dedup',
  },
  {
    name: 'escalate-violations',
    type: 'core',
    endpoint: '/api/automation/escalate-violations',
    schedule: 'daily',
    description: 'FL statute violation lifecycle auto-escalation',
  },
  {
    name: 'generate-meeting-packets',
    type: 'core',
    endpoint: '/api/automation/generate-meeting-packets',
    schedule: 'daily',
    description: 'Board meeting packet generation (14-day lookahead)',
  },
  {
    name: 'generate-recurring-work-orders',
    type: 'core',
    endpoint: '/api/automation/generate-recurring-work-orders',
    schedule: 'daily',
    description: 'Template-driven recurring work order creation',
  },

  // Intelligence Agents (5)
  {
    name: 'sales-intelligence',
    type: 'intelligence',
    endpoint: '/api/automation/sales-intelligence',
    schedule: 'daily',
    description: 'Pipeline analysis, stale lead detection, lead ranking',
  },
  {
    name: 'financial-health',
    type: 'intelligence',
    endpoint: '/api/automation/financial-health',
    schedule: 'daily',
    description: 'AR analysis, delinquency rate, budget variance detection',
  },
  {
    name: 'client-retention',
    type: 'intelligence',
    endpoint: '/api/automation/client-retention',
    schedule: 'daily',
    description: 'Churn early warning from health scores and payment patterns',
  },
  {
    name: 'cross-sell',
    type: 'intelligence',
    endpoint: '/api/automation/cross-sell',
    schedule: 'daily',
    description: 'Opportunity matching across Empire/WFW/FixIQ/Riance',
  },
  {
    name: 'competitive-intel',
    type: 'intelligence',
    endpoint: '/api/automation/competitive-intel',
    schedule: 'daily',
    description: 'Per-door fee benchmarks and market positioning',
  },

  // Sync & Reporting (1)
  {
    name: 'sync-notion-daily',
    type: 'core',
    endpoint: '/api/automation/sync-notion-daily',
    schedule: 'daily',
    description: 'Push intelligence data to Notion workspace',
  },
]

// ---------------------------------------------------------------------------
// Report file parsing helpers
// ---------------------------------------------------------------------------

const REPORTS_DIR = join(process.cwd(), 'docs', 'agent-reports')

interface ReportMeta {
  lastReport: string | null
  lastReportFile: string | null
  reportStatus: string | null
}

/**
 * Parse the header of a `-latest.md` report file to extract date and status.
 * Expected format:
 *   **Run date:** 2026-04-14
 *   **Build status:** PASS (...)
 */
async function parseReportMeta(filename: string): Promise<ReportMeta> {
  const filePath = join(REPORTS_DIR, filename)

  try {
    const content = await readFile(filePath, 'utf-8')

    // Extract date from "**Run date:** YYYY-MM-DD" or "Run date: YYYY-MM-DD"
    const dateMatch = content.match(/\*?\*?Run date\*?\*?:\s*(\d{4}-\d{2}-\d{2})/)
    const lastReport = dateMatch ? dateMatch[1] : null

    // Extract status from "**Build status:** PASS" or similar
    const statusMatch = content.match(/\*?\*?(?:Build )?[Ss]tatus\*?\*?:\s*(\w+)/)
    const reportStatus = statusMatch ? statusMatch[1].toUpperCase() : null

    return {
      lastReport,
      lastReportFile: `docs/agent-reports/${filename}`,
      reportStatus,
    }
  } catch {
    return { lastReport: null, lastReportFile: null, reportStatus: null }
  }
}

/**
 * Scan the agent-reports directory for all -latest.md files and build a
 * lookup map keyed by agent name derived from the filename.
 */
async function scanReportFiles(): Promise<Map<string, ReportMeta>> {
  const reportMap = new Map<string, ReportMeta>()

  try {
    const files = await readdir(REPORTS_DIR)
    const latestFiles = files.filter((f) => f.endsWith('-latest.md'))

    const results = await Promise.all(
      latestFiles.map(async (filename) => {
        const meta = await parseReportMeta(filename)
        // Derive agent name: "sales-intelligence-latest.md" -> "sales-intelligence"
        const agentName = filename.replace(/-latest\.md$/, '')
        return { agentName, meta }
      })
    )

    for (const { agentName, meta } of results) {
      reportMap.set(agentName, meta)
    }
  } catch {
    // Directory may not exist — return empty map
  }

  return reportMap
}

/**
 * Count all -latest.md files (including ones not in the registry,
 * representing legacy reports from old Claude Code sessions).
 */
async function countLegacyReports(): Promise<number> {
  try {
    const files = await readdir(REPORTS_DIR)
    return files.filter((f) => f.endsWith('-latest.md')).length
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  // ---- Auth ---------------------------------------------------------------
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  // ---- Scan report files --------------------------------------------------
  const [reportMap, legacyCount] = await Promise.all([
    scanReportFiles(),
    countLegacyReports(),
  ])

  // ---- Build agent status list --------------------------------------------
  const agents = AGENT_REGISTRY.map((agent) => {
    const report = reportMap.get(agent.name)

    return {
      name: agent.name,
      type: agent.type,
      endpoint: agent.endpoint,
      schedule: agent.schedule,
      description: agent.description,
      lastReport: report?.lastReport ?? null,
      lastReportFile: report?.lastReportFile ?? null,
      reportStatus: report?.reportStatus ?? null,
      status: 'active' as const,
    }
  })

  // ---- System summary -----------------------------------------------------
  const coreAgents = AGENT_REGISTRY.filter((a) => a.type === 'core').length
  const intelligenceAgents = AGENT_REGISTRY.filter((a) => a.type === 'intelligence').length

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    agents,
    system: {
      cronEndpoint: '/api/cron/run-all',
      cronSchedule: '0 6 * * * (daily at 06:00 UTC)',
      totalAgents: AGENT_REGISTRY.length,
      coreAgents,
      intelligenceAgents,
      apiAgents: AGENT_REGISTRY.length,
      legacyReports: legacyCount,
    },
  })
}
