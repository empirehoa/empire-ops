/**
 * GET /api/admin/intelligence
 *
 * The full intelligence snapshot: pipeline (HubSpot), homeowner AR and action
 * item aging (Vantaca), retention risk, cross-sell, fee per door, manager
 * workload, and trailing 12-month revenue per company (QuickBooks). Sections are
 * null when their source has no data; portfolio figures exclude test associations.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { buildIntelligenceSnapshot } from '@/lib/intelligence/snapshot'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    return NextResponse.json(await buildIntelligenceSnapshot(createAdminClient()))
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not build intelligence' }, { status: 500 })
  }
}
