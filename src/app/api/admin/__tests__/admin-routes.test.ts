import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { community, item } from '@/lib/intelligence/__tests__/fixtures'

const requireAdminApi = vi.fn()
vi.mock('@/lib/auth/admin', () => ({ requireAdminApi: () => requireAdminApi() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))

const load = {
  countActionItems: vi.fn(),
  loadActionItems: vi.fn(),
  loadCommunities: vi.fn(),
  loadLatestAgentRuns: vi.fn(),
}
vi.mock('@/lib/intelligence/load', () => load)

const loadIntegrationStatus = vi.fn()
vi.mock('@/lib/intelligence/integration-status', () => ({ loadIntegrationStatus: () => loadIntegrationStatus() }))

const buildIntelligenceSnapshot = vi.fn()
vi.mock('@/lib/intelligence/snapshot', () => ({ buildIntelligenceSnapshot: () => buildIntelligenceSnapshot() }))

const intelligence = await import('@/app/api/admin/intelligence/route')
const crossSell = await import('@/app/api/admin/intelligence/cross-sell/route')
const pricing = await import('@/app/api/admin/intelligence/pricing/route')
const agentStatus = await import('@/app/api/admin/agent-status/route')
const integrationHealth = await import('@/app/api/admin/integration-health/route')

const routes = { intelligence, crossSell, pricing, agentStatus, integrationHealth }

beforeEach(() => {
  vi.clearAllMocks()
  requireAdminApi.mockResolvedValue({ id: 'u1', email: 'admin@example.com' })
  load.countActionItems.mockResolvedValue(0)
  load.loadActionItems.mockResolvedValue([])
  load.loadCommunities.mockResolvedValue([])
  load.loadLatestAgentRuns.mockResolvedValue([])
})

describe('admin routes require an admin', () => {
  it.each(Object.entries(routes))('%s returns the auth response as-is', async (_name, mod) => {
    requireAdminApi.mockResolvedValue(NextResponse.json({ error: 'Sign in required' }, { status: 401 }))
    const res = await mod.GET()
    expect(res.status).toBe(401)
    expect(buildIntelligenceSnapshot).not.toHaveBeenCalled()
    expect(load.loadCommunities).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/intelligence', () => {
  it('returns the snapshot', async () => {
    buildIntelligenceSnapshot.mockResolvedValue({ generatedAt: 'x', pipeline: null })
    expect(await (await intelligence.GET()).json()).toEqual({ generatedAt: 'x', pipeline: null })
  })

  it('returns 500 with the error message when loading fails', async () => {
    buildIntelligenceSnapshot.mockRejectedValue(new Error('db down'))
    const res = await intelligence.GET()
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('db down')
  })
})

describe('GET /api/admin/intelligence/cross-sell', () => {
  it('says which source to import when there are no action items', async () => {
    const body = await (await crossSell.GET()).json()
    expect(body.available).toBe(false)
    expect(body.reason).toContain('/admin/imports')
  })

  it('returns matches when data exists', async () => {
    load.countActionItems.mockResolvedValue(1)
    load.loadCommunities.mockResolvedValue([community({ id: 'c1' })])
    load.loadActionItems.mockResolvedValue([item({ xn: '1', community_id: 'c1', category: 'Resale', item_type: 'Estoppel' })])
    const body = await (await crossSell.GET()).json()
    expect(body.available).toBe(true)
    expect(body.totalMatches).toBe(1)
  })
})

describe('GET /api/admin/intelligence/pricing', () => {
  it('labels results as internal data', async () => {
    load.loadCommunities.mockResolvedValue([community({ id: 'c1', doors: 200, monthly_management_fee: 3000 })])
    const body = await (await pricing.GET()).json()
    expect(body.available).toBe(true)
    expect(body.weightedFeePerDoor).toBe(15)
    expect(body.label).toContain('Internal data only')
  })

  it('explains what to import when no fees are available', async () => {
    const body = await (await pricing.GET()).json()
    expect(body.available).toBe(false)
    expect(body.reason).toContain('monthly management fee')
  })
})

describe('GET /api/admin/agent-status', () => {
  it('lists every scheduled agent with its latest run or never_run', async () => {
    load.loadLatestAgentRuns.mockResolvedValue([
      {
        id: 'r1',
        agent: 'cross-sell',
        status: 'succeeded',
        started_at: '2026-10-08T06:00:00Z',
        finished_at: '2026-10-08T06:00:02Z',
        headline: '3 signals',
        metrics: null,
        error: null,
      },
      { id: 'r2', agent: 'legacy-agent', status: 'failed', started_at: '2026-10-01T06:00:00Z', finished_at: null, headline: null, metrics: null, error: 'x' },
    ])
    const body = await (await agentStatus.GET()).json()
    expect(body.agents).toHaveLength(7)
    const cs = body.agents.find((a: { key: string }) => a.key === 'cross-sell')
    expect(cs).toMatchObject({ status: 'succeeded', headline: '3 signals', duration_ms: 2000 })
    expect(body.agents.find((a: { key: string }) => a.key === 'sales-intelligence').status).toBe('never_run')
    expect(body.agents[6].key).toBe('legacy-agent')
  })
})

describe('GET /api/admin/integration-health', () => {
  it('returns the integration status', async () => {
    loadIntegrationStatus.mockResolvedValue({ hubspot: { tokenConfigured: false } })
    expect(await (await integrationHealth.GET()).json()).toEqual({ hubspot: { tokenConfigured: false } })
  })
})
