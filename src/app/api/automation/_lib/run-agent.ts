// Shared wrapper for the intelligence agents: auth, agent_runs bookkeeping,
// Discord delivery and the JSON response. Folders starting with "_" are not routes.

import { NextResponse, type NextRequest } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'
import { agentLabel, type AgentKey } from '@/lib/intelligence/agents'
import { finishAgentRun, startAgentRun } from '@/lib/runs'
import { postAgentReport, postStatusMessage, type Severity } from '@/lib/services/discord-notify'
import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'

export type AgentMetrics = Record<string, number | string | null>

export type AgentResult =
  | {
      status: 'succeeded'
      headline: string
      metrics: AgentMetrics
      findings?: unknown
      severity?: Severity
      /** Display-ready fields for the Discord embed (money already formatted). */
      discordFields?: Record<string, string>
    }
  | { status: 'skipped'; headline: string; metrics?: AgentMetrics; findings?: unknown }

export type AgentResponse =
  | { agent: AgentKey; run_id: string; status: 'succeeded' | 'skipped'; headline: string; metrics: AgentMetrics | null; findings: unknown }
  | { agent: AgentKey; run_id: string | null; status: 'failed'; error: string }

function discordEnabled(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL)
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export async function runAgent(
  request: NextRequest,
  agent: AgentKey,
  compute: (db: AdminClient, now: Date) => Promise<AgentResult>,
): Promise<NextResponse> {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let db: AdminClient
  let runId: string
  try {
    db = createAdminClient()
    runId = await startAgentRun(db, agent)
  } catch (err) {
    const body: AgentResponse = { agent, run_id: null, status: 'failed', error: messageOf(err) }
    return NextResponse.json(body, { status: 500 })
  }

  try {
    const result = await compute(db, new Date())
    await finishAgentRun(db, runId, {
      status: result.status,
      headline: result.headline,
      metrics: result.metrics ?? null,
      findings: result.findings ?? null,
    })
    if (discordEnabled()) {
      if (result.status === 'succeeded') {
        await postAgentReport(agentLabel(agent), result.headline, result.discordFields ?? {}, result.severity ?? 'healthy')
      } else {
        await postStatusMessage(`${agentLabel(agent)}: skipped`, result.headline, 'warning')
      }
    }
    const body: AgentResponse = {
      agent,
      run_id: runId,
      status: result.status,
      headline: result.headline,
      metrics: result.metrics ?? null,
      findings: result.findings ?? null,
    }
    return NextResponse.json(body)
  } catch (err) {
    const error = messageOf(err)
    await finishAgentRun(db, runId, { status: 'failed', error }).catch(() => undefined)
    if (discordEnabled()) await postStatusMessage(`${agentLabel(agent)}: failed`, error, 'critical')
    const body: AgentResponse = { agent, run_id: runId, status: 'failed', error }
    return NextResponse.json(body, { status: 500 })
  }
}
