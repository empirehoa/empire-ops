/**
 * POST /api/sync/run
 * Scheduled entry point (x-automation-secret). Runs HubSpot, then QuickBooks.
 * Each source runs independently: one failing never stops the other. A source
 * whose credentials aren't configured is skipped with a reason.
 *
 * Responds 200 when every source succeeded or was skipped, 502 if any failed,
 * with per-source results in both cases.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { verifyAutomationSecret } from '@/lib/auth/automation-secret'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAllSyncs } from './run-syncs'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let db
  try {
    db = createAdminClient()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Database is not configured' },
      { status: 500 },
    )
  }

  const results = await runAllSyncs(db)
  const ok = Object.values(results).every((r) => r.status !== 'failed')
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 502 })
}
