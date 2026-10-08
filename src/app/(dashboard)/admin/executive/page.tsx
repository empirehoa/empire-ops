import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/admin'
import { AGENTS, agentLabel } from '@/lib/intelligence/agents'
import { count, formatDateTime, formatDay, formatMonth, pct, plural, usd, usdCompact } from '@/lib/intelligence/format'
import { loadIntegrationStatus } from '@/lib/intelligence/integration-status'
import { loadLatestAgentRuns } from '@/lib/intelligence/load'
import { STALE_DEAL_DAYS } from '@/lib/intelligence/pipeline'
import { buildIntelligenceSnapshot, type IntelligenceSnapshot } from '@/lib/intelligence/snapshot'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'
import { DataAsOf } from '../../_components/data-as-of'
import { DataTable, EmptyState, Note, PageTitle, Panel, RunStatus, ScaleBar, Section, Stat } from '../../_components/ui'
import { RevenueBars } from './executive-charts'

export const metadata = { title: 'Executive overview | Empire Ops' }

export default async function ExecutivePage() {
  await requireAdminPage()
  const db = createAdminClient()
  const now = new Date()
  const [snapshot, agentRuns, integrations] = await Promise.all([
    buildIntelligenceSnapshot(db, now),
    loadLatestAgentRuns(db),
    loadIntegrationStatus(db, now),
  ])

  return (
    <div className="flex flex-col gap-12">
      <PageTitle title="Executive overview">
        <DataAsOf status={integrations} />
      </PageTitle>
      <CompanyRevenue snapshot={snapshot} />
      <Pipeline snapshot={snapshot} />
      <ArAndAging snapshot={snapshot} />
      <RetentionRisks snapshot={snapshot} />
      <AgentHeadlines runs={agentRuns} />
    </div>
  )
}

// ─── Company revenue (QuickBooks) ───────────────────────────────────────────

function CompanyRevenue({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const { window, companies } = snapshot.revenue
  const connected = new Set(snapshot.sources.qboConnectedCompanyIds)
  const withData = companies.filter((c) => c.hasData)
  const incomes = withData.flatMap((c) => c.monthly.map((m) => m.income ?? 0))
  const domainMax = Math.max(0, ...incomes)
  const domainMin = Math.min(0, ...incomes)
  const period = `${formatMonth(window.months[0])} to ${formatMonth(window.months[window.months.length - 1])}`

  return (
    <Section
      title="Company revenue"
      description={`Trailing 12 complete months (${period}) from QuickBooks monthly P&L. Bars share one scale across companies.`}
    >
      {withData.length >= 2 && (
        <p className="text-sm text-muted-foreground tabular-nums">
          {withData.length} companies with QuickBooks data:{' '}
          <span className="text-foreground">{usd(withData.reduce((s, c) => s + (c.revenue ?? 0), 0))}</span> revenue,{' '}
          <span className="text-foreground">{usd(withData.reduce((s, c) => s + (c.netIncome ?? 0), 0))}</span> net income.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {companies.map((c) => (
          <Panel key={c.companyId} className="flex flex-col gap-4">
            <h3 className="text-base font-medium text-foreground">{c.name}</h3>
            {c.hasData ? (
              <>
                <div className="flex flex-wrap gap-x-10 gap-y-4">
                  <Stat label="Revenue" size="lg" value={usdCompact(c.revenue)} detail={usd(c.revenue)} />
                  <Stat
                    label="Net income"
                    size="lg"
                    value={usdCompact(c.netIncome)}
                    detail={usd(c.netIncome)}
                    tone={(c.netIncome ?? 0) < 0 ? 'attention' : 'default'}
                  />
                </div>
                <RevenueBars data={c.monthly} domainMax={domainMax} domainMin={domainMin} />
                <Note>
                  {c.monthsCovered < c.monthsExpected
                    ? `${c.monthsCovered} of ${c.monthsExpected} months synced. Missing months are left out, not estimated.`
                    : `All ${c.monthsExpected} months synced.`}{' '}
                  Last fetched {formatDateTime(c.latestFetchedAt)}.
                </Note>
              </>
            ) : connected.has(c.companyId) ? (
              <EmptyState href="/admin/integrations" linkLabel="Run a QuickBooks sync">
                QuickBooks is connected but no monthly P&L has been synced for {period}.
              </EmptyState>
            ) : (
              <EmptyState href="/admin/integrations" linkLabel="Connect QuickBooks">
                QuickBooks not connected.
              </EmptyState>
            )}
          </Panel>
        ))}
      </div>
    </Section>
  )
}

// ─── Pipeline (HubSpot) ─────────────────────────────────────────────────────

function Pipeline({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const p = snapshot.pipeline
  if (!p) {
    return (
      <Section title="Sales pipeline">
        <EmptyState href="/admin/integrations" linkLabel="Set up HubSpot">
          No HubSpot deals yet. Set HUBSPOT_ACCESS_TOKEN, then run a HubSpot sync.
        </EmptyState>
      </Section>
    )
  }
  const stageMax = Math.max(0, ...p.byStage.map((s) => s.value))
  const wr = p.winRate
  return (
    <Section title="Sales pipeline" description="New management contracts in HubSpot. Weighted value is amount times the stage probability set in HubSpot.">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Stat label="Open pipeline" size="lg" value={usdCompact(p.openValue)} detail={plural(p.openCount, 'open deal')} />
        <Stat label="Weighted" size="lg" value={usdCompact(p.weightedValue)} detail={usd(p.weightedValue)} />
        <Stat
          label={`No update in ${STALE_DEAL_DAYS}+ days`}
          value={count(p.staleCount)}
          detail={`${usd(p.staleValue)} open value`}
        />
        <Stat
          label="Win rate, trailing 365 days"
          value={wr.closedCount === 0 ? 'n/a' : pct(wr.byCount)}
          detail={wr.closedCount === 0 ? 'No deals closed' : `${pct(wr.byValue)} of dollars, ${plural(wr.closedCount, 'closed deal')}`}
        />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Open value by stage</h3>
          <ul className="flex flex-col gap-3">
            {p.byStage.map((s) => (
              <li key={s.stage} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-foreground">{s.stage}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {usd(s.value)} <span className="text-xs">({plural(s.count, 'deal')})</span>
                  </span>
                </div>
                <ScaleBar value={s.value} max={stageMax} label={`${s.stage}: ${usd(s.value)}`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Largest stale deals</h3>
          {p.staleDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every open deal was updated in the last {STALE_DEAL_DAYS} days.</p>
          ) : (
            <DataTable
              caption="Largest stale deals"
              head={['Deal', 'Owner', 'Amount', 'Days']}
              align={['left', 'left', 'right', 'right']}
              rows={p.staleDeals.slice(0, 6).map((d) => [
                <span key="n" className="text-foreground">
                  {d.name}
                  <span className="block text-xs text-muted-foreground">{d.stage}</span>
                </span>,
                d.owner ?? 'Unassigned',
                usd(d.amount),
                count(d.daysSinceUpdate),
              ])}
            />
          )}
        </div>
      </div>
      {(p.openMissingAmount > 0 || p.openMissingProbability > 0) && (
        <Note>
          {p.openMissingAmount > 0 && `${plural(p.openMissingAmount, 'open deal')} without an amount ${p.openMissingAmount === 1 ? 'is' : 'are'} not in the pipeline value. `}
          {p.openMissingProbability > 0 && `${plural(p.openMissingProbability, 'open deal')} without a stage probability ${p.openMissingProbability === 1 ? 'is' : 'are'} not in the weighted value.`}
        </Note>
      )}
    </Section>
  )
}

// ─── AR and action items (Vantaca) ──────────────────────────────────────────

function ArAndAging({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const { ar, aging } = snapshot
  const buckets = ar
    ? [
        { label: 'Current', value: ar.current },
        { label: '30 days', value: ar.days30 },
        { label: '60 days', value: ar.days60 },
        { label: '90+ days', value: ar.days90Plus, alert: true },
      ]
    : []
  const bucketTotal = buckets.reduce((s, b) => s + Math.max(0, b.value), 0)

  return (
    <Section title="Homeowner AR and aging" description="Balances owed to the associations by their owners, and open Vantaca action items. Not EMG revenue.">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {!ar ? (
            <EmptyState href="/admin/imports" linkLabel="Import AR aging">
              No Vantaca AR aging imported yet.
            </EmptyState>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <Stat label="Homeowner AR" size="lg" value={usdCompact(ar.total)} detail={`${plural(ar.communityCount, 'association')}`} />
                <Stat label="90+ days" size="lg" value={pct(ar.share90Plus)} detail={usd(ar.days90Plus)} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="AR by aging bucket">
                  {buckets.map((b, i) => (
                    <div
                      key={b.label}
                      className={cn(b.alert ? 'bg-attention' : 'bg-foreground')}
                      style={{
                        width: `${bucketTotal > 0 ? (Math.max(0, b.value) / bucketTotal) * 100 : 0}%`,
                        opacity: b.alert ? 1 : 0.85 - i * 0.22,
                      }}
                    />
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  {buckets.map((b) => (
                    <div key={b.label} className="flex flex-col">
                      <dt className="text-muted-foreground">{b.label}</dt>
                      <dd className={cn('tabular-nums', b.alert ? 'text-attention' : 'text-foreground')}>{usd(b.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {ar.topBy90Plus.length > 0 && (
                <DataTable
                  caption="Associations with the most 90+ AR"
                  head={['Association', '90+ days', 'Share of its AR']}
                  align={['left', 'right', 'right']}
                  rows={ar.topBy90Plus.slice(0, 5).map((l) => [l.name, usd(l.days90Plus), pct(l.share90Plus)])}
                />
              )}
              <Note>
                Latest snapshot per association, dated {formatDay(ar.asOfMin)}
                {ar.asOfMin !== ar.asOfMax ? ` to ${formatDay(ar.asOfMax)}` : ''}. Test associations are excluded.
              </Note>
            </>
          )}
        </div>
        <div className="flex flex-col gap-5">
          {!aging ? (
            <EmptyState href="/admin/imports" linkLabel="Import action items">
              No Vantaca action items imported yet.
            </EmptyState>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <Stat label="Open action items" size="lg" value={count(aging.openCount)} />
                <Stat label={`Open ${aging.agedThresholdDays}+ days`} size="lg" value={count(aging.agedCount)} detail={`${pct(aging.openCount ? aging.agedCount / aging.openCount : null)} of open items`} />
              </div>
              {aging.byCategory.length > 0 && (
                <DataTable
                  caption="Open action items by category"
                  head={['Category', 'Open', `${aging.agedThresholdDays}+ days`]}
                  align={['left', 'right', 'right']}
                  rows={aging.byCategory.slice(0, 6).map((c) => [c.category, count(c.open), count(c.aged)])}
                />
              )}
              {(aging.excludedOpenCount > 0 || aging.unknownAgeCount > 0) && (
                <Note>
                  {aging.excludedOpenCount > 0 &&
                    `${plural(aging.excludedOpenCount, 'open item')} with no matching portfolio association ${aging.excludedOpenCount === 1 ? 'is' : 'are'} excluded. `}
                  {aging.unknownAgeCount > 0 && `${plural(aging.unknownAgeCount, 'open item')} ${aging.unknownAgeCount === 1 ? 'has' : 'have'} no opened date.`}
                </Note>
              )}
            </>
          )}
        </div>
      </div>
    </Section>
  )
}

// ─── Retention risk ─────────────────────────────────────────────────────────

function RetentionRisks({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const r = snapshot.retention
  if (!r) {
    return (
      <Section title="Retention risk">
        <EmptyState href="/admin/imports" linkLabel="Go to Imports">
          {snapshot.sources.communities === 0
            ? 'No Vantaca community list imported yet.'
            : 'Import Vantaca AR aging or action items to score associations.'}
        </EmptyState>
      </Section>
    )
  }
  const flagged = r.scored.filter((s) => s.score > 0).slice(0, 8)
  return (
    <Section title="Retention risk" description={r.method}>
      {flagged.length === 0 ? (
        <p className="text-sm text-muted-foreground">No association triggered a risk signal across {plural(r.scored.length, 'scored association')}.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {flagged.map((risk) => (
            <li key={risk.communityId} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-6">
              <div className="flex min-w-48 flex-col gap-0.5">
                <span className="font-medium text-foreground">{risk.name}</span>
                <span className="text-sm text-muted-foreground">{risk.manager ?? 'No manager listed'}</span>
              </div>
              <div className="flex min-w-24 flex-col gap-0.5">
                <span className={cn('text-xl font-medium tabular-nums leading-none', risk.band === 'elevated' ? 'text-attention' : 'text-foreground')}>
                  {risk.score}
                </span>
                <span className="text-xs text-muted-foreground">{risk.band === 'elevated' ? 'Elevated' : risk.band === 'watch' ? 'Watch' : 'Low'}, of 100</span>
              </div>
              <ul className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
                {risk.signals
                  .filter((s) => s.points > 0)
                  .map((s) => (
                    <li key={s.key} className="text-pretty">
                      <span className="tabular-nums text-foreground">+{s.points}</span> {s.explanation}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {r.unscoredCount > 0 && <Note>{plural(r.unscoredCount, 'active association')} had no AR aging or action-item data and were not scored.</Note>}
    </Section>
  )
}

// ─── Agents ─────────────────────────────────────────────────────────────────

function AgentHeadlines({ runs }: { runs: Awaited<ReturnType<typeof loadLatestAgentRuns>> }) {
  const byAgent = new Map(runs.map((r) => [r.agent, r]))
  return (
    <Section
      title="Agent headlines"
      description="Latest run of each daily agent. Agents skip, and say which source to connect, when their data is missing."
    >
      <DataTable
        caption="Agent headlines"
        head={['Agent', 'Status', 'Headline', 'Last run']}
        rows={AGENTS.map((a) => {
          const r = byAgent.get(a.key)
          return [
            <span key="a" className="whitespace-nowrap text-foreground">{agentLabel(a.key)}</span>,
            <RunStatus key="s" status={r?.status} />,
            <span key="h" className="block max-w-2xl text-pretty text-muted-foreground">
              {r ? (r.headline ?? r.error ?? 'No headline recorded.') : `Not run yet. Uses ${a.sources}.`}
            </span>,
            <span key="t" className="whitespace-nowrap text-muted-foreground tabular-nums">{r ? formatDateTime(r.started_at) : 'n/a'}</span>,
          ]
        })}
      />
      <Link href="/admin/executive/growth" className="w-fit text-sm text-primary underline-offset-4 hover:underline">
        Pricing, cross-sell and workload on the Growth page
      </Link>
    </Section>
  )
}
