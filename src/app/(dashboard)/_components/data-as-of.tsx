// "Data as of" line per source, from sync_runs, so stale data is never shown as current.

import Link from 'next/link'
import { formatDateTime } from '@/lib/intelligence/format'
import type { IntegrationStatus } from '@/lib/intelligence/integration-status'

function when(run: { finished_at: string | null; started_at: string } | null): string | null {
  return run ? formatDateTime(run.finished_at ?? run.started_at) : null
}

export function DataAsOf({ status }: { status: IntegrationStatus }) {
  const { hubspot, quickbooks, vantaca } = status
  const qboConnected = quickbooks.companies.filter((c) => c.connected).length
  const qboLatest = [quickbooks.overall.lastSuccess, ...quickbooks.companies.map((c) => c.lastSuccess)]
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => ((a.finished_at ?? a.started_at) < (b.finished_at ?? b.started_at) ? 1 : -1))[0]

  const items: Array<{ source: string; text: string }> = [
    {
      source: 'HubSpot',
      text: hubspot.lastSuccess
        ? `synced ${when(hubspot.lastSuccess)}`
        : hubspot.tokenConfigured
          ? 'token set, no successful sync yet'
          : 'not connected',
    },
    {
      source: 'QuickBooks',
      text:
        qboConnected === 0
          ? 'not connected'
          : `${qboConnected} of ${quickbooks.companies.length} companies connected${qboLatest ? `, last synced ${when(qboLatest)}` : ', no successful sync yet'}`,
    },
    ...(vantaca.kinds.length === 0
      ? [{ source: 'Vantaca', text: 'no imports yet' }]
      : vantaca.kinds.map((k) => ({
          source: `Vantaca ${k.label.toLowerCase()}`,
          text: k.lastSuccess ? `imported ${when(k.lastSuccess)}` : 'no successful import yet',
        }))),
  ]

  return (
    <div className="flex flex-col gap-1">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {items.map((i) => (
          <div key={i.source} className="flex gap-1.5">
            <dt className="text-foreground">{i.source}</dt>
            <dd>{i.text}</dd>
          </div>
        ))}
      </dl>
      <Link href="/admin/integrations" className="w-fit text-sm text-primary underline-offset-4 hover:underline">
        Manage data sources
      </Link>
    </div>
  )
}
