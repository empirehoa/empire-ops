// Minimal recording fake of the Supabase query builder for sync tests.
// Each awaited query becomes an `Op`; a handler decides what it returns.

import type { AdminClient } from '@/lib/supabase/admin'

export type Filter = [op: string, column: string, value: unknown]

export type Op = {
  table: string
  action: 'select' | 'insert' | 'update' | 'upsert' | 'delete'
  payload?: unknown
  options?: unknown
  columns?: string
  filters: Filter[]
  returning: boolean
  single: boolean
}

export type OpResult = { data?: unknown; error?: { message: string } | null }

export function createFakeDb(handler: (op: Op) => OpResult | void = () => undefined) {
  const ops: Op[] = []

  function builder(table: string) {
    const op: Op = { table, action: 'select', filters: [], returning: false, single: false }
    let actionSet = false
    const setAction = (action: Op['action'], payload?: unknown, options?: unknown) => {
      op.action = action
      op.payload = payload
      op.options = options
      actionSet = true
      return chain
    }
    const filter = (name: string) => (column: string, value: unknown) => {
      op.filters.push([name, column, value])
      return chain
    }
    const chain = {
      select(columns?: string) {
        if (actionSet) op.returning = true
        else actionSet = true
        op.columns = columns
        return chain
      },
      insert: (payload: unknown, options?: unknown) => setAction('insert', payload, options),
      update: (payload: unknown, options?: unknown) => setAction('update', payload, options),
      upsert: (payload: unknown, options?: unknown) => setAction('upsert', payload, options),
      delete: (options?: unknown) => setAction('delete', undefined, options),
      eq: filter('eq'),
      neq: filter('neq'),
      lt: filter('lt'),
      gt: filter('gt'),
      in: filter('in'),
      order: filter('order'),
      limit: (n: number) => filter('limit')('', n),
      single() {
        op.single = true
        return chain
      },
      maybeSingle() {
        op.single = true
        return chain
      },
      then<T>(resolve: (value: { data: unknown; error: { message: string } | null }) => T, reject?: (e: unknown) => T) {
        try {
          ops.push(op)
          const out = handler(op) ?? {}
          return Promise.resolve({ data: out.data ?? null, error: out.error ?? null }).then(resolve, reject)
        } catch (e) {
          return Promise.reject(e).then(undefined, reject)
        }
      },
    }
    return chain
  }

  const db = { from: (table: string) => builder(table) } as unknown as AdminClient
  return { db, ops }
}

/** Default answers for the run-recording helpers in src/lib/runs.ts. */
export function syncRunsHandler(op: Op): OpResult | undefined {
  if (op.table === 'sync_runs' && op.action === 'insert') return { data: { id: `run-${Math.random()}` } }
  return undefined
}
