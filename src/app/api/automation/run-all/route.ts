/**
 * Automation: Run all
 * POST /api/automation/run-all (x-automation-secret)
 *
 * Daily orchestration:
 *   1. POST /api/sync/run (HubSpot + QuickBooks syncs) and wait for it.
 *   2. Run the five analysis agents in parallel, then the Notion publish.
 *      They run even if the sync failed, against whatever data is already stored; each agent records its
 *      own agent_runs row and skips when its source has no data.
 *   3. Post one Discord summary when DISCORD_WEBHOOK_URL is set.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'
import { AGENTS, type AgentKey } from '@/lib/intelligence/agents'
import { postStatusMessage, type Severity } from '@/lib/services/discord-notify'

export const maxDuration = 300

type CallResult = { ok: boolean; status: number; data: unknown; error?: string; elapsedMs: number }
type JobStatus = 'succeeded' | 'skipped' | 'failed'

async function callInternal(url: string, secret: string): Promise<CallResult> {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-automation-secret': secret },
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data, elapsedMs: Date.now() - started }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : 'Request failed',
      elapsedMs: Date.now() - started,
    }
  }
}

function field(data: unknown, key: string): unknown {
  return data && typeof data === 'object' ? (data as Record<string, unknown>)[key] : undefined
}

function jobStatus(r: CallResult): JobStatus {
  if (!r.ok || r.error) return 'failed'
  const status = field(r.data, 'status')
  if (status === 'skipped') return 'skipped'
  if (status === 'failed' || field(r.data, 'error')) return 'failed'
  return 'succeeded'
}

function summaryLine(label: string, status: JobStatus, r: CallResult): string {
  const detail = String(field(r.data, 'headline') ?? field(r.data, 'error') ?? r.error ?? `HTTP ${r.status}`)
  const short = detail.length > 160 ? `${detail.slice(0, 157)}...` : detail
  return `**${label}**: ${status}. ${short}`
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTOMATION_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'AUTOMATION_SECRET environment variable is not configured' }, { status: 500 })
  }
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const started = Date.now()

  // 1. Syncs first, so agents read fresh data.
  const sync = await callInternal(`${baseUrl}/api/sync/run`, secret)
  const syncStatus: JobStatus = !sync.ok || sync.error ? 'failed' : 'succeeded'

  // 2. Analysis agents in parallel, then the Notion publish, so the Notion
  //    page carries today's headlines rather than yesterday's.
  const runAgent = async (a: (typeof AGENTS)[number]) => ({
    agent: a,
    result: await callInternal(`${baseUrl}/api/automation/${a.key}`, secret),
  })
  const analysis = await Promise.all(AGENTS.filter((a) => a.key !== 'sync-notion-daily').map(runAgent))
  const publish = await Promise.all(AGENTS.filter((a) => a.key === 'sync-notion-daily').map(runAgent))
  const agentCalls = [...analysis, ...publish]

  const results: Record<string, unknown> = {}
  const failures: string[] = []
  const skipped: string[] = []
  for (const { agent, result } of agentCalls) {
    results[agent.key.replace(/-/g, '_')] = result.data ?? { error: result.error ?? `HTTP ${result.status}` }
    const status = jobStatus(result)
    if (status === 'failed') failures.push(agent.key)
    if (status === 'skipped') skipped.push(agent.key)
  }
  const elapsed = Date.now() - started

  // 3. One Discord summary.
  if (process.env.DISCORD_WEBHOOK_URL) {
    const failedCount = failures.length + (syncStatus === 'failed' ? 1 : 0)
    const severity: Severity = failedCount === 0 ? 'healthy' : failedCount <= 2 ? 'warning' : 'critical'
    const lines = [
      summaryLine('Data sync', syncStatus, sync),
      ...agentCalls.map(({ agent, result }) => summaryLine(agent.label, jobStatus(result), result)),
      '',
      `${AGENTS.length - failures.length - skipped.length} of ${AGENTS.length} agents succeeded, ${skipped.length} skipped, ${failures.length} failed. ${Math.round(elapsed / 1000)}s total.`,
    ]
    await postStatusMessage(
      failedCount === 0 ? 'Empire Ops daily run complete' : `Empire Ops daily run: ${failedCount} failed`,
      lines.join('\n'),
      severity,
    )
  }

  return NextResponse.json({
    run_at: new Date().toISOString(),
    elapsed_ms: elapsed,
    sync: { status: syncStatus, http_status: sync.status, result: sync.data ?? { error: sync.error } },
    jobs_run: AGENTS.length,
    jobs_failed: failures.length,
    jobs_skipped: skipped.length,
    failures: failures.length > 0 ? (failures as AgentKey[]) : undefined,
    results,
  })
}
