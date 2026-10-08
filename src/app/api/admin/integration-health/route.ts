/**
 * GET /api/admin/integration-health
 *
 * Per source: latest sync_runs row (any status) and latest success; whether
 * HUBSPOT_ACCESS_TOKEN is set; which companies have a QuickBooks connection
 * (token columns are never read); Vantaca imports by kind; delivery settings.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { loadIntegrationStatus } from '@/lib/intelligence/integration-status'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    return NextResponse.json(await loadIntegrationStatus(createAdminClient()))
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not read integration status' }, { status: 500 })
  }
}
