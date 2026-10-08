import { requireAdminPage } from '@/lib/auth/admin'
import { count, pct, plural, usd } from '@/lib/intelligence/format'
import { loadIntegrationStatus } from '@/lib/intelligence/integration-status'
import { buildIntelligenceSnapshot, type IntelligenceSnapshot } from '@/lib/intelligence/snapshot'
import { createAdminClient } from '@/lib/supabase/admin'
import { DataAsOf } from '../../../_components/data-as-of'
import { DataTable, EmptyState, Note, PageTitle, ScaleBar, Section, Stat } from '../../../_components/ui'
import { FeePerDoorScatter } from './growth-charts'

export const metadata = { title: 'Growth | Empire Ops' }

export default async function GrowthPage() {
  await requireAdminPage()
  const db = createAdminClient()
  const now = new Date()
  const [snapshot, integrations] = await Promise.all([buildIntelligenceSnapshot(db, now), loadIntegrationStatus(db, now)])

  return (
    <div className="flex flex-col gap-12">
      <PageTitle title="Growth">
        <DataAsOf status={integrations} />
      </PageTitle>
      <Pricing snapshot={snapshot} />
      <ArConcentration snapshot={snapshot} />
      <CrossSell snapshot={snapshot} />
      <Workload snapshot={snapshot} />
    </div>
  )
}

// ─── Fee per door ───────────────────────────────────────────────────────────

function Pricing({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const p = snapshot.pricing
  if (!p) {
    return (
      <Section title="Fee per door">
        <EmptyState href="/admin/imports" linkLabel="Import the community list">
          No active association has both a door count and a monthly management fee. Import the Vantaca community list with those columns.
        </EmptyState>
      </Section>
    )
  }
  const bands = p.bands.filter((b) => b.count > 0)
  return (
    <Section title="Fee per door" description={p.label}>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Stat label="Portfolio, per door per month" size="lg" value={usd(p.weightedFeePerDoor, 2)} detail="Total fees / total doors" />
        <Stat label="Median association" size="lg" value={usd(p.medianFeePerDoor, 2)} />
        <Stat label="Associations counted" value={count(p.communityCount)} detail={`${count(p.totalDoors)} doors`} />
        <Stat label="Monthly fees counted" value={usd(p.totalMonthlyFees)} />
      </div>
      <FeePerDoorScatter points={p.points} />
      <DataTable
        caption="Fee per door by size band"
        head={['Size band', 'Associations', 'Doors', '25th pct', 'Median', '75th pct', 'Weighted']}
        align={['left', 'right', 'right', 'right', 'right', 'right', 'right']}
        rows={bands.map((b) => [
          b.label,
          count(b.count),
          count(b.doors),
          usd(b.p25, 2),
          usd(b.median, 2),
          usd(b.p75, 2),
          usd(b.weightedFeePerDoor, 2),
        ])}
      />
      {p.lowestQuartile.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">Below their size band&apos;s 25th percentile</h3>
          <DataTable
            caption="Associations below their size band's 25th percentile"
            head={['Association', 'Manager', 'Doors', 'Per door', 'Band 25th pct']}
            align={['left', 'left', 'right', 'right', 'right']}
            rows={p.lowestQuartile.slice(0, 12).map((x) => [x.name, x.manager ?? 'No manager listed', count(x.doors), usd(x.feePerDoor, 2), usd(x.bandP25, 2)])}
          />
          <Note>A prompt to review the contract terms, not a pricing recommendation. Bands with fewer than 4 associations are not compared.</Note>
        </div>
      )}
      {(p.missingFee > 0 || p.missingDoors > 0) && (
        <Note>
          Not included: {plural(p.missingFee, 'association')} with no monthly fee and {plural(p.missingDoors, 'association')} with no door count in the
          Vantaca community list.
        </Note>
      )}
    </Section>
  )
}

// ─── AR concentration ───────────────────────────────────────────────────────

function ArConcentration({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const ar = snapshot.ar
  if (!ar) {
    return (
      <Section title="AR concentration">
        <EmptyState href="/admin/imports" linkLabel="Import AR aging">
          No Vantaca AR aging imported yet.
        </EmptyState>
      </Section>
    )
  }
  const maxShare = ar.topByTotal[0]?.shareOfPortfolio ?? 0
  return (
    <Section
      title="AR concentration"
      description={`Top 5 associations hold ${pct(ar.concentration.top5Share)} of homeowner AR and the top 10 hold ${pct(ar.concentration.top10Share)}, across ${plural(ar.communityCount, 'association')}.`}
    >
      <DataTable
        caption="Associations by homeowner AR"
        head={['Association', 'Homeowner AR', 'Share of portfolio', '', '90+ days']}
        align={['left', 'right', 'right', 'left', 'right']}
        rows={ar.topByTotal.map((l) => [
          l.name,
          usd(l.total),
          pct(l.shareOfPortfolio, 1),
          <div key="bar" className="w-32 sm:w-48">
            <ScaleBar value={l.shareOfPortfolio ?? 0} max={maxShare} label={`${l.name}: ${pct(l.shareOfPortfolio, 1)} of portfolio AR`} />
          </div>,
          usd(l.days90Plus),
        ])}
      />
      <Note>Bars are scaled to the largest association. Balances are owed to each association by its owners; each association is a separate client.</Note>
    </Section>
  )
}

// ─── Cross-sell ─────────────────────────────────────────────────────────────

function CrossSell({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const cs = snapshot.crossSell
  if (!cs) {
    return (
      <Section title="Cross-sell matches">
        <EmptyState href="/admin/imports" linkLabel="Import action items">
          {snapshot.sources.actionItems ? 'Import the Vantaca community list so action items can be tied to associations.' : 'No Vantaca action items imported yet.'}
        </EmptyState>
      </Section>
    )
  }
  return (
    <Section
      title="Cross-sell matches"
      description={`Action items open or opened in the last ${cs.windowDays} days whose category or type mentions sister-company work. Leads for a conversation, not revenue estimates.`}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cs.byCompany.map((c) => (
          <Stat key={c.company} label={c.companyName} value={count(c.matches)} detail={plural(c.communities, 'association')} />
        ))}
      </div>
      {cs.byCommunity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No action items matched the keyword rules.</p>
      ) : (
        <DataTable
          caption="Cross-sell matches by association"
          head={['Association', 'Company', 'Items', 'Matched words', 'Examples']}
          align={['left', 'left', 'right', 'left', 'left']}
          rows={cs.byCommunity.slice(0, 20).map((m) => [
            <span key="n" className="text-foreground">
              {m.name}
              <span className="block text-xs text-muted-foreground">{m.manager ?? 'No manager listed'}</span>
            </span>,
            m.companyName,
            <span key="c">
              {count(m.count)}
              <span className="block text-xs text-muted-foreground">{count(m.openCount)} open</span>
            </span>,
            m.keywords.join(', '),
            <span key="e" className="text-xs text-muted-foreground">
              {m.samples.map((s) => `${s.xn} ${[s.category, s.itemType].filter(Boolean).join(' / ')}`).join('; ')}
            </span>,
          ])}
        />
      )}
      <Note>
        Keywords: water, leak, mold, flood, fire, storm for Wind Fire &amp; Water; repair, maintenance, handyman, landscape, paint, pressure wash
        for FixIQ; sale, resale, estoppel, closing for Riance Realty. One item can match more than one company.
      </Note>
    </Section>
  )
}

// ─── Manager workload ───────────────────────────────────────────────────────

function Workload({ snapshot }: { snapshot: IntelligenceSnapshot }) {
  const w = snapshot.workload
  if (!w) {
    return (
      <Section title="Manager workload">
        <EmptyState href="/admin/imports" linkLabel="Import the community list">
          No Vantaca community list imported yet.
        </EmptyState>
      </Section>
    )
  }
  const maxDoors = Math.max(0, ...w.map((r) => r.doors))
  const missingDoors = w.reduce((s, r) => s + r.communitiesMissingDoors, 0)
  return (
    <Section
      title="Manager workload"
      description="Active associations per manager from the Vantaca community list, with open action items and 90+ homeowner AR."
    >
      <DataTable
        caption="Manager workload"
        head={['Manager', 'Associations', 'Doors', '', 'Open items', '60+ days', '90+ AR']}
        align={['left', 'right', 'right', 'left', 'right', 'right', 'right']}
        rows={w.map((r) => [
          r.manager,
          count(r.communities),
          count(r.doors),
          <div key="bar" className="w-24 sm:w-40">
            <ScaleBar value={r.doors} max={maxDoors} label={`${r.manager}: ${count(r.doors)} doors`} />
          </div>,
          snapshot.sources.actionItems ? count(r.openItems) : 'n/a',
          snapshot.sources.actionItems ? count(r.agedItems) : 'n/a',
          snapshot.sources.arSnapshots ? usd(r.ar90Plus) : 'n/a',
        ])}
      />
      {missingDoors > 0 && <Note>{plural(missingDoors, 'association')} without a door count in Vantaca {missingDoors === 1 ? 'is' : 'are'} counted in associations but not doors.</Note>}
      {!snapshot.sources.actionItems && <Note>Open item counts need a Vantaca action item import.</Note>}
    </Section>
  )
}
