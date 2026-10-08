// Classifies sync_runs.source values into the three data sources and picks the
// latest run per source. Source names are written by the sync and import code;
// matching is by prefix so 'hubspot', 'hubspot:deals', 'vantaca:ar_aging', etc. all work.

import type { SyncRunRow } from '@/lib/types/database'

export type SourceKind = 'hubspot' | 'quickbooks' | 'vantaca' | 'other'

export type SyncRunInput = Pick<
  SyncRunRow,
  'source' | 'company_id' | 'status' | 'started_at' | 'finished_at' | 'rows_written' | 'error'
>

export function classifySource(source: string): SourceKind {
  const s = source.trim().toLowerCase()
  if (s.startsWith('hubspot')) return 'hubspot'
  if (s.startsWith('quickbooks') || s.startsWith('qbo')) return 'quickbooks'
  if (s.startsWith('vantaca')) return 'vantaca'
  return 'other'
}

const VANTACA_KIND_LABELS: Record<string, string> = {
  communities: 'Community list',
  community_list: 'Community list',
  community: 'Community list',
  ar_aging: 'AR aging',
  ar: 'AR aging',
  aging: 'AR aging',
  action_items: 'Action items',
  actions: 'Action items',
}

/** 'vantaca:ar_aging' -> 'AR aging'; unknown suffixes are title-cased. */
export function vantacaKindLabel(source: string): string {
  const suffix = source.trim().toLowerCase().replace(/^vantaca[\s:_\-./]*/, '').replace(/[\s\-./:]+/g, '_')
  if (!suffix) return 'Vantaca import'
  return VANTACA_KIND_LABELS[suffix] ?? suffix.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

export type SourceRuns = { lastRun: SyncRunInput | null; lastSuccess: SyncRunInput | null }

/** Latest run and latest successful run per key. Rows may arrive in any order. */
export function latestRunsBy(runs: SyncRunInput[], keyOf: (r: SyncRunInput) => string | null): Map<string, SourceRuns> {
  const out = new Map<string, SourceRuns>()
  const sorted = [...runs].sort((a, b) => (a.started_at < b.started_at ? 1 : -1))
  for (const r of sorted) {
    const key = keyOf(r)
    if (key === null) continue
    const cur = out.get(key) ?? { lastRun: null, lastSuccess: null }
    if (!cur.lastRun) cur.lastRun = r
    if (!cur.lastSuccess && r.status === 'succeeded') cur.lastSuccess = r
    out.set(key, cur)
  }
  return out
}
