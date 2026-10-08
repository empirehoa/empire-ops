import type { AdminClient } from '@/lib/supabase/admin'

/** Records a sync/import run so dashboards can show data freshness. */
export async function startSyncRun(db: AdminClient, source: string, companyId?: string) {
  const { data, error } = await db
    .from('sync_runs')
    .insert({ source, company_id: companyId ?? null })
    .select('id')
    .single()
  if (error) throw new Error(`Could not record sync run: ${error.message}`)
  return data.id
}

export async function finishSyncRun(
  db: AdminClient,
  id: string,
  result: { ok: true; rows: number; detail?: unknown } | { ok: false; error: string; rows?: number },
) {
  await db
    .from('sync_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: result.ok ? 'succeeded' : 'failed',
      rows_written: result.rows ?? 0,
      detail: result.ok ? (result.detail ?? null) : null,
      error: result.ok ? null : result.error,
    })
    .eq('id', id)
}

export async function startAgentRun(db: AdminClient, agent: string) {
  const { data, error } = await db.from('agent_runs').insert({ agent }).select('id').single()
  if (error) throw new Error(`Could not record agent run: ${error.message}`)
  return data.id
}

export async function finishAgentRun(
  db: AdminClient,
  id: string,
  result:
    | { status: 'succeeded' | 'skipped'; headline: string; metrics?: unknown; findings?: unknown }
    | { status: 'failed'; error: string },
) {
  await db
    .from('agent_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: result.status,
      headline: result.status === 'failed' ? null : result.headline,
      metrics: result.status === 'failed' ? null : (result.metrics ?? null),
      findings: result.status === 'failed' ? null : (result.findings ?? null),
      error: result.status === 'failed' ? result.error : null,
    })
    .eq('id', id)
}

/** Most recent successful sync per source, for "data as of" labels. */
export async function latestSyncs(db: AdminClient) {
  const { data } = await db
    .from('sync_runs')
    .select('source, finished_at, rows_written')
    .eq('status', 'succeeded')
    .order('finished_at', { ascending: false })
    .limit(200)
  const latest = new Map<string, { finished_at: string | null; rows_written: number }>()
  for (const row of data ?? []) if (!latest.has(row.source)) latest.set(row.source, row)
  return latest
}
