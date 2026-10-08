/**
 * POST /api/integrations/hubspot/sync
 * Admin-only manual run of the HubSpot deals sync.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { isHubSpotConfigured, syncHubSpotDeals } from '@/lib/integrations/hubspot'

export const maxDuration = 300

export async function POST() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  if (!isHubSpotConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'HubSpot is not connected: HUBSPOT_ACCESS_TOKEN is not set' },
      { status: 503 },
    )
  }

  try {
    const result = await syncHubSpotDeals(createAdminClient())
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HubSpot sync failed'
    console.error('[hubspot-sync]', message)
    // 502, not 401: an upstream token problem must not look like the admin's session expired.
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
