import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/admin', () => ({ requireAdminApi: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { POST as preview } from '../preview/route'
import { POST as commit } from '../commit/route'
import { PATCH as patchCommunity } from '../communities/[id]/route'

const admin = { id: 'u1', email: 'admin@example.com' }

// Made-up headers for tests; not Vantaca's real column names.
const CSV = 'Sample AR Report\r\nAs of 9/30/2026\r\nAssoc ID,Current,Over 90,Total Due\r\nOAK,$10.00,(2.00),$8.00\r\nNOPE,1,1,2\r\n'

function form(fields: Record<string, string | File>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return new Request('http://localhost/api/imports/x', { method: 'POST', body: fd })
}
const csvFile = (text = CSV, name = 'aging.csv') => new File([text], name, { type: 'text/csv' })

beforeEach(() => {
  vi.mocked(requireAdminApi).mockReset().mockResolvedValue(admin)
  vi.mocked(createAdminClient).mockReset()
})

describe('POST /api/imports/preview', () => {
  it('returns the auth response as-is for non-admins', async () => {
    vi.mocked(requireAdminApi).mockResolvedValue(NextResponse.json({ error: 'Sign in required' }, { status: 401 }))
    const res = await preview(form({ kind: 'ar_aging', file: csvFile() }))
    expect(res.status).toBe(401)
  })

  it('returns real headers, preview rows, and a suggested mapping', async () => {
    const res = await preview(form({ kind: 'ar_aging', file: csvFile() }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.headers).toEqual(['Assoc ID', 'Current', 'Over 90', 'Total Due'])
    expect(body.header_row_number).toBe(3)
    expect(body.rows).toHaveLength(2)
    expect(body.total_rows).toBe(2)
    expect(body.suggested_as_of).toBe('2026-09-30')
    expect(body.mapping).toMatchObject({ association: 'Assoc ID', current_due: 'Current', days_90_plus: 'Over 90', total: 'Total Due' })
  })

  it('rejects an unknown kind', async () => {
    const res = await preview(form({ kind: 'owners', file: csvFile() }))
    expect(res.status).toBe(400)
  })

  it('rejects files over 15 MB with a clear message', async () => {
    const big = new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'big.csv')
    const res = await preview(form({ kind: 'communities', file: big }))
    expect(res.status).toBe(413)
    expect((await res.json()).error).toMatch(/15 MB/)
  })

  it('explains unsupported files', async () => {
    const res = await preview(form({ kind: 'communities', file: csvFile('x', 'old.xls') }))
    expect(res.status).toBe(422)
    expect((await res.json()).error).toMatch(/\.xlsx/)
  })
})

describe('POST /api/imports/commit', () => {
  it('reports mapping problems without touching the database', async () => {
    const res = await commit(form({ kind: 'ar_aging', file: csvFile(), mapping: JSON.stringify({ association: 'Assoc ID' }) }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.problems).toContain('As-of date: choose a column or set one date for the whole file.')
  })

  it('rejects a malformed mapping', async () => {
    const res = await commit(form({ kind: 'ar_aging', file: csvFile(), mapping: '{not json' }))
    expect(res.status).toBe(400)
  })

  it('dry-runs: skips the unmatched association and writes nothing', async () => {
    const upsert = vi.fn()
    const insert = vi.fn()
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({
        select: () => ({ order: () => ({ range: async () => ({ data: [{ id: 'c1', vantaca_id: 'OAK', name: 'Oak' }], error: null }) }) }),
        upsert,
        insert,
      }),
    } as never)
    const res = await commit(
      form({
        kind: 'ar_aging',
        file: csvFile(),
        mapping: JSON.stringify({ association: 'Assoc ID', current_due: 'Current', days_90_plus: 'Over 90', total: 'Total Due' }),
        as_of: '2026-09-30',
        dry_run: 'true',
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ dry_run: true, rows_total: 2, rows_imported: 1, rows_skipped: 1 })
    expect(body.skipped_reasons[0]).toEqual({ row: 5, reason: expect.stringMatching(/"NOPE" matches no community/) })
    expect(upsert).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/imports/communities/[id]', () => {
  const id = '6f1c2a0e-8b0f-4c55-9d5e-2a3b4c5d6e7f'
  const req = (body: unknown) =>
    new Request(`http://localhost/api/imports/communities/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  const ctx = (value = id) => ({ params: Promise.resolve({ id: value }) })

  function mockUpdate(result: { data: unknown; error: unknown }) {
    const update = vi.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle: async () => result }) }) }))
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update }) } as never)
    return update
  }

  it('sets is_test', async () => {
    const update = mockUpdate({ data: { id, is_test: true }, error: null })
    const res = await patchCommunity(req({ is_test: true }), ctx())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id, is_test: true })
    expect(update).toHaveBeenCalledWith({ is_test: true })
  })

  it('rejects other fields and non-boolean values', async () => {
    expect((await patchCommunity(req({ is_test: 'yes' }), ctx())).status).toBe(400)
    expect((await patchCommunity(req({ is_test: true, name: 'x' }), ctx())).status).toBe(400)
  })

  it('404s for a malformed or unknown id', async () => {
    expect((await patchCommunity(req({ is_test: true }), ctx('nope'))).status).toBe(404)
    mockUpdate({ data: null, error: null })
    expect((await patchCommunity(req({ is_test: true }), ctx())).status).toBe(404)
  })

  it('requires an admin', async () => {
    vi.mocked(requireAdminApi).mockResolvedValue(NextResponse.json({ error: 'no' }, { status: 403 }))
    expect((await patchCommunity(req({ is_test: true }), ctx())).status).toBe(403)
  })
})
