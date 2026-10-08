/**
 * POST /api/integrations/quickbooks/sync
 * Admin-only manual run of the QuickBooks sync for every connected company.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { quickBooksConfigProblem, syncAllQuickBooks } from '@/lib/integrations/quickbooks'

export const maxDuration = 300

export async function POST() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const problem = quickBooksConfigProblem()
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 503 })

  try {
    const result = await syncAllQuickBooks(createAdminClient())
    return NextResponse.json({ ok: result.failed.length === 0, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'QuickBooks sync failed'
    console.error('[quickbooks-sync]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
