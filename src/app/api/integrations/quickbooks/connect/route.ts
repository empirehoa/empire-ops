/**
 * GET /api/integrations/quickbooks/connect?company=<slug>
 * Admin-only. Starts the Intuit OAuth flow for one company file: sets a
 * short-lived httpOnly state cookie and redirects to Intuit's consent screen.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken } from '@/lib/crypto/tokens'
import {
  QBO_AUTHORIZE_URL,
  QBO_SCOPE,
  QBO_STATE_COOKIE,
  companySlugSchema,
  createOAuthState,
  getQuickBooksConfig,
  quickBooksConfigProblem,
  stateCookieOptions,
} from '@/lib/integrations/quickbooks'

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const slug = companySlugSchema.safeParse(request.nextUrl.searchParams.get('company') ?? '')
  if (!slug.success) {
    return NextResponse.json({ error: 'Query parameter "company" must be a company slug' }, { status: 400 })
  }

  const problem = quickBooksConfigProblem()
  if (problem) return NextResponse.json({ error: problem }, { status: 503 })
  try {
    // Fail now rather than after Intuit has issued (and we've spent) the auth code.
    encryptToken('probe')
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'TOKEN_ENCRYPTION_KEY is invalid' },
      { status: 503 },
    )
  }

  const db = createAdminClient()
  const { data: company, error } = await db
    .from('companies')
    .select('id, slug')
    .eq('slug', slug.data)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not look up company' }, { status: 500 })
  if (!company) return NextResponse.json({ error: `Unknown company "${slug.data}"` }, { status: 404 })

  const config = getQuickBooksConfig()
  const { state, cookieValue } = createOAuthState(company.slug)

  const authorize = new URL(QBO_AUTHORIZE_URL)
  authorize.searchParams.set('client_id', config.clientId)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('scope', QBO_SCOPE)
  authorize.searchParams.set('redirect_uri', config.redirectUri)
  authorize.searchParams.set('state', state)

  const res = NextResponse.redirect(authorize.toString())
  res.cookies.set(QBO_STATE_COOKIE, cookieValue, stateCookieOptions())
  res.headers.set('Cache-Control', 'no-store')
  return res
}
