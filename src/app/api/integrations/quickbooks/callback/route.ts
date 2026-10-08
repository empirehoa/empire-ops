/**
 * GET /api/integrations/quickbooks/callback?code=...&state=...&realmId=...
 * Intuit redirects here after consent. Verifies the state cookie (CSRF),
 * exchanges the code, stores the tokens encrypted, links the realm to the
 * company and redirects to /admin/integrations.
 *
 * Outcome is reported to the page via query string only:
 *   ?connected=<slug>            success
 *   ?error=<code>[&company=slug] failure (short machine codes, never token data)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  QBO_STATE_COOKIE,
  exchangeCodeForTokens,
  getQuickBooksConfig,
  quickBooksConfigProblem,
  stateCookieOptions,
  tokenColumns,
  verifyOAuthState,
} from '@/lib/integrations/quickbooks'

const callbackSchema = z.object({
  code: z.string().min(1).max(4096),
  realmId: z.string().regex(/^\d{1,32}$/),
})

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const params = request.nextUrl.searchParams

  const finish = (query: Record<string, string>) => {
    const url = new URL('/admin/integrations', request.nextUrl.origin)
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
    const res = NextResponse.redirect(url)
    // One-time use: always clear the state cookie.
    res.cookies.set(QBO_STATE_COOKIE, '', stateCookieOptions(0))
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  const state = verifyOAuthState(request.cookies.get(QBO_STATE_COOKIE)?.value, params.get('state'))
  if (!state.ok) return finish({ error: state.reason })
  const slug = state.slug

  if (params.get('error')) return finish({ error: 'authorization_denied', company: slug })

  const input = callbackSchema.safeParse({ code: params.get('code'), realmId: params.get('realmId') })
  if (!input.success) return finish({ error: 'invalid_callback', company: slug })

  if (quickBooksConfigProblem()) return finish({ error: 'not_configured', company: slug })

  const db = createAdminClient()
  const { data: company, error: companyError } = await db
    .from('companies')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (companyError || !company) return finish({ error: 'unknown_company', company: slug })

  // companies.qbo_realm_id is unique: one QuickBooks file per company.
  const { data: other } = await db
    .from('companies')
    .select('slug')
    .eq('qbo_realm_id', input.data.realmId)
    .neq('id', company.id)
    .maybeSingle()
  if (other) return finish({ error: 'realm_linked_to_other_company', company: slug })

  let tokens
  try {
    tokens = await exchangeCodeForTokens(input.data.code, getQuickBooksConfig())
  } catch (err) {
    console.error('[qbo-callback] token exchange failed:', err instanceof Error ? err.message : 'unknown')
    return finish({ error: 'token_exchange_failed', company: slug })
  }

  const now = new Date()
  const { error: saveError } = await db.from('oauth_connections').upsert(
    {
      provider: 'quickbooks',
      company_id: company.id,
      realm_id: input.data.realmId,
      ...tokenColumns(tokens, now),
      connected_by: admin.email,
      updated_at: now.toISOString(),
    },
    { onConflict: 'provider,company_id' },
  )
  if (saveError) {
    console.error('[qbo-callback] saving connection failed:', saveError.message)
    return finish({ error: 'save_failed', company: slug })
  }

  const { error: linkError } = await db
    .from('companies')
    .update({ qbo_realm_id: input.data.realmId })
    .eq('id', company.id)
  if (linkError) {
    console.error('[qbo-callback] linking realm failed:', linkError.message)
    return finish({ error: 'save_failed', company: slug })
  }

  return finish({ connected: slug })
}
