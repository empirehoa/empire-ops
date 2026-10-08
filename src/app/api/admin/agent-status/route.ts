/**
 * GET /api/admin/agent-status
 *
 * The latest agent_runs row for each scheduled agent (and any other agent name
 * found in agent_runs). Agents that have never run are listed with status
 * "never_run".
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { AGENTS, agentLabel } from '@/lib/intelligence/agents'
import { loadLatestAgentRuns } from '@/lib/intelligence/load'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    const runs = await loadLatestAgentRuns(createAdminClient())
    const byAgent = new Map(runs.map((r) => [r.agent, r]))
    const known = new Set<string>(AGENTS.map((a) => a.key))
    const agents = [
      ...AGENTS.map((a) => ({ key: a.key, label: a.label, sources: a.sources, latest: byAgent.get(a.key) ?? null })),
      ...runs.filter((r) => !known.has(r.agent)).map((r) => ({ key: r.agent, label: agentLabel(r.agent), sources: null, latest: r })),
    ].map(({ latest, ...a }) => ({
      ...a,
      status: latest?.status ?? 'never_run',
      headline: latest?.headline ?? null,
      error: latest?.error ?? null,
      started_at: latest?.started_at ?? null,
      finished_at: latest?.finished_at ?? null,
      duration_ms:
        latest?.finished_at && latest.started_at
          ? new Date(latest.finished_at).getTime() - new Date(latest.started_at).getTime()
          : null,
      metrics: latest?.metrics ?? null,
    }))
    return NextResponse.json({ checked_at: new Date().toISOString(), agents })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not read agent runs' }, { status: 500 })
  }
}
