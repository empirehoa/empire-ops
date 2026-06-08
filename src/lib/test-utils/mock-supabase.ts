/**
 * Shared Supabase mock factory for API route integration tests.
 *
 * Provides a chainable query builder mock that mirrors the real Supabase
 * PostgREST client behaviour. Every method returns `this` so `.from().select().eq().single()`
 * works out of the box.
 *
 * Import from '@/lib/test-utils/mock-supabase' in any test file.
 */

import { vi } from 'vitest'

type MockFn = ReturnType<typeof vi.fn>

export interface SupabaseQueryChain {
  select: MockFn
  insert: MockFn
  update: MockFn
  delete: MockFn
  upsert: MockFn
  eq: MockFn
  neq: MockFn
  gt: MockFn
  gte: MockFn
  lt: MockFn
  lte: MockFn
  in: MockFn
  is: MockFn
  like: MockFn
  ilike: MockFn
  order: MockFn
  limit: MockFn
  range: MockFn
  single: MockFn
  maybeSingle: MockFn
  match: MockFn
  not: MockFn
  or: MockFn
  filter: MockFn
  contains: MockFn
  containedBy: MockFn
  textSearch: MockFn
  csv: MockFn
  count: MockFn
}

export interface SupabaseMockKit {
  /** The mock `from(table)` function — register via vi.mock */
  mockFrom: MockFn
  /** Direct access to every chainable method */
  chain: SupabaseQueryChain
  /** Ordered log of `from(tableName)` calls for assertion */
  fromLog: string[]
  /** The last table name passed to `from()` */
  lastTable: string
  /** Reset all mocks and the call log — call in `beforeEach` */
  reset: () => void
}

/**
 * Build a fresh mock kit.
 *
 * The kit exposes the raw mock chain so tests can set resolved values:
 * ```ts
 * kit.chain.single.mockResolvedValueOnce({ data: { id: '1' }, error: null })
 * ```
 */
export function createSupabaseMockKit(): SupabaseMockKit {
  let fromLog: string[] = []
  let lastTable = ''

  const chain = buildChain()

  const mockFrom = vi.fn((table: string) => {
    lastTable = table
    fromLog.push(table)
    return chain
  })

  function buildChain(): SupabaseQueryChain {
    const c: SupabaseQueryChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      csv: vi.fn().mockReturnThis(),
      count: vi.fn().mockReturnThis(),
    }
    return c
  }

  function reset() {
    fromLog.length = 0
    lastTable = ''
    for (const key of Object.keys(chain) as (keyof SupabaseQueryChain)[]) {
      chain[key].mockReset()
      if (key === 'single' || key === 'maybeSingle') {
        chain[key].mockResolvedValue({ data: null, error: null })
      } else {
        chain[key].mockReturnThis()
      }
    }
    mockFrom.mockReset()
    mockFrom.mockImplementation((table: string) => {
      lastTable = table
      fromLog.push(table)
      return chain
    })
  }

  return {
    mockFrom,
    chain,
    get fromLog() {
      return fromLog
    },
    get lastTable() {
      return lastTable
    },
    reset,
  }
}
