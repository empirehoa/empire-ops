import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/admin'
import { count, formatDateTime } from '@/lib/intelligence/format'
import { loadIntegrationStatus } from '@/lib/intelligence/integration-status'
import type { SourceRuns } from '@/lib/intelligence/sources'
import { createAdminClient } from '@/lib/supabase/admin'
import { SyncButton } from '../../_components/sync-button'
import { DataTable, Note, PageTitle, Panel, RunStatus, Section } from '../../_components/ui'

export const metadata = { title: 'Integrations | Empire Ops' }

function RunSummary({ runs, noun = 'sync' }: { runs: SourceRuns; noun?: string }) {
  const { lastRun, lastSuccess } = runs
  if (!lastRun) return <p className="text-sm text-muted-foreground">No {noun} has run yet.</p>
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Last {noun}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2">
        <RunStatus status={lastRun.status} />
        <span className="tabular-nums text-muted-foreground">{formatDateTime(lastRun.finished_at ?? lastRun.started_at)}</span>
      </dd>
      {lastRun.status === 'succeeded' ? (
        <>
          <dt className="text-muted-foreground">Rows written</dt>
          <dd className="tabular-nums text-foreground">{count(lastRun.rows_written)}</dd>
        </>
      ) : (
        <>
          <dt className="text-muted-foreground">Last success</dt>
          <dd className="tabular-nums text-foreground">{lastSuccess ? formatDateTime(lastSuccess.finished_at ?? lastSuccess.started_at) : 'Never'}</dd>
        </>
      )}
      {lastRun.status === 'failed' && lastRun.error && (
        <>
          <dt className="text-muted-foreground">Error</dt>
          <dd className="text-attention text-pretty">{lastRun.error}</dd>
        </>
      )}
    </dl>
  )
}

function Setting({ on, label }: { on: boolean; label: string }) {
  return (
    <p className="text-sm">
      <span className={on ? 'text-foreground' : 'text-muted-foreground'}>{label}: </span>
      <span className={on ? 'text-foreground font-medium' : 'text-muted-foreground'}>{on ? 'set' : 'not set'}</span>
    </p>
  )
}

export default async function IntegrationsPage() {
  await requireAdminPage()
  const status = await loadIntegrationStatus(createAdminClient())
  const { hubspot, quickbooks, vantaca, delivery } = status
  const qboConnected = quickbooks.companies.filter((c) => c.connected).length

  return (
    <div className="flex flex-col gap-12">
      <PageTitle title="Integrations">
        <p className="text-sm text-muted-foreground max-w-2xl text-pretty">
          Where each figure on the dashboards comes from, when it was last refreshed, and how to connect what is missing. Syncs also run daily at 06:00
          UTC before the agents.
        </p>
      </PageTitle>

      <Section title="HubSpot" description="Deals for the sales pipeline. Uses a private app token set in the deployment environment.">
        <Panel className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <Setting on={hubspot.tokenConfigured} label="HUBSPOT_ACCESS_TOKEN" />
            <p className="text-sm text-muted-foreground tabular-nums">{count(hubspot.dealRows)} deals stored</p>
            <RunSummary runs={hubspot} />
          </div>
          <SyncButton
            endpoint="/api/integrations/hubspot/sync"
            label="Sync HubSpot now"
            disabled={!hubspot.tokenConfigured}
            disabledReason="Set HUBSPOT_ACCESS_TOKEN in the deployment environment first."
          />
        </Panel>
      </Section>

      <Section
        title="QuickBooks Online"
        description={`Monthly P&L, balance sheet and AR aging per company file. ${qboConnected} of ${quickbooks.companies.length} companies connected.`}
        action={
          <SyncButton
            endpoint="/api/integrations/quickbooks/sync"
            label="Sync QuickBooks now"
            disabled={qboConnected === 0}
            disabledReason="Connect at least one company first."
          />
        }
      >
        {!quickbooks.appConfigured && (
          <Note>
            The QuickBooks app is not configured. Set QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET and QUICKBOOKS_REDIRECT_URI before connecting a
            company.
          </Note>
        )}
        <DataTable
          caption="QuickBooks connection per company"
          head={['Company', 'Connection', 'Last sync', '']}
          rows={quickbooks.companies.map((c) => [
            <span key="n" className="font-medium text-foreground">
              {c.name}
            </span>,
            c.connected ? (
              <span key="c" className="text-sm">
                Connected {formatDateTime(c.connectedAt)}
                {c.connectedBy && <span className="block text-xs text-muted-foreground">by {c.connectedBy}</span>}
              </span>
            ) : (
              <span key="c" className="text-sm text-muted-foreground">
                Not connected
              </span>
            ),
            <RunSummary key="r" runs={c.lastRun ? c : quickbooks.overall} />,
            quickbooks.appConfigured ? (
              <a
                key="a"
                href={`/api/integrations/quickbooks/connect?company=${encodeURIComponent(c.slug)}`}
                className="inline-flex whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-accent"
              >
                {c.connected ? 'Reconnect' : 'Connect'}
              </a>
            ) : (
              <span key="a" className="text-xs text-muted-foreground">
                App not configured
              </span>
            ),
          ])}
        />
        <Note>Connecting opens Intuit&apos;s sign-in for that company file. Tokens are stored encrypted and never shown here.</Note>
      </Section>

      <Section
        title="Vantaca"
        description="Community list, AR aging and action items arrive as uploaded CMP or IQ exports."
        action={
          <Link
            href="/admin/imports"
            className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            Upload an export
          </Link>
        }
      >
        {vantaca.kinds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Vantaca imports yet. Start with the community list, then AR aging and action items.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {vantaca.kinds.map((k) => (
              <Panel key={k.source} className="flex flex-col gap-3">
                <h3 className="text-base font-medium text-foreground">{k.label}</h3>
                <RunSummary runs={k} noun="import" />
              </Panel>
            ))}
          </div>
        )}
      </Section>

      <Section title="Delivery" description="Where the daily agents send their reports. Both are optional.">
        <Panel className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Setting on={delivery.discord} label="Discord (DISCORD_WEBHOOK_URL)" />
            <Setting on={delivery.notion} label="Notion (NOTION_API_KEY and a database or page ID)" />
          </div>
          <SyncButton
            endpoint="/api/admin/sync-notion"
            label="Publish Notion report now"
            disabled={!delivery.notion}
            disabledReason="Configure Notion first."
          />
        </Panel>
      </Section>
    </div>
  )
}
