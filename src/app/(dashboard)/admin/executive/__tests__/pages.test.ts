// Server-render smoke test for the admin pages: real snapshot code over fixture
// rows, with the database loaders mocked. Catches runtime errors and checks the
// empty states name the source to connect and no hardcoded figures appear.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { community, deal, item, snapshot } from '@/lib/intelligence/__tests__/fixtures'
import type { SyncRunInput } from '@/lib/intelligence/sources'

vi.mock('@/lib/auth/admin', () => ({ requireAdminPage: async () => ({ id: 'u', email: 'a@example.com' }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: () => undefined }),
  usePathname: () => '/admin/executive',
  redirect: () => undefined,
}))

const companies = [
  { id: 'emg', slug: 'empire', name: 'Empire Management Group' },
  { id: 'rr', slug: 'riance-realty', name: 'Riance Realty' },
  { id: 'wfw', slug: 'wfw', name: 'Wind Fire & Water' },
  { id: 'fixiq', slug: 'fixiq', name: 'FixIQ' },
]

const load = {
  loadCommunities: vi.fn(),
  loadArSnapshots: vi.fn(),
  loadActionItems: vi.fn(),
  countActionItems: vi.fn(),
  loadDeals: vi.fn(),
  countDeals: vi.fn(),
  loadCompanies: vi.fn(async () => companies),
  loadQboConnections: vi.fn(),
  loadPnl: vi.fn(),
  loadRecentSyncRuns: vi.fn(),
  loadLatestAgentRuns: vi.fn(),
}
vi.mock('@/lib/intelligence/load', () => load)

const executive = await import('../page')
const growth = await import('../growth/page')
const integrations = await import('../../integrations/page')

function emptyData() {
  load.loadCommunities.mockResolvedValue([])
  load.loadArSnapshots.mockResolvedValue([])
  load.loadActionItems.mockResolvedValue([])
  load.countActionItems.mockResolvedValue(0)
  load.loadDeals.mockResolvedValue([])
  load.countDeals.mockResolvedValue(0)
  load.loadQboConnections.mockResolvedValue([])
  load.loadPnl.mockResolvedValue([])
  load.loadRecentSyncRuns.mockResolvedValue([])
  load.loadLatestAgentRuns.mockResolvedValue([])
}

function fullData() {
  const now = new Date()
  const ym = (offset: number) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    const m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    return { start: `${m}-01`, end: `${m}-${last}` }
  }
  load.loadCommunities.mockResolvedValue([
    community({ id: 'c1', name: 'Oak Hollow', doors: 120, monthly_management_fee: 1800 }),
    community({ id: 'c2', name: 'Bay Pointe', doors: 400, monthly_management_fee: 5000, manager_name: 'Lee' }),
  ])
  load.loadArSnapshots.mockResolvedValue([
    snapshot({ community_id: 'c1', total: 20000, current_due: 10000, days_30: 4000, days_60: 2000, days_90_plus: 4000 }),
    snapshot({ community_id: 'c2', total: 5000, current_due: 5000 }),
  ])
  load.loadActionItems.mockResolvedValue([
    item({ xn: 'XN1', community_id: 'c1', category: 'Work Order', item_type: 'Roof leak', opened_on: '2026-01-01' }),
    item({ xn: 'XN2', community_id: 'c2', category: 'Resale', item_type: 'Estoppel' }),
  ])
  load.countActionItems.mockResolvedValue(2)
  load.loadDeals.mockResolvedValue([deal({ id: 'd1', updated_at_source: '2026-01-01T00:00:00Z' }), deal({ id: 'd2' })])
  load.countDeals.mockResolvedValue(2)
  load.loadQboConnections.mockResolvedValue([
    { company_id: 'emg', realm_id: 'r', updated_at: '2026-09-01T00:00:00Z', refresh_expires_at: null, connected_by: 'jr@example.com' },
    { company_id: 'rr', realm_id: 'r2', updated_at: '2026-09-01T00:00:00Z', refresh_expires_at: null, connected_by: null },
  ])
  load.loadPnl.mockResolvedValue(
    [1, 2, 3].map((o) => ({
      company_id: 'emg',
      report_type: 'profit_and_loss',
      period_start: ym(o).start,
      period_end: ym(o).end,
      total_income: 600000 + o,
      total_expenses: 550000,
      net_income: 50000 + o,
      fetched_at: '2026-10-01T00:00:00Z',
    })),
  )
  const run = (source: string, status: SyncRunInput['status'], company_id: string | null = null): SyncRunInput => ({
    source,
    company_id,
    status,
    started_at: '2026-10-08T06:00:00Z',
    finished_at: '2026-10-08T06:01:00Z',
    rows_written: 10,
    error: status === 'failed' ? 'Token expired' : null,
  })
  load.loadRecentSyncRuns.mockResolvedValue([
    run('hubspot', 'succeeded'),
    run('quickbooks', 'succeeded', 'emg'),
    run('quickbooks', 'failed', 'rr'),
    run('vantaca:ar_aging', 'succeeded'),
  ])
  load.loadLatestAgentRuns.mockResolvedValue([
    { id: 'r1', agent: 'cross-sell', status: 'succeeded', started_at: '2026-10-08T06:02:00Z', finished_at: null, headline: '2 cross-sell signals', metrics: null, error: null },
  ])
}

async function html(mod: { default: () => Promise<React.ReactElement> }) {
  return renderToString(await mod.default())
}

const FORBIDDEN = ['—', '7,710,000', '28,391', 'TODO']

describe('admin pages render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('HUBSPOT_ACCESS_TOKEN', '')
    vi.stubEnv('QUICKBOOKS_CLIENT_ID', 'id')
    vi.stubEnv('QUICKBOOKS_CLIENT_SECRET', 'secret')
    vi.stubEnv('QUICKBOOKS_REDIRECT_URI', 'https://x/cb')
  })

  it('executive page with no data names the source to connect', async () => {
    emptyData()
    const out = await html(executive)
    expect(out).toContain('QuickBooks not connected')
    expect(out).toContain('/admin/integrations')
    expect(out).toContain('No HubSpot deals yet')
    expect(out).toContain('No Vantaca AR aging imported yet')
    expect(out).toContain('No Vantaca community list imported yet')
    for (const f of FORBIDDEN) expect(out).not.toContain(f)
  })

  it('executive page with data shows QuickBooks figures only for connected companies', async () => {
    fullData()
    const out = await html(executive)
    expect(out).toContain('Empire Management Group')
    expect(out).toContain('$1,800,006')
    expect(out).toContain('QuickBooks is connected but no monthly P&amp;L has been synced')
    expect(out).toContain('Oak Hollow')
    expect(out).toContain('2 cross-sell signals')
    for (const f of FORBIDDEN) expect(out).not.toContain(f)
  })

  it('growth page renders with and without data', async () => {
    emptyData()
    const empty = await html(growth)
    expect(empty).toContain('Import the Vantaca community list')
    fullData()
    const full = await html(growth)
    expect(full).toContain('Internal data only')
    expect(full).toContain('Wind Fire &amp; Water')
    expect(full).toContain('Bay Pointe')
    for (const f of FORBIDDEN) expect(full).not.toContain(f)
  })

  it('integrations page shows connect links and sync errors', async () => {
    fullData()
    const out = await html(integrations)
    expect(out).toContain('/api/integrations/quickbooks/connect?company=wfw')
    expect(out).toContain('Token expired')
    expect(out).toContain('Set HUBSPOT_ACCESS_TOKEN in the deployment environment first.')
    expect(out).toContain('/admin/imports')
    for (const f of FORBIDDEN) expect(out).not.toContain(f)
  })
})
