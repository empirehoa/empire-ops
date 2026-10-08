/**
 * Agent: Financial health
 * POST /api/automation/financial-health (x-automation-secret)
 *
 * Two independent parts, each reported only when its source has data:
 *   - Homeowner AR across managed associations from the latest Vantaca AR aging
 *     snapshot per association (total, 90+ share, associations with the most 90+).
 *   - Trailing 12 complete months of revenue and net income per company from
 *     QuickBooks P&L reports. Companies without data are named, never estimated.
 * Skips, naming both sources, when neither has data.
 */

import type { NextRequest } from 'next/server'
import { computeArStats } from '@/lib/intelligence/ar'
import { count, formatDay, formatMonth, pct, usd } from '@/lib/intelligence/format'
import { loadArSnapshots, loadCommunities, loadCompanies, loadPnl, loadQboConnections } from '@/lib/intelligence/load'
import { trailingRevenueByCompany, trailingWindow } from '@/lib/intelligence/revenue'
import { runAgent } from '../_lib/run-agent'

export const maxDuration = 60

/** Alert thresholds (judgment calls, not standards): warn at 30%+ of homeowner AR in 90+, or any company with negative T12 net income. */
const AR_90_SHARE_WARNING = 0.3

export async function POST(request: NextRequest) {
  return runAgent(request, 'financial-health', async (db, now) => {
    const window = trailingWindow(now)
    const [communities, snapshots, companies, connections, pnl] = await Promise.all([
      loadCommunities(db),
      loadArSnapshots(db),
      loadCompanies(db),
      loadQboConnections(db),
      loadPnl(db, window.start),
    ])
    const ar = computeArStats(snapshots, communities)
    const revenue = trailingRevenueByCompany(pnl, companies, now)
    const withData = revenue.companies.filter((c) => c.hasData)

    if (!ar && withData.length === 0) {
      return {
        status: 'skipped',
        headline:
          'Skipped: no Vantaca AR aging snapshots and no QuickBooks P&L reports. Import AR aging at /admin/imports or connect QuickBooks at /admin/integrations.',
      }
    }

    const connected = new Set(connections.map((c) => c.company_id))
    const missing = revenue.companies.filter((c) => !c.hasData)
    const period = `${formatMonth(window.months[0])} to ${formatMonth(window.months[window.months.length - 1])}`

    const arLine = ar
      ? `Homeowner AR across ${count(ar.communityCount)} associations is ${usd(ar.total)}, ${pct(ar.share90Plus)} of it 90+ days (${usd(ar.days90Plus)}), latest snapshots ${formatDay(ar.asOfMin)} to ${formatDay(ar.asOfMax)}.`
      : 'No Vantaca AR aging imported yet (upload at /admin/imports).'
    const revLine =
      withData.length > 0
        ? `QuickBooks, ${period}: ` +
          withData
            .map((c) => {
              const partial = c.monthsCovered < c.monthsExpected ? ` (${c.monthsCovered} of ${c.monthsExpected} months)` : ''
              return `${c.name} revenue ${usd(c.revenue)}, net income ${usd(c.netIncome)}${partial}`
            })
            .join('; ') +
          '.'
        : 'No QuickBooks P&L synced yet.'
    const missingLine =
      missing.length > 0
        ? `No QuickBooks P&L for ${missing
            .map((c) => `${c.name}${connected.has(c.companyId) ? ' (connected, not yet synced)' : ' (not connected)'}`)
            .join(', ')}.`
        : ''

    const negative = withData.filter((c) => (c.netIncome ?? 0) < 0)
    const warn = (ar?.share90Plus ?? 0) >= AR_90_SHARE_WARNING || negative.length > 0

    const discordFields: Record<string, string> = {}
    if (ar) {
      discordFields['Homeowner AR'] = usd(ar.total)
      discordFields['90+ share'] = pct(ar.share90Plus)
    }
    for (const c of withData) discordFields[`${c.name} T12 revenue`] = usd(c.revenue)

    return {
      status: 'succeeded',
      headline: [arLine, revLine, missingLine].filter(Boolean).join(' '),
      severity: warn ? 'warning' : 'healthy',
      metrics: {
        ar_communities: ar?.communityCount ?? null,
        ar_total: ar?.total ?? null,
        ar_90_plus: ar?.days90Plus ?? null,
        ar_90_plus_share: ar?.share90Plus ?? null,
        ar_as_of: ar?.asOfMax ?? null,
        t12_start: window.start,
        t12_end: window.end,
        companies_with_qbo_data: withData.length,
      },
      findings: {
        ar: ar && {
          top_by_90_plus: ar.topBy90Plus,
          buckets: { current: ar.current, days_30: ar.days30, days_60: ar.days60, days_90_plus: ar.days90Plus },
        },
        companies: revenue.companies.map((c) => ({
          company: c.name,
          slug: c.slug,
          revenue: c.revenue,
          net_income: c.netIncome,
          months_covered: c.monthsCovered,
          quickbooks_connected: connected.has(c.companyId),
        })),
      },
      discordFields,
    }
  })
}
