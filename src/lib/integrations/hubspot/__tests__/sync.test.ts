import { describe, expect, it, vi } from 'vitest'
import { HubSpotClient } from '../client'
import { syncHubSpotDeals } from '../sync'
import { createFakeDb, syncRunsHandler, type Op } from '../../quickbooks/__tests__/fake-db'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function hubspotFetch(status = 200) {
  return vi.fn(async (url: string) => {
    if (status !== 200) return new Response('{}', { status })
    const path = new URL(url).pathname
    if (path === '/crm/v3/pipelines/deals') {
      return json({ results: [{ id: 'p1', label: 'Contracts', stages: [{ id: '1879956205', label: 'Proposal Sent', metadata: { isClosed: 'false' } }] }] })
    }
    if (path === '/crm/v3/owners') return json({ results: [{ id: '111', firstName: 'Dana', lastName: 'Reyes' }] })
    if (path === '/crm/v3/objects/deals') {
      return json({
        results: [
          { id: '1', properties: { dealname: 'A', pipeline: 'p1', dealstage: '1879956205', hubspot_owner_id: '111', hs_is_closed: 'false', amount: '1000' } },
          { id: '2', properties: { dealname: 'B', pipeline: 'p1', dealstage: '1879956205', hs_is_closed: 'true', hs_is_closed_won: 'true' } },
        ],
      })
    }
    return new Response('{}', { status: 404 })
  })
}

describe('syncHubSpotDeals', () => {
  it('upserts deals on hubspot_id, purges stale rows and records a succeeded run', async () => {
    const { db, ops } = createFakeDb((op: Op) => {
      if (op.table === 'crm_deals' && op.action === 'delete') return { data: [{ id: 'stale' }] }
      return syncRunsHandler(op)
    })
    const client = new HubSpotClient({ accessToken: 't', fetchImpl: hubspotFetch(), sleep: async () => {} })
    const now = new Date('2026-10-08T06:00:00.000Z')

    const result = await syncHubSpotDeals(db, { client, now: () => now })

    expect(result).toMatchObject({ rows: 2, removed: 1, pipelines: 1, owners: 2 })

    const runInsert = ops.find((o) => o.table === 'sync_runs' && o.action === 'insert')
    expect(runInsert?.payload).toEqual({ source: 'hubspot', company_id: null })

    const upsert = ops.find((o) => o.table === 'crm_deals' && o.action === 'upsert')!
    expect(upsert.options).toEqual({ onConflict: 'hubspot_id' })
    const rows = upsert.payload as Record<string, unknown>[]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ hubspot_id: '1', stage_label: 'Proposal Sent', owner_name: 'Dana Reyes', amount: 1000, is_closed: false })
    expect(rows[1]).toMatchObject({ hubspot_id: '2', is_closed: true, is_won: true })

    const purge = ops.find((o) => o.table === 'crm_deals' && o.action === 'delete')!
    expect(purge.filters).toContainEqual(['lt', 'synced_at', now.toISOString()])

    const finish = ops.find((o) => o.table === 'sync_runs' && o.action === 'update')!
    expect(finish.payload).toMatchObject({ status: 'succeeded', rows_written: 2, error: null })
  })

  it('records a failed run and rethrows when HubSpot rejects the token', async () => {
    const { db, ops } = createFakeDb(syncRunsHandler)
    const client = new HubSpotClient({ accessToken: 't', fetchImpl: hubspotFetch(401), sleep: async () => {} })

    await expect(syncHubSpotDeals(db, { client })).rejects.toThrow(/missing scopes/)

    expect(ops.some((o) => o.table === 'crm_deals')).toBe(false)
    const finish = ops.find((o) => o.table === 'sync_runs' && o.action === 'update')!
    expect(finish.payload).toMatchObject({ status: 'failed' })
    expect((finish.payload as { error: string }).error).toMatch(/crm\.objects\.deals\.read/)
  })

  it('never purges when HubSpot returns no deals', async () => {
    const { db, ops } = createFakeDb(syncRunsHandler)
    const fetchImpl = vi.fn(async (url: string) =>
      json(new URL(url).pathname === '/crm/v3/pipelines/deals' ? { results: [] } : { results: [] }),
    )
    const client = new HubSpotClient({ accessToken: 't', fetchImpl, sleep: async () => {} })
    const result = await syncHubSpotDeals(db, { client })
    expect(result.rows).toBe(0)
    expect(ops.some((o) => o.table === 'crm_deals' && o.action === 'delete')).toBe(false)
  })
})
