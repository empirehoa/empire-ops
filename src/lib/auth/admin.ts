import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminUser = { id: string; email: string }

/** Comma-separated allowlist in ADMIN_EMAILS. Case-insensitive. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

/** The signed-in user if their email is on the allowlist, otherwise null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !isAllowedEmail(user.email)) return null
  return { id: user.id, email: user.email }
}

/** For route handlers: the admin user, or a 401/403 response to return as-is. */
export async function requireAdminApi(): Promise<AdminUser | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!isAllowedEmail(user.email)) {
    return NextResponse.json({ error: 'This account is not on the admin list' }, { status: 403 })
  }
  return { id: user.id, email: user.email! }
}

/** For server components: the admin user, or a redirect to /login. */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) redirect('/login')
  return admin
}
