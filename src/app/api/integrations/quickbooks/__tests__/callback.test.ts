import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const fromSpy = vi.fn()

vi.mock('@/lib/auth/admin', () => ({
  requireAdminApi: vi.fn(async () => ({ id: 'u1', email: 'admin@example.com' })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromSpy }),
}))

import { createOAuthState, QBO_STATE_COOKIE } from '@/lib/integrations/quickbooks'
import { GET } from '../callback/route'

function callbackRequest(query: string, cookie?: string) {
  return new NextRequest(`https://ops.example.com/api/integrations/quickbooks/callback?${query}`, {
    headers: cookie ? { cookie: `${QBO_STATE_COOKIE}=${cookie}` } : {},
  })
}

describe('GET /api/integrations/quickbooks/callback', () => {
  const fetchSpy = vi.fn()

  beforeEach(() => {
    fromSpy.mockReset()
    fetchSpy.mockReset()
    vi.stubGlobal('fetch', fetchSpy)
  })

  it('rejects a mismatched state before touching the database or Intuit', async () => {
    const { cookieValue } = createOAuthState('empire')
    const forged = createOAuthState('empire').state

    const res = await GET(callbackRequest(`code=abc&realmId=123&state=${forged}`, cookieValue))

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/admin/integrations')
    expect(location.searchParams.get('error')).toBe('state_mismatch')
    expect(location.searchParams.get('connected')).toBeNull()
    expect(fromSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    // The one-time state cookie is cleared.
    expect(res.headers.get('set-cookie')).toMatch(new RegExp(`${QBO_STATE_COOKIE}=;`))
  })

  it('rejects a callback with no state cookie', async () => {
    const { state } = createOAuthState('empire')
    const res = await GET(callbackRequest(`code=abc&realmId=123&state=${state}`))
    expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBe('missing_state_cookie')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('reports a denied consent without exchanging a code', async () => {
    const { state, cookieValue } = createOAuthState('wfw')
    const res = await GET(callbackRequest(`error=access_denied&state=${state}`, cookieValue))
    const location = new URL(res.headers.get('location')!)
    expect(location.searchParams.get('error')).toBe('authorization_denied')
    expect(location.searchParams.get('company')).toBe('wfw')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
