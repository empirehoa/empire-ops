import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock verifyAutomationSecret ─────────────────────────────────────────────

const mockVerifyAutomationSecret = vi.fn()

vi.mock('@/lib/auth/automation-secret', () => ({
  verifyAutomationSecret: (...args: unknown[]) => mockVerifyAutomationSecret(...args),
}))

// ── Mock global fetch (for internal callAutomation calls + Discord) ─────────

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

// ── Import AFTER mocks ─────────────────────────────────────────────────────

const { POST } = await import('@/app/api/automation/run-all/route')

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/automation/run-all', {
    method: 'POST',
    headers: new Headers(headers),
  }) as any
}

/**
 * Build a mock fetch implementation that resolves all 12 automation job calls
 * and optionally the Discord webhook call.
 *
 * The route runs 12 jobs in parallel:
 *   7 operational + 5 intelligence (sales, financial-health, retention, cross-sell, competitive-intel)
 */
const TOTAL_JOBS = 14

function makeFetchReturns(
  overrides: Partial<Record<string, { ok: boolean; body: unknown }>> = {}
) {
  const defaults: Record<string, { ok: boolean; body: unknown }> = {
    'post-assessments': { ok: true, body: { processed: 0 } },
    'late-fees': { ok: true, body: { late_fees_applied: 0 } },
    'payment-plans': { ok: true, body: { processed: 0 } },
    'collection-escalation': { ok: true, body: { processed: 0 } },
    'escalate-violations': { ok: true, body: { processed: 0 } },
    'generate-meeting-packets': { ok: true, body: { generated: 0 } },
    'generate-recurring-work-orders': { ok: true, body: { generated: 0 } },
    'sales-intelligence': { ok: true, body: { processed: 0 } },
    'financial-health': { ok: true, body: { processed: 0 } },
    'client-retention': { ok: true, body: { processed: 0 } },
    'cross-sell': { ok: true, body: { processed: 0 } },
    'competitive-intel': { ok: true, body: { processed: 0 } },
    'sync-notion-daily': { ok: true, body: { synced: true } },
    'deliver-managers-reports': { ok: true, body: { delivered: 0 } },
  }

  const merged = { ...defaults, ...overrides }

  return (url: string, _init?: RequestInit) => {
    // Discord webhook
    if (url.includes('discord.com')) {
      return Promise.resolve(new Response('ok', { status: 200 }))
    }

    // Match automation job paths
    for (const [path, result] of Object.entries(merged)) {
      if (url.includes(`/api/automation/${path}`)) {
        return Promise.resolve(
          new Response(JSON.stringify(result.body), {
            status: result.ok ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
    }

    // Fallback
    return Promise.resolve(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    )
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Automation Run All — POST /api/automation/run-all', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubEnv('AUTOMATION_SECRET', 'test-automation-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('DISCORD_AUTOMATION_WEBHOOK_URL', '')

    mockVerifyAutomationSecret.mockReturnValue(true)
    mockFetch.mockImplementation(makeFetchReturns())
  })

  // ── Auth ────────────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when automation secret is invalid', async () => {
      mockVerifyAutomationSecret.mockReturnValue(false)

      const response = await POST(makeRequest())

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 500 when AUTOMATION_SECRET env var is not set', async () => {
      vi.stubEnv('AUTOMATION_SECRET', '')
      delete process.env.AUTOMATION_SECRET

      const response = await POST(makeRequest())

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toContain('AUTOMATION_SECRET')
    })

    it('accepts requests with valid automation secret', async () => {
      mockVerifyAutomationSecret.mockReturnValue(true)

      const response = await POST(
        makeRequest({ 'x-automation-secret': 'test-automation-secret' })
      )

      expect(response.status).toBe(200)
    })
  })

  // ── Job orchestration ──────────────────────────────────────────────────

  describe('job orchestration', () => {
    it('runs all 12 automation jobs and returns results', async () => {
      const response = await POST(makeRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.jobs_run).toBe(TOTAL_JOBS)
      expect(body.jobs_failed).toBe(0)
      expect(body.failures).toBeUndefined()
      expect(body.elapsed_ms).toBeTypeOf('number')
      expect(body.run_at).toBeTruthy()

      // All result keys should be present — 7 operational + 5 intelligence
      expect(body.results.post_assessments).toBeDefined()
      expect(body.results.late_fees).toBeDefined()
      expect(body.results.payment_plans).toBeDefined()
      expect(body.results.collection_escalation).toBeDefined()
      expect(body.results.violation_escalation).toBeDefined()
      expect(body.results.meeting_packets).toBeDefined()
      expect(body.results.recurring_work_orders).toBeDefined()
      expect(body.results.sales_intelligence).toBeDefined()
      expect(body.results.financial_health).toBeDefined()
      expect(body.results.client_retention).toBeDefined()
      expect(body.results.cross_sell).toBeDefined()
      expect(body.results.competitive_intel).toBeDefined()
    })

    it('forwards automation secret header to each internal call', async () => {
      mockFetch.mockClear()

      await POST(makeRequest({ 'x-automation-secret': 'test-automation-secret' }))

      // Filter to only automation job calls (exclude Discord webhook)
      const automationCalls = mockFetch.mock.calls.filter(
        ([url]: [string]) =>
          typeof url === 'string' &&
          url.includes('/api/automation/') &&
          !url.includes('/run-all')
      )

      expect(automationCalls.length).toBe(TOTAL_JOBS)

      for (const [, init] of automationCalls) {
        expect(init.headers['x-automation-secret']).toBe('test-automation-secret')
      }
    })

    it('uses NEXT_PUBLIC_APP_URL as base URL for internal calls', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://vera.example.com')

      await POST(makeRequest())

      const automationCalls = mockFetch.mock.calls.filter(
        ([url]: [string]) =>
          typeof url === 'string' && url.includes('/api/automation/')
      )

      for (const [url] of automationCalls) {
        expect(url).toContain('https://vera.example.com')
      }
    })
  })

  // ── Failure handling ───────────────────────────────────────────────────

  describe('failure handling', () => {
    it('reports failed jobs in the response', async () => {
      mockFetch.mockImplementation(
        makeFetchReturns({
          'late-fees': { ok: false, body: { error: 'DB connection failed' } },
          'payment-plans': { ok: false, body: { error: 'timeout' } },
        })
      )

      const response = await POST(makeRequest())
      const body = await response.json()

      expect(response.status).toBe(200) // The orchestrator itself succeeds
      // 2 explicitly failed + 5 intelligence jobs that hit the fallback (404 with error key)
      expect(body.failures).toContain('late-fees')
      expect(body.failures).toContain('payment-plans')
      expect(body.jobs_failed).toBeGreaterThanOrEqual(2)
    })

    it('handles fetch rejections (network errors) gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/automation/late-fees')) {
          return Promise.reject(new Error('ECONNREFUSED'))
        }
        return makeFetchReturns()(url)
      })

      const response = await POST(makeRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.jobs_failed).toBeGreaterThanOrEqual(1)
    })

    it('continues running other jobs when one job fails', async () => {
      mockFetch.mockImplementation(
        makeFetchReturns({
          'post-assessments': { ok: false, body: { error: 'Failed' } },
        })
      )

      const response = await POST(makeRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      // All 12 jobs still ran (post-assessments failed, others succeeded)
      expect(body.jobs_run).toBe(TOTAL_JOBS)
      expect(body.failures).toContain('post-assessments')
      expect(body.jobs_failed).toBeGreaterThanOrEqual(1)
      expect(body.results.late_fees).toBeDefined()
      expect(body.results.payment_plans).toBeDefined()
    })
  })

  // ── Discord alerts ─────────────────────────────────────────────────────

  describe('discord alerts', () => {
    it('sends Discord alert when webhook URL is configured', async () => {
      vi.stubEnv(
        'DISCORD_AUTOMATION_WEBHOOK_URL',
        'https://discord.com/api/webhooks/test/test'
      )

      await POST(makeRequest())

      const discordCalls = mockFetch.mock.calls.filter(
        ([url]: [string]) =>
          typeof url === 'string' && url.includes('discord.com')
      )
      expect(discordCalls.length).toBe(1)
    })

    it('does not send Discord alert when webhook URL is missing', async () => {
      vi.stubEnv('DISCORD_AUTOMATION_WEBHOOK_URL', '')
      delete process.env.DISCORD_AUTOMATION_WEBHOOK_URL

      await POST(makeRequest())

      const discordCalls = mockFetch.mock.calls.filter(
        ([url]: [string]) =>
          typeof url === 'string' && url.includes('discord.com')
      )
      expect(discordCalls.length).toBe(0)
    })

    it('does not fail the response when Discord alert fails', async () => {
      vi.stubEnv(
        'DISCORD_AUTOMATION_WEBHOOK_URL',
        'https://discord.com/api/webhooks/test/test'
      )

      mockFetch.mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('discord.com')) {
          return Promise.reject(new Error('Discord unreachable'))
        }
        return makeFetchReturns()(url, init)
      })

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
    })
  })
})
