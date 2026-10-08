/**
 * GET /api/admin/intelligence/cross-sell
 *
 * Cross-sell signals from Vantaca action items (open, or opened in the last 90
 * days), per association and sister company. Leads only; no dollar estimates.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { CROSS_SELL_RULES, matchCrossSell } from '@/lib/intelligence/cross-sell'
import { countActionItems, loadActionItems, loadCommunities } from '@/lib/intelligence/load'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin
  try {
    const db = createAdminClient()
    const now = new Date()
    const [itemCount, communities, items] = await Promise.all([countActionItems(db), loadCommunities(db), loadActionItems(db, now)])
    const rules = CROSS_SELL_RULES.map((r) => ({ company: r.company, company_name: r.companyName, keywords: r.keywords }))
    if (itemCount === 0 || communities.length === 0) {
      return NextResponse.json({
        available: false,
        reason:
          itemCount === 0
            ? 'No Vantaca action items imported. Upload an action item export at /admin/imports.'
            : 'No Vantaca communities imported. Upload the community list at /admin/imports.',
        rules,
      })
    }
    return NextResponse.json({ available: true, rules, ...matchCrossSell(items, communities, now) })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not compute cross-sell' }, { status: 500 })
  }
}
