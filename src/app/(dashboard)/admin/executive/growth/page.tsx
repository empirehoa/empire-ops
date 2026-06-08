export const revalidate = 300

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils/format'
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  Lightbulb,
  BarChart3,
  Target,
  Clock,
} from 'lucide-react'
import {
  RevenueConcentrationChart,
  PricingScatterChart,
  AgingChart,
  ManagerWorkloadChart,
} from './growth-charts'
import type {
  RevenueConcentrationItem,
  PricingScatterPoint,
  AgingBucket,
  ManagerWorkload,
} from './growth-charts'

// ─── Types ──────────────────────────────────────────────────────────────────

type DelinquentCommunity = {
  name: string
  totalCharged: number
  totalOverdue: number
  rate: number
  unitCount: number | null
}

type MarketOpportunity = {
  market: string
  estimatedDoors: number
  competitionDensity: 'Low' | 'Medium' | 'High'
  nearestOffice: string
  driveTime: string
  notes: string
}

type NewRevenueStream = {
  service: string
  estimatedRevenue: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  competition: string
  description: string
}

// ─── Industry Benchmarks ────────────────────────────────────────────────────
// TODO: Replace with real competitive data from Competitive Intel agent

const INDUSTRY_BENCHMARKS = [
  { name: 'CINC Systems', low: 15, high: 25 },
  { name: 'AppFolio', low: 12, high: 20 },
  { name: 'FirstService', low: 18, high: 30 },
  { name: 'Associa', low: 16, high: 28 },
]

// TODO: Replace with real market data from market research
const EXPANSION_MARKETS: MarketOpportunity[] = [
  { market: 'Naples / Collier County', estimatedDoors: 45_000, competitionDensity: 'Medium', nearestOffice: 'Tampa', driveTime: '3.5 hrs', notes: 'High-value condos, retiree demographic' },
  { market: 'Sarasota / Manatee', estimatedDoors: 38_000, competitionDensity: 'Medium', nearestOffice: 'Tampa', driveTime: '1.5 hrs', notes: 'Rapid growth, new developments' },
  { market: 'Fort Myers / Lee County', estimatedDoors: 52_000, competitionDensity: 'Low', nearestOffice: 'Tampa', driveTime: '3 hrs', notes: 'Post-hurricane rebuild, high demand' },
  { market: 'Palm Beach County', estimatedDoors: 85_000, competitionDensity: 'High', nearestOffice: 'Maitland', driveTime: '3.5 hrs', notes: 'Largest FL market, premium fees' },
  { market: 'Broward County', estimatedDoors: 72_000, competitionDensity: 'High', nearestOffice: 'Maitland', driveTime: '4 hrs', notes: 'Dense condo market, bilingual needed' },
  { market: 'St. Petersburg / Pinellas', estimatedDoors: 35_000, competitionDensity: 'Low', nearestOffice: 'Tampa', driveTime: '0.5 hrs', notes: 'Adjacent to Tampa office, easy expansion' },
  { market: 'Daytona / Volusia', estimatedDoors: 22_000, competitionDensity: 'Low', nearestOffice: 'Maitland', driveTime: '1 hr', notes: 'Underserved, growing market' },
  { market: 'Gainesville / Alachua', estimatedDoors: 12_000, competitionDensity: 'Low', nearestOffice: 'Jacksonville', driveTime: '1.5 hrs', notes: 'University town, student housing HOAs' },
]

const NEW_REVENUE_STREAMS: NewRevenueStream[] = [
  { service: 'Pool Management Oversight', estimatedRevenue: '$3-5/door/mo', difficulty: 'Easy', competition: 'Low in-house', description: 'Manage pool vendors, compliance, chemical testing for communities' },
  { service: 'Landscaping Contract Management', estimatedRevenue: '$2-4/door/mo', difficulty: 'Easy', competition: 'Low', description: 'Bid management, quality inspection, vendor coordination for grounds' },
  { service: 'Insurance Brokering', estimatedRevenue: '$50-100/policy', difficulty: 'Medium', competition: 'Medium', description: 'Partner with carriers for master policy placement, earn commissions' },
  { service: 'Reserve Study Consulting', estimatedRevenue: '$3K-8K/study', difficulty: 'Medium', competition: 'High', description: 'In-house reserve studies — FL SB 4D compliance creates massive demand' },
  { service: 'HOA Website Hosting', estimatedRevenue: '$50-150/site/mo', difficulty: 'Easy', competition: 'Medium', description: 'Custom community websites via Vera — already built, just needs packaging' },
  { service: 'Document Scanning & Archive', estimatedRevenue: '$500-2K/community', difficulty: 'Easy', competition: 'Low', description: 'Digitize legacy paper records into Vera document management' },
  { service: 'Bulk Purchasing Programs', estimatedRevenue: '2-5% rebate', difficulty: 'Hard', competition: 'Low', description: 'Negotiate volume discounts on insurance, utilities, maintenance across 255 communities' },
  { service: 'Transition/Turnover Services', estimatedRevenue: '$5K-15K/community', difficulty: 'Medium', competition: 'Medium', description: 'Help developer-to-owner transitions — document audits, election support, reserve analysis' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-[#1C74AC]" />
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
  )
}

function difficultyColor(d: string): string {
  if (d === 'Easy') return 'bg-green-100 text-green-700 border-green-200'
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function competitionColor(c: string): string {
  if (c === 'Low') return 'text-green-600'
  if (c === 'Medium') return 'text-yellow-600'
  return 'text-red-600'
}

// ─── Data Fetcher ───────────────────────────────────────────────────────────

async function getGrowthData(tenantId: string) {
  const supabase = await createClient()
  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  const threeMonthsAgo = new Date(today)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const [assocResult, chargesResult, managersResult, contractsResult] = await Promise.all([
    supabase
      .from('associations')
      .select('id, name, unit_count, city, county')
      .eq('tenant_id', tenantId)
      .eq('status', 'active'),
    supabase
      .from('charges')
      .select('id, association_id, amount, amount_paid, balance_due, due_date, status')
      .eq('tenant_id', tenantId)
      .neq('status', 'voided')
      .gte('charge_date', yearStart),
    supabase
      .from('manager_performance_metrics')
      .select('user_id, communities_managed, total_doors, manager:user_profiles(full_name)')
      .eq('tenant_id', tenantId)
      .order('total_doors', { ascending: false })
      .limit(20),
    supabase
      .from('contracts')
      .select('id, association_id, monthly_fee, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active'),
  ])

  const associations = assocResult.data ?? []
  const charges = chargesResult.data ?? []
  const managers = managersResult.data ?? []
  const contracts = contractsResult.data ?? []

  // Revenue concentration — total charges per association
  const revenueByAssoc: Record<string, { name: string; revenue: number }> = {}
  for (const c of charges) {
    const id = c.association_id as string
    if (!id) continue
    if (!revenueByAssoc[id]) {
      const assoc = associations.find((a) => a.id === id)
      revenueByAssoc[id] = { name: assoc?.name ?? 'Unknown', revenue: 0 }
    }
    revenueByAssoc[id].revenue += c.amount ?? 0
  }
  const totalRevenue = Object.values(revenueByAssoc).reduce((s, v) => s + v.revenue, 0)
  const concentration: RevenueConcentrationItem[] = Object.values(revenueByAssoc)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((v) => ({
      name: v.name.length > 25 ? v.name.slice(0, 22) + '...' : v.name,
      revenue: v.revenue,
      percentage: totalRevenue > 0 ? Math.round((v.revenue / totalRevenue) * 10000) / 100 : 0,
    }))

  // Pricing scatter — fee per door per community
  const assocMap = new Map(associations.map((a) => [a.id, a]))
  const pricing: PricingScatterPoint[] = contracts
    .filter((c) => c.monthly_fee && c.association_id)
    .map((c) => {
      const assoc = assocMap.get(c.association_id as string)
      const units = assoc?.unit_count ?? 1
      const feePerDoor = Math.round(((c.monthly_fee as number) / units) * 100) / 100
      return {
        name: assoc?.name ?? 'Unknown',
        unitCount: units,
        feePerDoor,
        monthlyFee: c.monthly_fee as number,
      }
    })
    .filter((p) => p.feePerDoor > 0 && p.feePerDoor < 100)

  // AR aging buckets
  const now = today.getTime()
  const buckets = { current: 0, thirty: 0, sixty: 0, ninety: 0 }
  const bucketCounts = { current: 0, thirty: 0, sixty: 0, ninety: 0 }
  for (const c of charges) {
    const overdue = (c.balance_due ?? 0)
    if (overdue <= 0) continue
    const dueDate = new Date(c.due_date).getTime()
    const daysOverdue = Math.floor((now - dueDate) / 86400000)
    if (daysOverdue <= 0) { buckets.current += overdue; bucketCounts.current++ }
    else if (daysOverdue <= 30) { buckets.thirty += overdue; bucketCounts.thirty++ }
    else if (daysOverdue <= 60) { buckets.sixty += overdue; bucketCounts.sixty++ }
    else { buckets.ninety += overdue; bucketCounts.ninety++ }
  }
  const aging: AgingBucket[] = [
    { bucket: 'Current', amount: buckets.current, count: bucketCounts.current, color: '#10b981' },
    { bucket: '1-30 Days', amount: buckets.thirty, count: bucketCounts.thirty, color: '#f59e0b' },
    { bucket: '31-60 Days', amount: buckets.sixty, count: bucketCounts.sixty, color: '#f97316' },
    { bucket: '90+ Days', amount: buckets.ninety, count: bucketCounts.ninety, color: '#ef4444' },
  ]

  // Top delinquent communities
  const delinquencyByAssoc: Record<string, { charged: number; overdue: number }> = {}
  for (const c of charges) {
    const id = c.association_id as string
    if (!id) continue
    if (!delinquencyByAssoc[id]) delinquencyByAssoc[id] = { charged: 0, overdue: 0 }
    delinquencyByAssoc[id].charged += c.amount ?? 0
    if ((c.balance_due ?? 0) > 0) delinquencyByAssoc[id].overdue += c.balance_due ?? 0
  }
  const delinquent: DelinquentCommunity[] = Object.entries(delinquencyByAssoc)
    .map(([id, d]) => {
      const assoc = assocMap.get(id)
      return {
        name: assoc?.name ?? 'Unknown',
        totalCharged: d.charged,
        totalOverdue: d.overdue,
        rate: d.charged > 0 ? Math.round((d.overdue / d.charged) * 10000) / 100 : 0,
        unitCount: assoc?.unit_count ?? null,
      }
    })
    .filter((d) => d.totalOverdue > 0)
    .sort((a, b) => b.totalOverdue - a.totalOverdue)
    .slice(0, 10)

  // Manager workload
  type ManagerRow = { user_id: string; communities_managed: number | null; total_doors: number | null; manager: { full_name: string | null } | null }
  const workload: ManagerWorkload[] = (managers as ManagerRow[])
    .filter((m) => m.manager?.full_name)
    .map((m) => ({
      name: (m.manager?.full_name ?? 'Unknown').split(' ').slice(0, 2).join(' '),
      communities: m.communities_managed ?? 0,
      doors: m.total_doors ?? 0,
    }))

  // Average fee per door
  const validPricing = pricing.filter((p) => p.feePerDoor > 0)
  const avgFeePerDoor = validPricing.length > 0
    ? Math.round(validPricing.reduce((s, p) => s + p.feePerDoor, 0) / validPricing.length * 100) / 100
    : 0

  return {
    concentration,
    totalRevenue,
    pricing,
    avgFeePerDoor,
    aging,
    delinquent,
    workload,
    totalAssociations: associations.length,
    totalDoors: associations.reduce((s, a) => s + (a.unit_count ?? 0), 0),
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function GrowthAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'tenant_admin')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-gray-500">Growth analysis requires admin role.</p>
        </div>
      </div>
    )
  }

  const data = await getGrowthData(profile.tenant_id)

  // Check concentration risk: warn if top community is >5% of revenue
  const topConcentration = data.concentration[0]?.percentage ?? 0
  const concentrationRisk = topConcentration > 5

  return (
    <div className="space-y-8">
      <PageHeader
        title="Growth & Cash Flow Opportunities"
        subtitle="Revenue analysis, pricing benchmarks, expansion targets, and new revenue streams"
        backHref="/admin/executive"
        backLabel="Executive Intel"
      />

      {/* ── Revenue Concentration Risk ──────────────────────────────────── */}
      <section>
        <SectionHeader title="Revenue Concentration Risk" icon={BarChart3} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueConcentrationChart data={data.concentration} />
          </div>
          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Top Community Share</p>
                <p className={`text-3xl font-semibold tabular-nums ${concentrationRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                  {topConcentration}%
                </p>
                {concentrationRisk && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-red-600">High concentration — diversify revenue sources</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Portfolio Revenue (YTD)</p>
                <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(data.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.totalAssociations} communities | {data.totalDoors.toLocaleString()} doors
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Pricing Analysis ────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Pricing Analysis vs. Industry" icon={Target} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PricingScatterChart data={data.pricing} avgFeePerDoor={data.avgFeePerDoor} />
          </div>
          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Fee Per Door</p>
                <p className="text-3xl font-semibold tabular-nums text-[#1C74AC]">
                  ${data.avgFeePerDoor.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">per unit per month</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Industry Benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {INDUSTRY_BENCHMARKS.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{b.name}</span>
                    <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                      ${b.low}-${b.high}/door
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── AR Aging & Collections ──────────────────────────────────────── */}
      <section>
        <SectionHeader title="AR Aging & Collections" icon={DollarSign} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AgingChart data={data.aging} />
          </div>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aging Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.aging.map((b) => (
                <div key={b.bucket} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{b.bucket}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(b.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{b.count} charges</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="text-sm font-semibold">Total Overdue</span>
                <span className="text-sm font-semibold tabular-nums text-red-600">
                  {formatCurrency(data.aging.reduce((s, b) => s + b.amount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top delinquent communities */}
        {data.delinquent.length > 0 && (
          <Card className="mt-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top 10 Delinquent Communities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Charged</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.delinquent.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.unitCount ?? '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(d.totalCharged)}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">{formatCurrency(d.totalOverdue)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={d.rate > 20 ? 'border-red-200 text-red-700 bg-red-50' : d.rate > 10 ? 'border-yellow-200 text-yellow-700 bg-yellow-50' : ''}>
                          {d.rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Expansion Opportunities ─────────────────────────────────────── */}
      <section>
        <SectionHeader title="Florida Expansion Opportunities" icon={MapPin} />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Current offices: Maitland, Kissimmee, Clermont, Tampa, Jacksonville (+ 4 more).
          Markets ranked by proximity and competition gap.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EXPANSION_MARKETS.map((m) => (
            <Card key={m.market} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.market}</p>
                  <Badge variant="outline" className={`text-xs ${competitionColor(m.competitionDensity)}`}>
                    {m.competitionDensity}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">{m.estimatedDoors.toLocaleString()}</span> est. doors</p>
                  <p>Nearest: {m.nearestOffice} ({m.driveTime})</p>
                  <p className="text-gray-400 italic">{m.notes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Operational Efficiency ───────────────────────────────────────── */}
      <section>
        <SectionHeader title="Operational Efficiency — Manager Workload" icon={Users} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ManagerWorkloadChart data={data.workload} />
          </div>
          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Communities / Manager</p>
                <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {data.workload.length > 0
                    ? (data.workload.reduce((s, w) => s + w.communities, 0) / data.workload.length).toFixed(1)
                    : '-'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Doors / Manager</p>
                <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {data.workload.length > 0
                    ? Math.round(data.workload.reduce((s, w) => s + w.doors, 0) / data.workload.length).toLocaleString()
                    : '-'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#1C244B] text-white border-0">
              <CardContent className="p-5">
                <Clock className="h-5 w-5 mb-2 text-[#F98761]" />
                <p className="text-xs uppercase tracking-wide text-gray-300 mb-1">Automation Impact</p>
                <p className="text-sm">
                  7 daily automation jobs + 5 intelligence agents eliminate ~<strong>40+ hours/week</strong> of manual work previously done in Vantaca.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── New Revenue Streams ──────────────────────────────────────────── */}
      <section>
        <SectionHeader title="New Revenue Stream Opportunities" icon={Lightbulb} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {NEW_REVENUE_STREAMS.map((s) => (
            <Card key={s.service} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.service}</p>
                  <Badge variant="outline" className={`text-xs ${difficultyColor(s.difficulty)}`}>
                    {s.difficulty}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-[#1C74AC] mb-1">{s.estimatedRevenue}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{s.description}</p>
                <p className="text-xs">
                  Competition: <span className={competitionColor(s.competition)}>{s.competition}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
