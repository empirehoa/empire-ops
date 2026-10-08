import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { decryptToken, encryptToken } from '@/lib/crypto/tokens'
import type { QuickBooksConfig } from '../config'
import {
  QuickBooksTokenError,
  REFRESH_WINDOW_MS,
  ensureFreshAccessToken,
  exchangeCodeForTokens,
  needsRefresh,
} from '../tokens'
import { createFakeDb } from './fake-db'

const config: QuickBooksConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'https://ops.example.com/api/integrations/quickbooks/callback',
  environment: 'sandbox',
  apiBase: 'https://sandbox-quickbooks.api.intuit.com',
}

let prevKey: string | undefined
beforeAll(() => {
  prevKey = process.env.TOKEN_ENCRYPTION_KEY
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})
afterAll(() => {
  if (prevKey === undefined) delete process.env.TOKEN_ENCRYPTION_KEY
  else process.env.TOKEN_ENCRYPTION_KEY = prevKey
})

const now = new Date('2026-10-08T06:00:00.000Z')
const inMs = (ms: number) => new Date(now.getTime() + ms).toISOString()

describe('needsRefresh (5-minute window)', () => {
  it('does not refresh a token with more than 5 minutes left', () => {
    expect(needsRefresh(inMs(REFRESH_WINDOW_MS + 1000), now)).toBe(false)
    expect(needsRefresh(inMs(60 * 60 * 1000), now)).toBe(false)
  })

  it('refreshes at exactly 5 minutes, inside the window, and after expiry', () => {
    expect(needsRefresh(inMs(REFRESH_WINDOW_MS), now)).toBe(true)
    expect(needsRefresh(inMs(4 * 60 * 1000 + 59 * 1000), now)).toBe(true)
    expect(needsRefresh(inMs(-1000), now)).toBe(true)
  })

  it('refreshes when the expiry is missing or unreadable', () => {
    expect(needsRefresh(null, now)).toBe(true)
    expect(needsRefresh('garbage', now)).toBe(true)
  })
})

function connection(accessExpiresInMs: number, refreshExpiresInMs: number | null = 90 * 86_400_000) {
  return {
    id: 'conn-1',
    realm_id: '9130350000000000',
    access_token_enc: encryptToken('old-access'),
    refresh_token_enc: encryptToken('old-refresh'),
    access_expires_at: inMs(accessExpiresInMs),
    refresh_expires_at: refreshExpiresInMs === null ? null : inMs(refreshExpiresInMs),
  }
}

describe('ensureFreshAccessToken', () => {
  it('uses the stored token without calling Intuit when it is not near expiry', async () => {
    const fetchImpl = vi.fn()
    const { db, ops } = createFakeDb()
    const out = await ensureFreshAccessToken(db, connection(30 * 60 * 1000), { now, config, fetchImpl })
    expect(out).toEqual({ accessToken: 'old-access', realmId: '9130350000000000', refreshed: false })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(ops).toHaveLength(0)
  })

  it('refreshes within 5 minutes of expiry and persists the rotated refresh token encrypted', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = new URLSearchParams(String(init?.body))
      expect(body.get('grant_type')).toBe('refresh_token')
      expect(body.get('refresh_token')).toBe('old-refresh')
      const auth = (init?.headers as Record<string, string>).Authorization
      expect(auth).toBe('Basic ' + Buffer.from('test-client-id:test-client-secret').toString('base64'))
      return new Response(
        JSON.stringify({
          access_token: 'new-access',
          refresh_token: 'rotated-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          x_refresh_token_expires_in: 8_726_400,
        }),
        { status: 200 },
      )
    })
    const { db, ops } = createFakeDb()

    const out = await ensureFreshAccessToken(db, connection(2 * 60 * 1000), { now, config, fetchImpl })

    expect(out).toEqual({ accessToken: 'new-access', realmId: '9130350000000000', refreshed: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const update = ops.find((o) => o.table === 'oauth_connections' && o.action === 'update')!
    expect(update.filters).toContainEqual(['eq', 'id', 'conn-1'])
    const saved = update.payload as Record<string, string>
    expect(saved.refresh_token_enc).not.toContain('rotated-refresh')
    expect(decryptToken(saved.refresh_token_enc)).toBe('rotated-refresh')
    expect(decryptToken(saved.access_token_enc)).toBe('new-access')
    expect(saved.access_expires_at).toBe(inMs(3600 * 1000))
    expect(saved.refresh_expires_at).toBe(inMs(8_726_400 * 1000))
  })

  it('asks for a reconnect when the refresh token itself has expired, without calling Intuit', async () => {
    const fetchImpl = vi.fn()
    const { db } = createFakeDb()
    const err = await ensureFreshAccessToken(db, connection(-1000, -1000), { now, config, fetchImpl }).catch((e) => e)
    expect(err).toBeInstanceOf(QuickBooksTokenError)
    expect((err as QuickBooksTokenError).reconnect).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('maps invalid_grant to a reconnect error that does not echo tokens', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }))
    const { db, ops } = createFakeDb()
    const err = await ensureFreshAccessToken(db, connection(0), { now, config, fetchImpl }).catch((e) => e)
    expect(err).toBeInstanceOf(QuickBooksTokenError)
    expect((err as QuickBooksTokenError).reconnect).toBe(true)
    expect((err as Error).message).not.toContain('old-refresh')
    expect(ops).toHaveLength(0)
  })

  it('fails loudly if the rotated tokens cannot be saved', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 3600 }), { status: 200 }),
    )
    const { db } = createFakeDb(() => ({ error: { message: 'db down' } }))
    await expect(ensureFreshAccessToken(db, connection(0), { now, config, fetchImpl })).rejects.toThrow(
      /Could not save refreshed QuickBooks tokens/,
    )
  })
})

describe('exchangeCodeForTokens', () => {
  it('posts the code and redirect_uri with Basic auth', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer')
      const body = new URLSearchParams(String(init?.body))
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('auth-code')
      expect(body.get('redirect_uri')).toBe(config.redirectUri)
      return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: '3600' }), { status: 200 })
    })
    const tokens = await exchangeCodeForTokens('auth-code', config, fetchImpl)
    expect(tokens.expires_in).toBe(3600)
  })
})
