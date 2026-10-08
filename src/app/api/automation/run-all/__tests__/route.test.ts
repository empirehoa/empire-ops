import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock verifyAutomationSecret ─────────────────────────────────────────────

const mockVerifyAutomationSecret = vi.fn()

vi.mock('@/lib/auth/automation-secret', () => ({
  verifyAutomationSecret: (...args: unknown[]) => mockVerifyAutomationSecret(...args),
}))

// ── Mock global fetch (sync call, agent calls, Discord) ─────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { POST } = await import('@/app/api/automation/run-all/route')

// ── Helpers ─────────────────────────────────────────────────────────────────

const AGENT_PATHS = [
  'sales-intelligence',
  'financial-health',
  'client-retention',
  'cross-sell',
  'competitive-intel',
  'sync-notion-daily',
]
const TOTAL_JOBS = AGENT_PATHS.length

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/automation/run-all', {
    method: 'POST',
    headers: new Headers(headers),
  }) as never
}

type Reply = { ok: boolean; body: unknown }

function makeFetchReturns(overrides: Partial<Record<string, Reply>> = {}) {
  const defaults: Record<string, Reply> = {
    'sync/run': { ok: true, body: { hubspot: { rows: 3 } } },
    ...Object.fromEntries(
      AGENT_PATHS.map((p) => [p, { ok: true, body: { agent: p, status: 'succeeded', headline: `${p} ok` } }]),
    ),
  }
  const merged = { ...defaults, ...overrides }

  return (url: string) => {
    if (url.includes('discord.com')) return Promise.resolve(new Response('ok', { status: 200 }))
    const key = url.includes('/api/sync/run') ? 'sync/run' : AGENT_PATHS.find((p) => url.endsWith(`/api/automation/${p}`))
    const reply = key ? merged[key] : undefined
    if (!reply) return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }))
    return Promise.resolve(
      new Response(JSON.stringify(reply.body), {
        status: reply.ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }
}

function calledUrls(): string[] {
  return mockFetch.mock.calls.map((c: unknown[]) => String(c[0]))
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/automation/run-all', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AUTOMATION_SECRET', 'test-automation-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('DISCORD_WEBHOOK_URL', '')
    vi.stubEnv('DISCORD_AUTOMATION_WEBHOOK_URL', '')
    mockVerifyAutomationSecret.mockReturnValue(true)
    mockFetch.mockImplementation(makeFetchReturns())
  })

  describe('authentication', () => {
    it('returns 401 when the automation secret is invalid', async () => {
      mockVerifyAutomationSecret.mockReturnValue(false)
      const response = await POST(makeRequest())
      expect(response.status).toBe(401)
      expect((await response.json()).error).toBe('Unauthorized')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns 500 when AUTOMATION_SECRET is not set', async () => {
      vi.stubEnv('AUTOMATION_SECRET', '')
      const response = await POST(makeRequest())
      expect(response.status).toBe(500)
      expect((await response.json()).error).toContain('AUTOMATION_SECRET')
    })
  })

  describe('orchestration', () => {
    it('runs the data sync first, then all six agents', async () => {
      const response = await POST(makeRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.jobs_run).toBe(TOTAL_JOBS)
      expect(body.jobs_failed).toBe(0)
      expect(body.failures).toBeUndefined()
      expect(body.sync.status).toBe('succeeded')

      const urls = calledUrls()
      expect(urls[0]).toBe('http://localhost:3000/api/sync/run')
      for (const p of AGENT_PATHS) {
        expect(urls).toContain(`http://localhost:3000/api/automation/${p}`)
        expect(body.results[p.replace(/-/g, '_')]).toBeDefined()
      }
      expect(urls.filter((u) => u.includes('/api/sync/run'))).toHaveLength(1)
    })

    it('waits for the sync to finish before starting agents', async () => {
      const order: string[] = []
      let releaseSync: () => void = () => {}
      mockFetch.mockImplementation((url: string) => {
        order.push(url.includes('/api/sync/run') ? 'sync-start' : 'agent')
        if (url.includes('/api/sync/run')) {
          return new Promise<Response>((resolve) => {
            releaseSync = () => {
              order.push('sync-end')
              resolve(new Response('{}', { status: 200 }))
            }
          })
        }
        return makeFetchReturns()(url)
      })
      const pending = POST(makeRequest())
      await new Promise((r) => setTimeout(r, 10))
      expect(order).toEqual(['sync-start'])
      releaseSync()
      await pending
      expect(order.slice(0, 2)).toEqual(['sync-start', 'sync-end'])
      expect(order.filter((o) => o === 'agent')).toHaveLength(TOTAL_JOBS)
    })

    it('forwards the automation secret to the sync and every agent', async () => {
      await POST(makeRequest())
      const internal = mockFetch.mock.calls.filter((c: unknown[]) => !String(c[0]).includes('discord.com'))
      expect(internal).toHaveLength(TOTAL_JOBS + 1)
      for (const [, init] of internal) {
        expect((init as RequestInit & { headers: Record<string, string> }).headers['x-automation-secret']).toBe(
          'test-automation-secret',
        )
      }
    })

    it('uses NEXT_PUBLIC_APP_URL as the base URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ops.example.com')
      await POST(makeRequest())
      for (const url of calledUrls()) expect(url.startsWith('https://ops.example.com/')).toBe(true)
    })
  })

  describe('failure handling', () => {
    it('still runs agents when the sync fails, and reports it', async () => {
      mockFetch.mockImplementation(makeFetchReturns({ 'sync/run': { ok: false, body: { error: 'HubSpot 401' } } }))
      const body = await (await POST(makeRequest())).json()
      expect(body.sync.status).toBe('failed')
      expect(body.jobs_failed).toBe(0)
      expect(calledUrls().filter((u) => u.includes('/api/automation/'))).toHaveLength(TOTAL_JOBS)
    })

    it('reports failed agents without stopping the others', async () => {
      mockFetch.mockImplementation(
        makeFetchReturns({
          'sales-intelligence': { ok: false, body: { status: 'failed', error: 'DB connection failed' } },
          'financial-health': { ok: false, body: { error: 'timeout' } },
        }),
      )
      const response = await POST(makeRequest())
      const body = await response.json()
      expect(response.status).toBe(200)
      expect(body.failures).toEqual(['sales-intelligence', 'financial-health'])
      expect(body.jobs_failed).toBe(2)
      expect(body.results.client_retention.status).toBe('succeeded')
    })

    it('counts skipped agents separately from failures', async () => {
      mockFetch.mockImplementation(
        makeFetchReturns({ 'cross-sell': { ok: true, body: { status: 'skipped', headline: 'Skipped: no action items' } } }),
      )
      const body = await (await POST(makeRequest())).json()
      expect(body.jobs_skipped).toBe(1)
      expect(body.jobs_failed).toBe(0)
    })

    it('handles network errors on an agent call', async () => {
      mockFetch.mockImplementation((url: string) =>
        url.includes('/api/automation/cross-sell') ? Promise.reject(new Error('ECONNREFUSED')) : makeFetchReturns()(url),
      )
      const body = await (await POST(makeRequest())).json()
      expect(body.failures).toEqual(['cross-sell'])
      expect(body.results.cross_sell.error).toBe('ECONNREFUSED')
    })
  })

  describe('discord summary', () => {
    const discordCalls = () => mockFetch.mock.calls.filter((c: unknown[]) => String(c[0]).includes('discord.com'))

    it('posts exactly one summary when DISCORD_WEBHOOK_URL is set', async () => {
      vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/test/test')
      await POST(makeRequest())
      expect(discordCalls()).toHaveLength(1)
      const payload = JSON.parse(String((discordCalls()[0][1] as RequestInit).body))
      expect(payload.embeds[0].title).toBe('Empire Ops daily run complete')
      expect(payload.embeds[0].description).toContain('Data sync')
    })

    it('does not post when DISCORD_WEBHOOK_URL is missing', async () => {
      await POST(makeRequest())
      expect(discordCalls()).toHaveLength(0)
    })

    it('does not fail the run when Discord is unreachable', async () => {
      vi.stubEnv('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/test/test')
      mockFetch.mockImplementation((url: string) =>
        url.includes('discord.com') ? Promise.reject(new Error('Discord unreachable')) : makeFetchReturns()(url),
      )
      const response = await POST(makeRequest())
      expect(response.status).toBe(200)
    })
  })
})
