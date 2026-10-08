import type { AdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'
import { finishSyncRun, startSyncRun } from '@/lib/runs'
import { KINDS, type ImportKind, type Mapping } from './kinds'
import type { ParsedTable } from './parse'
import { AGING_BUCKETS, makeRowValidator, mappingProblems, type RowValues } from './records'

type Tables = Database['public']['Tables']
type CommunityInsert = Tables['communities']['Insert']
type AgingInsert = Tables['ar_aging_snapshots']['Insert']
type ActionItemInsert = Tables['action_items']['Insert']

export type CommunityRef = { id: string; vantaca_id: string; name: string }
export type SkipReason = { row: number; reason: string }

export class MappingError extends Error {
  constructor(public problems: string[]) {
    super(problems.join(' '))
  }
}

export class ImportWriteError extends Error {}

const DETAIL_REASON_LIMIT = 20
const RESPONSE_REASON_LIMIT = 200
const UPSERT_CHUNK = 500

const matchKey = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Resolves an association identifier from a file to one community: first by
 * Vantaca ID, then by exact (case-insensitive) name. Never a partial or fuzzy
 * match: anything else is reported so the row is skipped.
 */
export function buildCommunityMatcher(communities: CommunityRef[]) {
  const byId = new Map<string, CommunityRef[]>()
  const byName = new Map<string, CommunityRef[]>()
  for (const c of communities) {
    const idKey = matchKey(c.vantaca_id)
    const nameKey = matchKey(c.name)
    byId.set(idKey, [...(byId.get(idKey) ?? []), c])
    byName.set(nameKey, [...(byName.get(nameKey) ?? []), c])
  }
  return (identifier: string): { ok: true; id: string } | { ok: false; reason: string } => {
    const key = matchKey(identifier)
    const idHits = byId.get(key) ?? []
    if (idHits.length === 1) return { ok: true, id: idHits[0].id }
    if (idHits.length > 1) return { ok: false, reason: `Association "${identifier}" matches more than one Vantaca ID` }
    const nameHits = byName.get(key) ?? []
    if (nameHits.length === 1) return { ok: true, id: nameHits[0].id }
    if (nameHits.length > 1) {
      return { ok: false, reason: `Association "${identifier}" matches ${nameHits.length} communities by name` }
    }
    return { ok: false, reason: `Association "${identifier}" matches no community (by Vantaca ID or exact name)` }
  }
}

export type PreparedImport =
  | { kind: 'communities'; payloads: CommunityInsert[]; rowsTotal: number; skipped: SkipReason[]; warnings: string[] }
  | { kind: 'ar_aging'; payloads: AgingInsert[]; rowsTotal: number; skipped: SkipReason[]; warnings: string[] }
  | { kind: 'action_items'; payloads: ActionItemInsert[]; rowsTotal: number; skipped: SkipReason[]; warnings: string[] }

const pick = <T,>(values: RowValues, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in values).map((k) => [k, values[k]])) as T

/**
 * Validates every row and builds database payloads. Pure: no I/O.
 * Throws MappingError when the mapping itself is unusable.
 */
export function prepareImport(
  kind: ImportKind,
  table: ParsedTable,
  mapping: Mapping,
  opts: { asOf?: string | null; communities?: CommunityRef[]; now?: string } = {},
): PreparedImport {
  const problems = mappingProblems(kind, mapping, table.headers, { asOf: opts.asOf })
  if (problems.length > 0) throw new MappingError(problems)

  const now = opts.now ?? new Date().toISOString()
  const validate = makeRowValidator(kind, mapping, table.headers, { asOf: opts.asOf })
  const match = buildCommunityMatcher(opts.communities ?? [])
  const skipped: SkipReason[] = []
  const warnings: string[] = []
  const firstRowForKey = new Map<string, number>()
  let duplicates = 0

  const claim = (key: string, rowNumber: number, label: string): boolean => {
    const first = firstRowForKey.get(key)
    if (first !== undefined) {
      duplicates++
      skipped.push({ row: rowNumber, reason: `Duplicate of row ${first} (same ${label})` })
      return false
    }
    firstRowForKey.set(key, rowNumber)
    return true
  }

  const valid: { rowNumber: number; values: RowValues }[] = []
  table.rows.forEach((row, i) => {
    const rowNumber = table.rowNumbers[i] ?? i + 1
    const outcome = validate(row)
    if (!outcome.ok) skipped.push({ row: rowNumber, reason: outcome.reasons.join('; ') })
    else valid.push({ rowNumber, values: outcome.values })
  })

  const fieldKeys = KINDS[kind].fields.map((f) => f.key)
  const rowsTotal = table.rows.length

  if (kind === 'communities') {
    const payloads: CommunityInsert[] = []
    for (const { rowNumber, values } of valid) {
      const id = values.vantaca_id as string
      if (!claim(id, rowNumber, `Vantaca ID "${id}"`)) continue
      const payload = pick<CommunityInsert>(values, fieldKeys)
      // status is NOT NULL: a blank cell leaves the stored status unchanged.
      if (payload.status === null) delete payload.status
      payload.updated_at = now
      payloads.push(payload)
    }
    return { kind, payloads, rowsTotal, skipped: sortSkips(skipped), warnings }
  }

  if (kind === 'ar_aging') {
    const payloads: AgingInsert[] = []
    let totalMismatch = 0
    const allBucketsMapped = AGING_BUCKETS.every((k) => mapping[k])
    for (const { rowNumber, values } of valid) {
      const m = match(values.association as string)
      if (!m.ok) {
        skipped.push({ row: rowNumber, reason: m.reason })
        continue
      }
      if (!claim(`${m.id}|${values.as_of}`, rowNumber, `association and as-of date`)) continue
      const payload = pick<AgingInsert>(values, [...AGING_BUCKETS, 'total', 'as_of'])
      payload.community_id = m.id
      payload.imported_at = now
      if (allBucketsMapped && mapping.total) {
        const sum = AGING_BUCKETS.reduce((s, k) => s + Math.round((values[k] as number) * 100), 0)
        if (sum !== Math.round((values.total as number) * 100)) totalMismatch++
      }
      payloads.push(payload)
    }
    if (duplicates > 0) {
      warnings.push(
        `${duplicates} row(s) repeat an association already in this file and were skipped. AR aging is stored as one row per association per date; if this export lists homeowner accounts, export the association summary instead.`,
      )
    }
    if (totalMismatch > 0) {
      warnings.push(
        `${totalMismatch} row(s) have a Total that differs from the sum of the age columns. Totals were imported as written in the file.`,
      )
    }
    return { kind, payloads, rowsTotal, skipped: sortSkips(skipped), warnings }
  }

  const payloads: ActionItemInsert[] = []
  for (const { rowNumber, values } of valid) {
    const xn = values.xn as string
    let communityId: string | null | undefined
    if ('association' in values) {
      if (values.association === null) communityId = null
      else {
        const m = match(values.association as string)
        if (!m.ok) {
          skipped.push({ row: rowNumber, reason: m.reason })
          continue
        }
        communityId = m.id
      }
    }
    if (!claim(xn, rowNumber, `XN "${xn}"`)) continue
    const payload = pick<ActionItemInsert>(values, fieldKeys.filter((k) => k !== 'association'))
    if (communityId !== undefined) payload.community_id = communityId
    payload.last_imported_at = now
    payloads.push(payload)
  }
  return { kind: 'action_items', payloads, rowsTotal, skipped: sortSkips(skipped), warnings }
}

function sortSkips(skipped: SkipReason[]) {
  return skipped.sort((a, b) => a.row - b.row)
}

/** All communities, for association matching. */
export async function loadCommunityRefs(db: AdminClient): Promise<CommunityRef[]> {
  const all: CommunityRef[] = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from('communities')
      .select('id, vantaca_id, name')
      .order('id')
      .range(from, from + page - 1)
    if (error) throw new ImportWriteError(`Could not load communities: ${error.message}`)
    all.push(...(data ?? []))
    if (!data || data.length < page) return all
  }
}

/** Groups payloads by their key set so a blank cell never resets a column it does not name. */
function groupByShape<T extends object>(payloads: T[]): T[][] {
  const groups = new Map<string, T[]>()
  for (const p of payloads) {
    const shape = Object.keys(p).sort().join(',')
    groups.set(shape, [...(groups.get(shape) ?? []), p])
  }
  const out: T[][] = []
  for (const g of groups.values()) for (let i = 0; i < g.length; i += UPSERT_CHUNK) out.push(g.slice(i, i + UPSERT_CHUNK))
  return out
}

async function writePrepared(db: AdminClient, prepared: PreparedImport, onWritten: (n: number) => void) {
  if (prepared.kind === 'communities') {
    for (const chunk of groupByShape(prepared.payloads)) {
      const { error } = await db.from('communities').upsert(chunk, { onConflict: 'vantaca_id' })
      if (error) throw new ImportWriteError(error.message)
      onWritten(chunk.length)
    }
  } else if (prepared.kind === 'ar_aging') {
    for (const chunk of groupByShape(prepared.payloads)) {
      const { error } = await db.from('ar_aging_snapshots').upsert(chunk, { onConflict: 'community_id,as_of' })
      if (error) throw new ImportWriteError(error.message)
      onWritten(chunk.length)
    }
  } else {
    for (const chunk of groupByShape(prepared.payloads)) {
      const { error } = await db.from('action_items').upsert(chunk, { onConflict: 'xn' })
      if (error) throw new ImportWriteError(error.message)
      onWritten(chunk.length)
    }
  }
}

export type CommitResult = {
  dry_run: boolean
  run_id: string | null
  filename: string
  rows_total: number
  /** Rows written (or, on a dry run, rows that would be written). */
  rows_imported: number
  rows_skipped: number
  skipped_reasons: SkipReason[]
  warnings: string[]
}

/**
 * Validates, matches associations, and (unless dryRun) upserts the rows and
 * records a sync_runs row with source "vantaca:<kind>".
 */
export async function commitImport(
  db: AdminClient,
  input: { kind: ImportKind; table: ParsedTable; mapping: Mapping; asOf?: string | null; filename: string; dryRun?: boolean },
): Promise<CommitResult> {
  const { kind, table, mapping, filename } = input
  // Check the mapping before any database access.
  const problems = mappingProblems(kind, mapping, table.headers, { asOf: input.asOf })
  if (problems.length > 0) throw new MappingError(problems)
  const communities = kind === 'communities' ? [] : await loadCommunityRefs(db)
  const prepared = prepareImport(kind, table, mapping, { asOf: input.asOf, communities })

  const base = {
    filename,
    rows_total: prepared.rowsTotal,
    rows_skipped: prepared.skipped.length,
    skipped_reasons: prepared.skipped.slice(0, RESPONSE_REASON_LIMIT),
    warnings: prepared.warnings,
  }
  if (input.dryRun) return { ...base, dry_run: true, run_id: null, rows_imported: prepared.payloads.length }

  const runId = await startSyncRun(db, `vantaca:${kind}`)
  let written = 0
  try {
    await writePrepared(db, prepared, (n) => (written += n))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finishSyncRun(db, runId, { ok: false, rows: written, error: `${filename}: write failed after ${written} rows: ${message}` })
    throw new ImportWriteError(`The import stopped after ${written} of ${prepared.payloads.length} rows: ${message}`)
  }

  if (written === 0) {
    const first = prepared.skipped.slice(0, 3).map((s) => `row ${s.row}: ${s.reason}`).join('; ')
    const error =
      prepared.rowsTotal === 0
        ? `${filename}: the file has no data rows`
        : `${filename}: no rows imported, ${prepared.skipped.length} skipped${first ? ` (${first})` : ''}`
    await finishSyncRun(db, runId, { ok: false, rows: 0, error })
  } else {
    await finishSyncRun(db, runId, {
      ok: true,
      rows: written,
      detail: {
        filename,
        rows_total: prepared.rowsTotal,
        rows_imported: written,
        rows_skipped: prepared.skipped.length,
        skipped_reasons: prepared.skipped.slice(0, DETAIL_REASON_LIMIT),
      },
    })
  }
  return { ...base, dry_run: false, run_id: runId, rows_imported: written }
}
