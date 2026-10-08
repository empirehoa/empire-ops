import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deal, community, item, snapshot } from '@/lib/intelligence/__tests__/fixtures'

// ── Mocks ───────────────────────────────────────────────────────────────────

const verify = vi.fn()
vi.mock('@/lib/auth/automation-secret', () => ({ verifyAutomationSecret: (...a: unknown[]) => verify(...a) }))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))

const startAgentRun = vi.fn()
const finishAgentRun = vi.fn()
vi.mock('@/lib/runs', () => ({
  startAgentRun: (...a: unknown[]) => startAgentRun(...a),
  finishAgentRun: (...a: unknown[]) => finishAgentRun(...a),
}))

const postAgentReport = vi.fn()
const postStatusMessage = vi.fn()
vi.mock('@/lib/services/discord-notify', () => ({
  postAgentReport: (...a: unknown[]) => postAgentReport(...a),
  postStatusMessage: (...a: unknown[]) => postStatusMessage(...a),
}))

const load = {
  countDeals: vi.fn(),
  loadDeals: vi.fn(),
  countActionItems: vi.fn(),
  loadActionItems: vi.fn(),
  loadCommunities: vi.fn(),
  loadArSnapshots: vi.fn(),
  loadCompanies: vi.fn(),
  loadQboConnections: vi.fn(),
  loadPnl: vi.fn(),
  loadLatestAgentRuns: vi.fn(),
}
vi.mock('@/lib/intelligence/load', () => load)

const sales = await import('@/app/api/automation/sales-intelligence/route')
const financial = await import('@/app/api/automation/financial-health/route')
const retention = await import('@/app/api/automation/client-retention/route')
const crossSell = await import('@/app/api/automation/cross-sell/route')
const benchmarks = await import('@/app/api/automation/competitive-intel/route')
const notion = await import('@/app/api/automation/sync-notion-daily/route')

const req = () => new Request('http://localhost/api/automation/x', { method: 'POST' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('DISCORD_WEBHOOK_URL', '')
  vi.stubEnv('NOTION_API_KEY', '')
  verify.mockReturnValue(true)
  startAgentRun.mockResolvedValue('run-1')
  finishAgentRun.mockResolvedValue(undefined)
  load.countDeals.mockResolvedValue(0)
  load.loadDeals.mockResolvedValue([])
  load.countActionItems.mockResolvedValue(0)
  load.loadActionItems.mockResolvedValue([])
  load.loadCommunities.mockResolvedValue([])
  load.loadArSnapshots.mockResolvedValue([])
  load.loadCompanies.mockResolvedValue([{ id: 'emg', slug: 'empire', name: 'Empire Management Group' }])
  load.loadQboConnections.mockResolvedValue([])
  load.loadPnl.mockResolvedValue([])
})

describe('agent wrapper', () => {
  it('rejects requests without the automation secret and records nothing', async () => {
    verify.mockReturnValue(false)
    const res = await sales.POST(req())
    expect(res.status).toBe(401)
    expect(startAgentRun).not.toHaveBeenCalled()
  })

  it('records a failed run and returns 500 when computing throws', async () => {
    load.countDeals.mockRejectedValue(new Error('db down'))
    const res = await sales.POST(req())
    expect(res.status).toBe(500)
    expect(finishAgentRun).toHaveBeenCalledWith({}, 'run-1', { status: 'failed', error: 'db down' })
  })

  it('posts to Discord only when DISCORD_WEBHOOK_URL is set', async () => {
    await sales.POST(req())
    expect(postStatusMessage).not.toHaveBeenCalled()
    vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/x/y')
    await sales.POST(req())
    expect(postStatusMessage).toHaveBeenCalledWith('Sales intelligence: skipped', expect.stringContaining('HubSpot'), 'warning')
  })
})

describe('skips name the source to connect', () => {
  it.each([
    ['sales-intelligence', sales, /HubSpot/],
    ['financial-health', financial, /AR aging.*QuickBooks/],
    ['client-retention', retention, /community list/],
    ['cross-sell', crossSell, /action item/],
    ['competitive-intel', benchmarks, /door count and a monthly management fee/],
    ['sync-notion-daily', notion, /NOTION_API_KEY/],
  ])('%s', async (_name, mod, pattern) => {
    const res = await mod.POST(req())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('skipped')
    expect(body.headline).toMatch(pattern)
    expect(finishAgentRun).toHaveBeenCalledWith({}, 'run-1', expect.objectContaining({ status: 'skipped' }))
  })
})

describe('agents compute from stored data', () => {
  it('sales-intelligence reports pipeline and win rate', async () => {
    load.countDeals.mockResolvedValue(2)
    load.loadDeals.mockResolvedValue([
      deal({ id: 'a', amount: 40000, stage_probability: 0.5 }),
      deal({ id: 'b', is_closed: true, is_won: true, amount: 10000, close_date: new Date().toISOString().slice(0, 10) }),
    ])
    const body = await (await sales.POST(req())).json()
    expect(body.status).toBe('succeeded')
    expect(body.metrics).toMatchObject({ open_deals: 1, open_value: 40000, weighted_value: 20000, win_rate_by_count: 1 })
    expect(body.headline).toContain('$40,000')
  })

  it('financial-health names companies without QuickBooks data instead of estimating', async () => {
    load.loadCommunities.mockResolvedValue([community({ id: 'c1' })])
    load.loadArSnapshots.mockResolvedValue([snapshot({ community_id: 'c1', total: 1000, days_90_plus: 250 })])
    const body = await (await financial.POST(req())).json()
    expect(body.status).toBe('succeeded')
    expect(body.metrics.ar_total).toBe(1000)
    expect(body.headline).toContain('No QuickBooks P&L for Empire Management Group (not connected)')
  })

  it('cross-sell matches action items to sister companies', async () => {
    load.countActionItems.mockResolvedValue(1)
    load.loadCommunities.mockResolvedValue([community({ id: 'c1' })])
    load.loadActionItems.mockResolvedValue([item({ xn: '1', community_id: 'c1', item_type: 'Roof leak', opened_on: null })])
    const body = await (await crossSell.POST(req())).json()
    expect(body.metrics).toMatchObject({ total_matches: 1, wfw_matches: 1 })
  })

  it('competitive-intel labels the benchmark as internal data', async () => {
    load.loadCommunities.mockResolvedValue([community({ id: 'c1', doors: 100, monthly_management_fee: 1500 })])
    const body = await (await benchmarks.POST(req())).json()
    expect(body.headline).toContain('EMG data only, no market comparison')
    expect(body.metrics.weighted_fee_per_door).toBe(15)
  })
})
