import { describe, expect, it } from 'vitest'
import type { AdminClient } from '@/lib/supabase/admin'
import { buildCommunityMatcher, commitImport, MappingError, prepareImport, type CommunityRef } from '../commit'
import type { ParsedTable } from '../parse'
import { mappingProblems, makeRowValidator } from '../records'

const NOW = '2026-10-08T12:00:00.000Z'

function table(headers: string[], rows: string[][]): ParsedTable {
  return {
    format: 'csv',
    sheetName: null,
    headerRowNumber: 1,
    titleLines: [],
    headers,
    rows,
    rowNumbers: rows.map((_, i) => i + 2),
  }
}

const communities: CommunityRef[] = [
  { id: 'c-1', vantaca_id: 'OAK', name: 'Oak Hollow HOA' },
  { id: 'c-2', vantaca_id: 'PINE', name: 'Pine Ridge' },
  { id: 'c-3', vantaca_id: 'PINE2', name: 'Pine Ridge' },
]

describe('buildCommunityMatcher', () => {
  const match = buildCommunityMatcher(communities)
  it('matches by Vantaca ID first, case-insensitively', () => {
    expect(match('oak')).toEqual({ ok: true, id: 'c-1' })
  })
  it('falls back to exact case-insensitive name', () => {
    expect(match('  oak hollow   hoa ')).toEqual({ ok: true, id: 'c-1' })
  })
  it('never guesses on partial or ambiguous names', () => {
    expect(match('Oak Hollow').ok).toBe(false)
    const ambiguous = match('Pine Ridge')
    expect(ambiguous.ok).toBe(false)
    if (!ambiguous.ok) expect(ambiguous.reason).toMatch(/2 communities/)
  })
})

describe('mappingProblems', () => {
  it('requires required fields and real headers', () => {
    const problems = mappingProblems('communities', { vantaca_id: 'Code', name: 'Missing' }, ['Code', 'Name'])
    expect(problems).toEqual(['Name: the column "Missing" is not in this file.'])
    expect(mappingProblems('communities', { vantaca_id: 'Code' }, ['Code'])).toEqual([
      'Name is required: choose the column that holds it.',
    ])
  })
  it('rejects one column used for two fields', () => {
    expect(mappingProblems('communities', { vantaca_id: 'Code', name: 'Code' }, ['Code'])[0]).toMatch(/both/)
  })
  it('accepts a file-level as-of date in place of an as-of column', () => {
    const m = { association: 'Assoc', total: 'Total' }
    expect(mappingProblems('ar_aging', m, ['Assoc', 'Total'])).toEqual([
      'As-of date: choose a column or set one date for the whole file.',
    ])
    expect(mappingProblems('ar_aging', m, ['Assoc', 'Total'], { asOf: '2026-09-30' })).toEqual([])
    expect(mappingProblems('ar_aging', m, ['Assoc', 'Total'], { asOf: 'soon' })[0]).toMatch(/not a date/)
  })
  it('requires at least one balance column for AR aging', () => {
    expect(mappingProblems('ar_aging', { association: 'Assoc' }, ['Assoc'], { asOf: '2026-09-30' })).toContain(
      'Choose at least one balance column (Current, 30, 60, 90+ days, or Total).',
    )
  })
})

describe('makeRowValidator', () => {
  it('reports every bad cell in a row', () => {
    const v = makeRowValidator('communities', { vantaca_id: 'Code', name: 'Name', doors: 'Doors' }, ['Code', 'Name', 'Doors'])
    expect(v(['', 'X', '12.5'])).toEqual({
      ok: false,
      reasons: ['Vantaca ID is blank', 'Doors: "12.5" is not a whole number'],
    })
    expect(v(['A', 'X', '-1'])).toEqual({ ok: false, reasons: ['Doors cannot be negative'] })
  })
})

describe('prepareImport: ar_aging', () => {
  const headers = ['Assoc', 'Current', '31-60', '61-90', 'Over 90']
  const mapping = { association: 'Assoc', current_due: 'Current', days_30: '31-60', days_60: '61-90', days_90_plus: 'Over 90' }

  it('skips rows whose association cannot be matched, and reports why', () => {
    const t = table(headers, [
      ['OAK', '$100.00', '(25.00)', '', '1,000'],
      ['Unknown Assoc', '1', '1', '1', '1'],
      ['Pine Ridge', '1', '1', '1', '1'],
      ['Grand Total', '1', '1', '1', '1'],
    ])
    const p = prepareImport('ar_aging', t, mapping, { asOf: '9/30/2026', communities, now: NOW })
    expect(p.payloads).toEqual([
      {
        community_id: 'c-1',
        as_of: '2026-09-30',
        current_due: 100,
        days_30: -25,
        days_60: 0,
        days_90_plus: 1000,
        total: 1075,
        imported_at: NOW,
      },
    ])
    expect(p.skipped).toEqual([
      { row: 3, reason: 'Association "Unknown Assoc" matches no community (by Vantaca ID or exact name)' },
      { row: 4, reason: 'Association "Pine Ridge" matches 2 communities by name' },
      { row: 5, reason: 'Association "Grand Total" matches no community (by Vantaca ID or exact name)' },
    ])
  })

  it('uses a per-row as-of column when mapped, falling back to the file date for blanks', () => {
    const t = table(['Assoc', 'Date', 'Total'], [
      ['OAK', '10/1/2026', '5'],
      ['PINE', '', '6'],
    ])
    const p = prepareImport('ar_aging', t, { association: 'Assoc', as_of: 'Date', total: 'Total' }, {
      asOf: '2026-09-30',
      communities,
      now: NOW,
    })
    if (p.kind !== 'ar_aging') throw new Error('expected ar_aging')
    expect(p.payloads.map((x) => [x.community_id, x.as_of, x.total])).toEqual([
      ['c-1', '2026-10-01', 5],
      ['c-2', '2026-09-30', 6],
    ])
  })

  it('skips repeated associations and warns that the file may be homeowner-level', () => {
    const t = table(['Assoc', 'Total'], [['OAK', '1'], ['OAK', '2']])
    const p = prepareImport('ar_aging', t, { association: 'Assoc', total: 'Total' }, { asOf: '2026-09-30', communities })
    expect(p.payloads).toHaveLength(1)
    expect(p.skipped).toEqual([{ row: 3, reason: 'Duplicate of row 2 (same association and as-of date)' }])
    expect(p.warnings[0]).toMatch(/homeowner accounts/)
  })

  it('throws MappingError when the mapping is unusable', () => {
    expect(() => prepareImport('ar_aging', table(['A'], []), { association: 'A' }, {})).toThrow(MappingError)
  })
})

describe('prepareImport: communities', () => {
  it('upserts only mapped columns and leaves status alone when blank', () => {
    const t = table(['Code', 'Name', 'Status', 'Fee'], [
      ['OAK', 'Oak Hollow HOA', '', '$1,250.00'],
      ['PINE', 'Pine Ridge', 'Active', '(5)'],
      ['OAK', 'Oak again', 'x', '1'],
      ['', 'No code', '', ''],
    ])
    const p = prepareImport(
      'communities',
      t,
      { vantaca_id: 'Code', name: 'Name', status: 'Status', monthly_management_fee: 'Fee' },
      { now: NOW },
    )
    expect(p.payloads).toEqual([
      { vantaca_id: 'OAK', name: 'Oak Hollow HOA', monthly_management_fee: 1250, updated_at: NOW },
      { vantaca_id: 'PINE', name: 'Pine Ridge', monthly_management_fee: -5, status: 'Active', updated_at: NOW },
    ])
    expect(p.skipped).toEqual([
      { row: 4, reason: 'Duplicate of row 2 (same Vantaca ID "OAK")' },
      { row: 5, reason: 'Vantaca ID is blank' },
    ])
  })
})

describe('prepareImport: action_items', () => {
  const headers = ['XN', 'Assoc', 'Opened', 'Days']
  const mapping = { xn: 'XN', association: 'Assoc', opened_on: 'Opened', days_open: 'Days' }

  it('skips unmatched associations, keeps blank ones unlinked', () => {
    const t = table(headers, [
      ['1001', 'OAK', '45658', '3'],
      ['1002', 'Nowhere', '1/2/2025', '1'],
      ['1003', '', '2025-01-03', ''],
      ['1004', 'OAK', 'yesterday', '1'],
    ])
    const p = prepareImport('action_items', t, mapping, { communities, now: NOW })
    expect(p.payloads).toEqual([
      { xn: '1001', community_id: 'c-1', opened_on: '2025-01-01', days_open: 3, last_imported_at: NOW },
      { xn: '1003', community_id: null, opened_on: '2025-01-03', days_open: null, last_imported_at: NOW },
    ])
    expect(p.skipped.map((s) => s.row)).toEqual([3, 5])
    expect(p.skipped[1].reason).toBe('Opened: "yesterday" is not a date')
  })

  it('does not touch community_id when no association column is mapped', () => {
    const p = prepareImport('action_items', table(['XN', 'Status'], [['9', 'Open']]), { xn: 'XN', status: 'Status' }, { now: NOW })
    expect(p.payloads).toEqual([{ xn: '9', status: 'Open', last_imported_at: NOW }])
  })
})

// ── commitImport against a small in-memory stand-in for the Supabase client ──

type Call = { table: string; op: string; payload?: unknown; options?: unknown }

function fakeDb(opts: { communities?: CommunityRef[]; upsertError?: string } = {}) {
  const calls: Call[] = []
  const from = (table: string) => {
    const result = (data: unknown, error: unknown = null) => Promise.resolve({ data, error })
    return {
      select: () => ({
        order: () => ({
          range: (a: number, b: number) => result((opts.communities ?? []).slice(a, b + 1)),
        }),
      }),
      insert: (payload: unknown) => {
        calls.push({ table, op: 'insert', payload })
        return { select: () => ({ single: () => result({ id: 'run-1' }) }) }
      },
      update: (payload: unknown) => {
        calls.push({ table, op: 'update', payload })
        return { eq: () => result(null) }
      },
      upsert: (payload: unknown, options: unknown) => {
        calls.push({ table, op: 'upsert', payload, options })
        return result(null, opts.upsertError ? { message: opts.upsertError } : null)
      },
    }
  }
  return { db: { from } as unknown as AdminClient, calls }
}

describe('commitImport', () => {
  const t = table(['Assoc', 'Total'], [['OAK', '$10.00'], ['Nope', '$5.00']])
  const mapping = { association: 'Assoc', total: 'Total' }

  it('writes nothing on a dry run', async () => {
    const { db, calls } = fakeDb({ communities })
    const r = await commitImport(db, { kind: 'ar_aging', table: t, mapping, asOf: '2026-09-30', filename: 'a.csv', dryRun: true })
    expect(r).toMatchObject({ dry_run: true, run_id: null, rows_total: 2, rows_imported: 1, rows_skipped: 1 })
    expect(calls).toEqual([])
  })

  it('upserts matched rows and records a vantaca:<kind> sync run with detail', async () => {
    const { db, calls } = fakeDb({ communities })
    const r = await commitImport(db, { kind: 'ar_aging', table: t, mapping, asOf: '2026-09-30', filename: 'a.csv' })
    expect(r).toMatchObject({ dry_run: false, run_id: 'run-1', rows_imported: 1, rows_skipped: 1 })
    expect(calls[0]).toEqual({ table: 'sync_runs', op: 'insert', payload: { source: 'vantaca:ar_aging', company_id: null } })
    expect(calls[1]).toMatchObject({ table: 'ar_aging_snapshots', op: 'upsert', options: { onConflict: 'community_id,as_of' } })
    expect(calls[2]).toMatchObject({
      table: 'sync_runs',
      op: 'update',
      payload: {
        status: 'succeeded',
        rows_written: 1,
        detail: {
          filename: 'a.csv',
          rows_total: 2,
          rows_imported: 1,
          rows_skipped: 1,
          skipped_reasons: [{ row: 3, reason: expect.stringMatching(/"Nope" matches no community/) }],
        },
      },
    })
  })

  it('marks the run failed when every row is skipped', async () => {
    const { db, calls } = fakeDb({ communities: [] })
    const r = await commitImport(db, { kind: 'ar_aging', table: t, mapping, asOf: '2026-09-30', filename: 'a.csv' })
    expect(r.rows_imported).toBe(0)
    expect(calls.filter((c) => c.op === 'upsert')).toEqual([])
    expect(calls.at(-1)).toMatchObject({ op: 'update', payload: { status: 'failed', error: expect.stringMatching(/no rows imported, 2 skipped/) } })
  })

  it('marks the run failed and reports partial progress when a write fails', async () => {
    const { db, calls } = fakeDb({ communities, upsertError: 'boom' })
    await expect(
      commitImport(db, { kind: 'ar_aging', table: t, mapping, asOf: '2026-09-30', filename: 'a.csv' }),
    ).rejects.toThrow(/stopped after 0 of 1 rows: boom/)
    expect(calls.at(-1)).toMatchObject({ op: 'update', payload: { status: 'failed' } })
  })
})
