// Connection and freshness status per data source, for /admin/integrations,
// /api/admin/integration-health and the "data as of" lines on the dashboards.

import type { AdminClient } from '@/lib/supabase/admin'
import { countDeals, loadCompanies, loadQboConnections, loadRecentSyncRuns } from './load'
import type { CompanyInput } from './revenue'
import { classifySource, latestRunsBy, vantacaKindLabel, type SourceRuns, type SyncRunInput } from './sources'

export type QuickBooksCompanyStatus = {
  companyId: string
  slug: string
  name: string
  connected: boolean
  connectedAt: string | null
  connectedBy: string | null
  refreshExpiresAt: string | null
} & SourceRuns

export type IntegrationStatus = {
  checkedAt: string
  hubspot: { tokenConfigured: boolean; dealRows: number } & SourceRuns
  quickbooks: {
    appConfigured: boolean
    /** Runs not tied to one company (for example a run over all company files). */
    overall: SourceRuns
    companies: QuickBooksCompanyStatus[]
  }
  vantaca: { kinds: Array<{ source: string; label: string } & SourceRuns> }
  delivery: { discord: boolean; notion: boolean }
}

const EMPTY: SourceRuns = { lastRun: null, lastSuccess: null }

/** Pure assembly, separated from the loaders so it can be unit-tested. */
export function assembleIntegrationStatus(input: {
  runs: SyncRunInput[]
  companies: CompanyInput[]
  connections: Array<{ company_id: string; updated_at: string; refresh_expires_at: string | null; connected_by: string | null }>
  dealRows: number
  env: Record<string, string | undefined>
  now: Date
}): IntegrationStatus {
  const { runs, companies, connections, dealRows, env, now } = input
  const hubspot = latestRunsBy(runs, (r) => (classifySource(r.source) === 'hubspot' ? 'hubspot' : null)).get('hubspot') ?? EMPTY
  const qboByCompany = latestRunsBy(runs, (r) =>
    classifySource(r.source) === 'quickbooks' ? (r.company_id ?? '__all__') : null,
  )
  const vantaca = latestRunsBy(runs, (r) => (classifySource(r.source) === 'vantaca' ? r.source : null))

  return {
    checkedAt: now.toISOString(),
    hubspot: { tokenConfigured: Boolean(env.HUBSPOT_ACCESS_TOKEN), dealRows, ...hubspot },
    quickbooks: {
      appConfigured: Boolean(env.QUICKBOOKS_CLIENT_ID && env.QUICKBOOKS_CLIENT_SECRET && env.QUICKBOOKS_REDIRECT_URI),
      overall: qboByCompany.get('__all__') ?? EMPTY,
      companies: companies.map((c) => {
        const conn = connections.find((x) => x.company_id === c.id)
        return {
          companyId: c.id,
          slug: c.slug,
          name: c.name,
          connected: Boolean(conn),
          connectedAt: conn?.updated_at ?? null,
          connectedBy: conn?.connected_by ?? null,
          refreshExpiresAt: conn?.refresh_expires_at ?? null,
          ...(qboByCompany.get(c.id) ?? EMPTY),
        }
      }),
    },
    vantaca: {
      kinds: [...vantaca.entries()]
        .map(([source, r]) => ({ source, label: vantacaKindLabel(source), ...r }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
    delivery: {
      discord: Boolean(env.DISCORD_WEBHOOK_URL),
      notion: Boolean(env.NOTION_API_KEY && (env.NOTION_WORKSPACE_DATABASE_ID || env.NOTION_INTELLIGENCE_PAGE_ID)),
    },
  }
}

export async function loadIntegrationStatus(db: AdminClient, now = new Date()): Promise<IntegrationStatus> {
  const [runs, companies, connections, dealRows] = await Promise.all([
    loadRecentSyncRuns(db),
    loadCompanies(db),
    loadQboConnections(db),
    countDeals(db),
  ])
  return assembleIntegrationStatus({ runs, companies, connections, dealRows, env: process.env, now })
}
