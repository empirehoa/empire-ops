/**
 * Server-side auth context and permission enforcement.
 * For pure sync permission checks, use @/lib/auth/permissions.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type UserRole, hasPermission } from './permissions'

export type { UserRole }
export { hasPermission, isHomeownerScoped, PERMISSION_MATRIX } from './permissions'

export interface AuthContext {
  userId: string
  tenantId: string
  role: UserRole
  /** Board members / homeowners may be scoped to specific association IDs */
  associationIds?: string[]
}

/**
 * Get auth context for the current server-side request.
 * Returns null if the user is not authenticated or has no profile.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    userId: user.id,
    tenantId: profile.tenant_id,
    role: profile.role as UserRole,
  }
}

/**
 * Require authentication + specific permission.
 * Throws a Response with status 401 / 403 if the check fails.
 * Returns the AuthContext on success.
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<AuthContext> {
  const ctx = await getAuthContext()
  if (!ctx) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // super_admin bypasses everything
  if (ctx.role === 'super_admin') return ctx

  if (!hasPermission(ctx.role, resource, action)) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden',
        required: `${resource}:${action}`,
        role: ctx.role,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  return ctx
}

/**
 * Route-handler-friendly permission check.
 * Returns AuthContext on success, or a NextResponse (401/403) on failure.
 * Callers can do:
 *   const auth = await checkRoutePermission('financials', 'read')
 *   if (auth instanceof NextResponse) return auth
 */
export async function checkRoutePermission(
  resource: string,
  action: string
): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // super_admin bypasses everything
  if (ctx.role === 'super_admin') return ctx

  if (!hasPermission(ctx.role, resource, action)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        required: `${resource}:${action}`,
        role: ctx.role,
      },
      { status: 403 }
    )
  }
  return ctx
}
