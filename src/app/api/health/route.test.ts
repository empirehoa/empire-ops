import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn<(table: string) => { select: typeof mockSelect }>(() => ({ select: mockSelect }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

const { GET } = await import('./route')

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key-test')
    vi.stubEnv('AUTOMATION_SECRET', 'test-secret')
  })

  it('returns 200 ok when the server and Supabase are reachable', async () => {
    mockSelect.mockResolvedValue({ error: null })
    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.checks.server.status).toBe('ok')
    expect(body.checks.supabase.status).toBe('ok')
    expect(typeof body.checks.supabase.latency_ms).toBe('number')
  })

  it('checks connectivity with a head-only count on companies', async () => {
    mockSelect.mockResolvedValue({ error: null })
    await GET()
    expect(mockFrom).toHaveBeenCalledWith('companies')
    expect(mockSelect).toHaveBeenCalledWith('id', { count: 'exact', head: true })
  })

  it('returns a timestamp, version and response time', async () => {
    mockSelect.mockResolvedValue({ error: null })
    const body = await (await GET()).json()
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
    expect(body.checks.supabase).toMatchObject({ status: 'error', detail: 'Connection refused' })
  })

  it('returns 503 degraded when the Supabase client throws', async () => {
    mockSelect.mockRejectedValue(new Error('fetch failed'))
    const body = await (await GET()).json()
    expect(body.checks.supabase).toMatchObject({ status: 'error', detail: 'fetch failed' })
  })

  it('reports missing Supabase env vars without calling Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(503)
    expect(body.checks.supabase.status).toBe('error')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('reports a missing AUTOMATION_SECRET as degraded', async () => {
    mockSelect.mockResolvedValue({ error: null })
    vi.stubEnv('AUTOMATION_SECRET', '')
    const body = await (await GET()).json()
    expect(body.status).toBe('degraded')
    expect(body.checks.automation.status).toBe('error')
  })
})
