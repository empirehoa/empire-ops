import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAllowedEmail } from '@/lib/auth/admin'

const Body = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const { email } = parsed.data
  // Same response whether or not the address is allowed, so the allowlist can't be probed.
  const sent = { message: 'If that address has access, a sign-in link is on its way.' }
  if (!isAllowedEmail(email)) return NextResponse.json(sent)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${request.nextUrl.origin}/auth/callback` },
  })
  if (error) {
    return NextResponse.json({ error: 'The sign-in link could not be sent. Try again in a minute.' }, { status: 502 })
  }
  return NextResponse.json(sent)
}
