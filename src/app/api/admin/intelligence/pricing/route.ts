/**
 * GET /api/admin/intelligence/pricing
 *
 * Internal fee-per-door benchmarks by association size, from the Vantaca
 * community list. Internal data only; no market comparison.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { loadCommunities } from '@/lib/intelligence/load'
import { computePricingBenchmarks, PRICING_LABEL } from '@/lib/intelligence/pricing'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    const pricing = computePricingBenchmarks(await loadCommunities(createAdminClient()))
    if (!pricing) {
      return NextResponse.json({
        available: false,
        label: PRICING_LABEL,
        reason:
          'No active Vantaca community has both a door count and a monthly management fee. Import the community list with those columns at /admin/imports.',
      })
    }
    return NextResponse.json({ available: true, ...pricing })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not compute pricing' }, { status: 500 })
  }
}
