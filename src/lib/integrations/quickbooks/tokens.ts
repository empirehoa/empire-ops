// Intuit OAuth 2.0 token exchange and refresh.
// Tokens are stored only as AES-GCM ciphertext (encryptToken). Intuit rotates
// the refresh token, so every refresh persists the new one immediately.

import { z } from 'zod'
import type { AdminClient } from '@/lib/supabase/admin'
import type { OAuthConnectionRow } from '@/lib/types/database'
import { decryptToken, encryptToken } from '@/lib/crypto/tokens'
import { QBO_TOKEN_URL, getQuickBooksConfig, type QuickBooksConfig } from './config'

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Refresh when the access token expires within this window. */
export const REFRESH_WINDOW_MS = 5 * 60 * 1000

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.coerce.number().positive(),
  x_refresh_token_expires_in: z.coerce.number().positive().optional(),
})

export type IntuitTokens = z.infer<typeof tokenResponseSchema>

export class QuickBooksTokenError extends Error {
  readonly status: number
  /** True when the user must go through Connect again (refresh token rejected or expired). */
  readonly reconnect: boolean
  constructor(message: string, status: number, reconnect: boolean) {
    super(message)
    this.name = 'QuickBooksTokenError'
    this.status = status
    this.reconnect = reconnect
  }
}

function basicAuth(config: QuickBooksConfig): string {
  return 'Basic ' + Buffer.from(`${config.clientId}:${config.clientSecret}`, 'utf8').toString('base64')
}

async function postTokenEndpoint(
  body: URLSearchParams,
  config: QuickBooksConfig,
  fetchImpl: FetchLike,
): Promise<IntuitTokens> {
  const res = await fetchImpl(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(config),
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // fall through with null
  }

  if (!res.ok) {
    // Only the OAuth error code is surfaced; the body is never echoed.
    const code =
      json && typeof json === 'object' && typeof (json as { error?: unknown }).error === 'string'
        ? (json as { error: string }).error
        : 'unknown_error'
    const reconnect = code === 'invalid_grant'
    throw new QuickBooksTokenError(
      reconnect
        ? 'QuickBooks authorization was rejected (invalid_grant); reconnect the company'
        : `QuickBooks token endpoint returned HTTP ${res.status} (${code})`,
      res.status,
      reconnect,
    )
  }

  const parsed = tokenResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new QuickBooksTokenError('QuickBooks token endpoint returned an unexpected response', res.status, false)
  }
  return parsed.data
}

export function exchangeCodeForTokens(
  code: string,
  config: QuickBooksConfig = getQuickBooksConfig(),
  fetchImpl: FetchLike = fetch,
): Promise<IntuitTokens> {
  return postTokenEndpoint(
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri }),
    config,
    fetchImpl,
  )
}

export function refreshTokens(
  refreshToken: string,
  config: QuickBooksConfig = getQuickBooksConfig(),
  fetchImpl: FetchLike = fetch,
): Promise<IntuitTokens> {
  return postTokenEndpoint(
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    config,
    fetchImpl,
  )
}

/** True when the access token is expired or expires within `windowMs` of `now`. */
export function needsRefresh(
  accessExpiresAt: string | Date | null | undefined,
  now: Date = new Date(),
  windowMs: number = REFRESH_WINDOW_MS,
): boolean {
  if (!accessExpiresAt) return true
  const expires = accessExpiresAt instanceof Date ? accessExpiresAt.getTime() : Date.parse(accessExpiresAt)
  if (Number.isNaN(expires)) return true
  return expires - now.getTime() <= windowMs
}

/** Encrypted oauth_connections columns for a token response received at `now`. */
export function tokenColumns(tokens: IntuitTokens, now: Date = new Date()) {
  return {
    access_token_enc: encryptToken(tokens.access_token),
    refresh_token_enc: encryptToken(tokens.refresh_token),
    access_expires_at: new Date(now.getTime() + tokens.expires_in * 1000).toISOString(),
    refresh_expires_at: tokens.x_refresh_token_expires_in
      ? new Date(now.getTime() + tokens.x_refresh_token_expires_in * 1000).toISOString()
      : null,
  }
}

export type FreshToken = { accessToken: string; realmId: string; refreshed: boolean }

/**
 * A usable access token for the connection, refreshing (and persisting the
 * rotated refresh token) when the current one expires within 5 minutes.
 */
export async function ensureFreshAccessToken(
  db: AdminClient,
  connection: Pick<
    OAuthConnectionRow,
    'id' | 'realm_id' | 'access_token_enc' | 'refresh_token_enc' | 'access_expires_at' | 'refresh_expires_at'
  >,
  options: { now?: Date; config?: QuickBooksConfig; fetchImpl?: FetchLike } = {},
): Promise<FreshToken> {
  const now = options.now ?? new Date()

  if (!needsRefresh(connection.access_expires_at, now)) {
    return { accessToken: decryptToken(connection.access_token_enc), realmId: connection.realm_id, refreshed: false }
  }

  if (connection.refresh_expires_at && Date.parse(connection.refresh_expires_at) <= now.getTime()) {
    throw new QuickBooksTokenError('QuickBooks refresh token has expired; reconnect the company', 401, true)
  }

  const tokens = await refreshTokens(
    decryptToken(connection.refresh_token_enc),
    options.config ?? getQuickBooksConfig(),
    options.fetchImpl ?? fetch,
  )

  const { error } = await db
    .from('oauth_connections')
    .update({ ...tokenColumns(tokens, now), updated_at: now.toISOString() })
    .eq('id', connection.id)
  if (error) {
    // The old refresh token may already be invalidated, so this must be loud.
    throw new Error(`Could not save refreshed QuickBooks tokens: ${error.message}`)
  }

  return { accessToken: tokens.access_token, realmId: connection.realm_id, refreshed: true }
}
