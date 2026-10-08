import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { GET, POST } = await import('./route')

const req = (auth?: string) =>
  new Request('http://localhost/api/cron/run-all', {
    headers: auth ? { authorization: auth } : {},
  }) as never

describe('/api/cron/run-all', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    vi.stubEnv('AUTOMATION_SECRET', 'auto-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ops.example.com')
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ jobs_run: 6 }), { status: 200 }))
  })

  it('refuses every request when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await GET(req('Bearer '))
    expect(res.status).toBe(500)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects a wrong or missing bearer token', async () => {
    expect((await GET(req())).status).toBe(401)
    expect((await GET(req('Bearer nope'))).status).toBe(401)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('forwards to run-all with the automation secret', async () => {
    const res = await GET(req('Bearer cron-secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ jobs_run: 6 })
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://ops.example.com/api/automation/run-all')
    expect(init.headers['x-automation-secret']).toBe('auto-secret')
  })

  it('returns 502 when run-all fails', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'x' }), { status: 500 }))
    expect((await POST(req('Bearer cron-secret'))).status).toBe(502)
  })
})
