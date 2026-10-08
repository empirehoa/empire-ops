import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { AdminClient } from '@/lib/supabase/admin'
import { runAllSyncs, type SyncSources } from '../run-syncs'

const db = {} as AdminClient

function sources(overrides: Partial<{ [K in keyof SyncSources]: Partial<SyncSources[K]> }> = {}): SyncSources {
  return {
    hubspot: { configured: () => null, run: vi.fn(async () => ({ rows: 3 })), ...overrides.hubspot },
    quickbooks: {
      configured: () => null,
      run: vi.fn(async () => ({ companies: 1, reports: 15, skipped: [], failed: [] })),
      ...overrides.quickbooks,
    },
  }
}

describe('runAllSyncs', () => {
  it('runs HubSpot then QuickBooks and reports both', async () => {
    const order: string[] = []
    const s = sources({
      hubspot: { run: async () => (order.push('hubspot'), { rows: 3 }) },
      quickbooks: { run: async () => (order.push('quickbooks'), { reports: 15 }) },
    })
    const out = await runAllSyncs(db, s)
    expect(order).toEqual(['hubspot', 'quickbooks'])
    expect(out.hubspot).toMatchObject({ status: 'succeeded', result: { rows: 3 } })
    expect(out.quickbooks).toMatchObject({ status: 'succeeded', result: { reports: 15 } })
  })

  it('still runs QuickBooks when HubSpot fails', async () => {
    const qbRun = vi.fn(async () => ({ reports: 15 }))
    const out = await runAllSyncs(
      db,
      sources({ hubspot: { run: async () => Promise.reject(new Error('HubSpot token invalid')) }, quickbooks: { run: qbRun } }),
    )
    expect(out.hubspot).toMatchObject({ status: 'failed', error: 'HubSpot token invalid' })
    expect(qbRun).toHaveBeenCalledTimes(1)
    expect(out.quickbooks.status).toBe('succeeded')
  })

  it('skips an unconfigured source cleanly with its reason', async () => {
    const hsRun = vi.fn()
    const out = await runAllSyncs(
      db,
      sources({ hubspot: { configured: () => 'HUBSPOT_ACCESS_TOKEN is not set', run: hsRun } }),
    )
    expect(out.hubspot).toEqual({ status: 'skipped', reason: 'HUBSPOT_ACCESS_TOKEN is not set' })
    expect(hsRun).not.toHaveBeenCalled()
    expect(out.quickbooks.status).toBe('succeeded')
  })

  it('keeps partial QuickBooks detail on failure', async () => {
    const partial = { companies: 1, reports: 29, skipped: [], failed: [{ company: 'wfw', error: 'x' }] }
    const out = await runAllSyncs(
      db,
      sources({ quickbooks: { run: async () => Promise.reject(Object.assign(new Error('wfw: x'), { result: partial })) } }),
    )
    expect(out.quickbooks).toMatchObject({ status: 'failed', error: 'wfw: x', result: partial })
  })
})

describe('POST /api/sync/run', () => {
  it('rejects requests without the automation secret', async () => {
    const prev = process.env.AUTOMATION_SECRET
    process.env.AUTOMATION_SECRET = 'test-automation-secret'
    try {
      const { POST } = await import('../route')
      const res = await POST(new NextRequest('http://localhost/api/sync/run', { method: 'POST' }))
      expect(res.status).toBe(401)
      const wrong = await POST(
        new NextRequest('http://localhost/api/sync/run', { method: 'POST', headers: { 'x-automation-secret': 'nope' } }),
      )
      expect(wrong.status).toBe(401)
    } finally {
      if (prev === undefined) delete process.env.AUTOMATION_SECRET
      else process.env.AUTOMATION_SECRET = prev
    }
  })
})
