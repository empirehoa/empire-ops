import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const bodySchema = z.object({ is_test: z.boolean() }).strict()

/**
 * PATCH { is_test } marks a community as a test association (the Vantaca
 * dummy-data gate). Test associations are excluded from all portfolio figures.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Unknown community.' }, { status: 404 })
  }
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Send { "is_test": true } or { "is_test": false }.' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('communities')
    .update({ is_test: body.is_test })
    .eq('id', id)
    .select('id, is_test')
    .maybeSingle()
  if (error) {
    console.error('[imports/communities/:id]', error)
    return NextResponse.json({ error: 'Could not update the community.' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Unknown community.' }, { status: 404 })
  return NextResponse.json(data)
}
