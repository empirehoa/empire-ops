import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

const { GET } = await import('./route')

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key-test')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret')
    vi.stubEnv('SENTRY_DSN', 'https://test@sentry.io/0')
  })

  it('returns 200 with status ok when all services reachable', async () => {
    mockSelect.mockResolvedValue({ error: null })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.checks.server.status).toBe('ok')
    expect(body.checks.supabase.status).toBe('ok')
  })

  it('returns a timestamp and version', async () => {
    mockSelect.mockResolvedValue({ error: null })

    const response = await GET()
    const body = await response.json()

    expect(typeof body.timestamp).toBe('string')
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0)
    expect(body.version).toBeDefined()
    expect(typeof body.response_time_ms).toBe('number')
  })

  it('returns 503 degraded when Supabase errors', async () => {
    mockSelect.mockResolvedValue({ error: { message: 'Connection refused' } })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('degraded')
    expect(body.checks.supabase.status).toBe('error')
  })

  it('includes latency_ms on supabase check', async () => {
    mockSelect.mockResolvedValue({ error: null })

    const response = await GET()
    const body = await response.json()

    expect(typeof body.checks.supabase.latency_ms).toBe('number')
  })

  it('checks stripe, automation, and sentry config', async () => {
    mockSelect.mockResolvedValue({ error: null })

    const response = await GET()
    const body = await response.json()

    expect(body.checks.stripe.status).toBe('ok')
    expect(body.checks.automation.status).toBe('ok')
    expect(body.checks.sentry.status).toBe('ok')
  })

  it('reports degraded when env vars missing', async () => {
    mockSelect.mockResolvedValue({ error: null })
    vi.stubEnv('STRIPE_SECRET_KEY', '')
    delete process.env.STRIPE_SECRET_KEY

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.status).toBe('degraded')
    expect(body.checks.stripe.status).toBe('error')
  })
})
