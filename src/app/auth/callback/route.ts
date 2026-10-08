import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const dest = request.nextUrl.clone()
  dest.search = ''
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      dest.pathname = '/admin/executive'
      return NextResponse.redirect(dest)
    }
  }
  dest.pathname = '/login'
  dest.searchParams.set('error', 'link')
  return NextResponse.redirect(dest)
}
