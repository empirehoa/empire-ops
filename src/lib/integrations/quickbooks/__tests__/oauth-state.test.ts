import { describe, expect, it } from 'vitest'
import { createOAuthState, stateCookieOptions, verifyOAuthState } from '../oauth-state'

describe('QuickBooks OAuth state cookie', () => {
  it('accepts the state it issued and returns the company slug', () => {
    const { state, cookieValue } = createOAuthState('wfw')
    expect(verifyOAuthState(cookieValue, state)).toEqual({ ok: true, slug: 'wfw' })
  })

  it('issues a fresh random nonce each time', () => {
    const a = createOAuthState('empire')
    const b = createOAuthState('empire')
    expect(a.state).not.toBe(b.state)
    expect(a.state.length).toBeGreaterThanOrEqual(43) // 32 random bytes, base64url
  })

  it('rejects a mismatched state (CSRF)', () => {
    const { cookieValue } = createOAuthState('empire')
    const attacker = createOAuthState('empire')
    expect(verifyOAuthState(cookieValue, attacker.state)).toEqual({ ok: false, reason: 'state_mismatch' })
  })

  it('rejects a state of a different length without throwing', () => {
    const { cookieValue } = createOAuthState('empire')
    expect(verifyOAuthState(cookieValue, 'short')).toEqual({ ok: false, reason: 'state_mismatch' })
  })

  it('rejects when the cookie or state is missing', () => {
    const { state, cookieValue } = createOAuthState('fixiq')
    expect(verifyOAuthState(undefined, state)).toEqual({ ok: false, reason: 'missing_state_cookie' })
    expect(verifyOAuthState(cookieValue, null)).toEqual({ ok: false, reason: 'missing_state' })
  })

  it('rejects a malformed or tampered cookie', () => {
    const { state } = createOAuthState('fixiq')
    expect(verifyOAuthState('no-separator', state).ok).toBe(false)
    expect(verifyOAuthState(`${state}.BAD SLUG!`, state)).toEqual({ ok: false, reason: 'malformed_state_cookie' })
  })

  it('rejects an invalid slug at creation', () => {
    expect(() => createOAuthState('../etc')).toThrow()
  })

  it('sets an httpOnly, lax, path-scoped, short-lived cookie', () => {
    expect(stateCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/integrations/quickbooks',
      maxAge: 600,
    })
  })
})
