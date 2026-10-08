// CSRF protection for the QuickBooks OAuth round trip.
// /connect puts a random nonce in the `state` parameter and stores
// `<nonce>.<company slug>` in a short-lived httpOnly cookie. /callback accepts
// the code only when the returned state equals the cookie's nonce.

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

export const QBO_STATE_COOKIE = 'qbo_oauth_state'
export const QBO_STATE_MAX_AGE_SECONDS = 600
/** Scoped to the QuickBooks routes so the cookie isn't sent anywhere else. */
export const QBO_STATE_COOKIE_PATH = '/api/integrations/quickbooks'

export const companySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{0,62}$/, 'Invalid company slug')

export function createOAuthState(slug: string): { state: string; cookieValue: string } {
  const nonce = randomBytes(32).toString('base64url')
  return { state: nonce, cookieValue: `${nonce}.${companySlugSchema.parse(slug)}` }
}

export type StateCheck = { ok: true; slug: string } | { ok: false; reason: string }

export function verifyOAuthState(
  cookieValue: string | null | undefined,
  stateParam: string | null | undefined,
): StateCheck {
  if (!cookieValue) return { ok: false, reason: 'missing_state_cookie' }
  if (!stateParam) return { ok: false, reason: 'missing_state' }

  const dot = cookieValue.indexOf('.')
  if (dot <= 0) return { ok: false, reason: 'malformed_state_cookie' }
  const nonce = cookieValue.slice(0, dot)
  const slug = companySlugSchema.safeParse(cookieValue.slice(dot + 1))
  if (!slug.success) return { ok: false, reason: 'malformed_state_cookie' }

  const a = Buffer.from(nonce, 'utf8')
  const b = Buffer.from(stateParam, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'state_mismatch' }

  return { ok: true, slug: slug.data }
}

export function stateCookieOptions(maxAge: number = QBO_STATE_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Lax so the cookie is sent on Intuit's top-level GET redirect back to us.
    sameSite: 'lax' as const,
    path: QBO_STATE_COOKIE_PATH,
    maxAge,
  }
}
