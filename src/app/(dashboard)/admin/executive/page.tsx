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
import Link from 'next/link'
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  Home,
  Droplets,
  Wrench,
  AlertCircle,
} from 'lucide-react'
import { ExecutiveCharts } from './executive-charts'

// ─── Types ──────────────────────────────────────────────────────────────────

type Company = {
  name: string
  shortName: string
  revenue: number
  employees: number
  icon: React.ElementType
  color: string
  description: string
  communities?: number
  doors?: number
}

type CrossSellOpportunity = {
  scenario: string
  from: string
  to: string
  estimatedValue: string
  pipeline: string
  priority: 'high' | 'medium' | 'low'
}

type AtRiskCommunity = {
  name: string
  healthScore: number | null
  financialScore: number | null
  delinquencyRate: number
  trend: string | null
  unitCount: number | null
}

// ─── Hardcoded Multi-Company Data ───────────────────────────────────────────
// TODO: Replace with real QuickBooks API data via mcp__claude_ai_Intuit_QuickBooks__*
// These figures are placeholder summaries for the Riance LLC portfolio.
// When QuickBooks integration is live, fetch P&L summaries per subsidiary.

const COMPANIES: Company[] = [
  {
    name: 'Empire Management Group',
    shortName: 'Empire',
    revenue: 7_710_000,
    employees: 63,
    icon: Building2,
    color: '#1C244B',
    description: 'HOA & community management',
    communities: 255,
    doors: 28_391,
  },
  {
    name: 'Riance Realty',
    shortName: 'Riance Realty',
    revenue: 2_400_000,
    employees: 12,
    icon: Home,
    color: '#1C74AC',
    description: 'Real estate brokerage',
  },
  {
    name: 'Wind Fire & Water',
    shortName: 'WFW',
    revenue: 890_000,
    employees: 11,
    icon: Droplets,
    color: '#F98761',
    description: 'Restoration services',
  },
  {
    name: 'FixIQ',
    shortName: 'FixIQ',
    revenue: 340_000,
    employees: 4,
    icon: Wrench,
    color: '#10b981',
    description: 'Maintenance & handyman',
  },
]

const TOTAL_REVENUE = COMPANIES.reduce((s, c) => s + c.revenue, 0)
const TOTAL_EMPLOYEES = COMPANIES.reduce((s, c) => s + c.employees, 0)

// TODO: Replace with real QuickBooks quarterly P&L data
const QUARTERLY_REVENUE = [
  { quarter: 'Q1 2025', empire: 1_890_000, rianceRealty: 580_000, wfw: 210_000, fixiq: 78_000 },
  { quarter: 'Q2 2025', empire: 1_950_000, rianceRealty: 620_000, wfw: 240_000, fixiq: 85_000 },
  { quarter: 'Q3 2025', empire: 1_970_000, rianceRealty: 610_000, wfw: 230_000, fixiq: 92_000 },
  { quarter: 'Q4 2025', empire: 1_900_000, rianceRealty: 590_000, wfw: 210_000, fixiq: 85_000 },
]

// TODO: Replace with real cash flow projections from QuickBooks + Plaid
const CASH_FLOW_FORECAST = [
  { period: 'Current', projected: 945_000, cumulative: 2_100_000, baseline: 820_000 },
  { period: '+30 Days', projected: 980_000, cumulative: 2_260_000, baseline: 820_000 },
  { period: '+60 Days', projected: 1_010_000, cumulative: 2_450_000, baseline: 830_000 },
  { period: '+90 Days', projected: 960_000, cumulative: 2_580_000, baseline: 830_000 },
]

// CROSS_SELL_OPPORTUNITIES — now fetched live via getCrossSellOpportunities()
// Fallback data is defined as CROSS_SELL_FALLBACK near the function definition.

// ─── KPI Calculations ───────────────────────────────────────────────────────
// TODO: Replace with computed values from QuickBooks once integrated

const KPIS = {
  revenuePerEmployee: Math.round(TOTAL_REVENUE / TOTAL_EMPLOYEES),
  yoyGrowth: 14.2, // percent — placeholder
  cashPosition: 2_100_000,
  clientAcquisitionCost: 3_200,
}

// ─── Data Fetcher: Cross-Sell Opportunities (Live Supabase Data) ────────────

async function getCrossSellOpportunities(tenantId: string): Promise<CrossSellOpportunity[]> {
  const supabase = await createClient()
  const opportunities: CrossSellOpportunity[] = []

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString()

  // Build association name lookup
  const { data: associations } = await supabase
    .from('associations')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .limit(500)

  const assocNameMap = new Map((associations ?? []).map((a) => [a.id, a.name]))
  function assocName(id: string): string {
    return assocNameMap.get(id) ?? 'Unknown'
  }

  // ── Pattern 1: Water/fire/mold violations in last 90 days → WFW ──────────
  const DAMAGE_KEYWORDS = ['water', 'flood', 'leak', 'pipe', 'mold', 'moisture', 'fire', 'smoke', 'storm']

  const { data: recentViolations } = await supabase
    .from('violations')
    .select('id, association_id, title, description, violation_category')
    .eq('tenant_id', tenantId)
    .gte('created_at', ninetyDaysAgoStr)
    .limit(2000)

  const wfwByAssoc = new Map<string, number>()
  for (const v of recentViolations ?? []) {
    const text = `${v.title ?? ''} ${v.description ?? ''} ${v.violation_category ?? ''}`.toLowerCase()
    if (DAMAGE_KEYWORDS.some((kw) => text.includes(kw))) {
      wfwByAssoc.set(v.association_id, (wfwByAssoc.get(v.association_id) ?? 0) + 1)
    }
  }

  for (const [assocId, count] of wfwByAssoc) {
    opportunities.push({
      scenario: `${assocName(assocId)}: ${count} damage violation(s) in 90 days → WFW restoration`,
      from: 'Empire',
      to: 'WFW',
      estimatedValue: count >= 3 ? '$45,000+' : `$${(count * 15_000).toLocaleString()}`,
      pipeline: `${count} active claim${count !== 1 ? 's' : ''}`,
      priority: count >= 3 ? 'high' : 'medium',
    })
  }

  // ── Pattern 2: Communities with 5+ open work orders → FixIQ ──────────────
  const { data: openWorkOrders } = await supabase
    .from('work_orders')
    .select('id, association_id, priority')
    .eq('tenant_id', tenantId)
    .not('status', 'in', '("closed","cancelled","completed")')
    .limit(5000)

  const woByAssoc = new Map<string, { total: number; urgent: number }>()
  for (const wo of openWorkOrders ?? []) {
    const entry = woByAssoc.get(wo.association_id) ?? { total: 0, urgent: 0 }
    entry.total++
    if (wo.priority === 'urgent' || wo.priority === 'high') entry.urgent++
    woByAssoc.set(wo.association_id, entry)
  }

  for (const [assocId, data] of woByAssoc) {
    if (data.total >= 5) {
      opportunities.push({
        scenario: `${assocName(assocId)}: ${data.total} open work orders → FixIQ vendor contract`,
        from: 'Empire',
        to: 'FixIQ',
        estimatedValue: data.total >= 15 ? '$8,500/mo' : '$4,200/mo',
        pipeline: `${data.total} open orders (${data.urgent} urgent)`,
        priority: data.urgent >= 3 ? 'high' : 'medium',
      })
    }
  }

  // ── Pattern 3: Properties for sale → Riance Realty ───────────────────────
  const { data: forSaleProperties } = await supabase
    .from('properties')
    .select('id, association_id')
    .eq('tenant_id', tenantId)
    .eq('property_lifecycle', 'for_sale')
    .limit(500)

  const salesByAssoc = new Map<string, number>()
  for (const prop of forSaleProperties ?? []) {
    salesByAssoc.set(prop.association_id, (salesByAssoc.get(prop.association_id) ?? 0) + 1)
  }

  for (const [assocId, count] of salesByAssoc) {
    opportunities.push({
      scenario: `${assocName(assocId)}: ${count} propert${count === 1 ? 'y' : 'ies'} for sale → Riance Realty listing`,
      from: 'Empire',
      to: 'Riance Realty',
      estimatedValue: `$${(count * 15_000).toLocaleString()}`,
      pipeline: `${count} potential listing${count !== 1 ? 's' : ''}`,
      priority: count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low',
    })
  }

  // Sort by priority: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return opportunities
}

// ─── Hardcoded Cross-Sell Fallback ──────────────────────────────────────────
// Used when no live data is found from Supabase queries

const CROSS_SELL_FALLBACK: CrossSellOpportunity[] = [
  {
    scenario: 'HOA water damage claim → WFW restoration project',
    from: 'Empire',
    to: 'WFW',
    estimatedValue: '$45,000',
    pipeline: '3 active claims',
    priority: 'high',
  },
  {
    scenario: 'WFW restoration complete → FixIQ ongoing maintenance',
    from: 'WFW',
    to: 'FixIQ',
    estimatedValue: '$12,000/yr',
    pipeline: '7 completed projects',
    priority: 'high',
  },
  {
    scenario: 'Empire HOA board → Riance Realty listing referrals',
    from: 'Empire',
    to: 'Riance Realty',
    estimatedValue: '$180,000',
    pipeline: '12 potential listings',
    priority: 'medium',
  },
  {
    scenario: 'Empire common area repairs → FixIQ vendor contract',
    from: 'Empire',
    to: 'FixIQ',
    estimatedValue: '$8,500/mo',
    pipeline: '5 communities reviewing',
    priority: 'medium',
  },
  {
    scenario: 'Riance Realty buyer closes → Empire HOA onboarding',
    from: 'Riance Realty',
    to: 'Empire',
    estimatedValue: '$2,400/yr per unit',
    pipeline: '28 pending closings',
    priority: 'low',
  },
  {
    scenario: 'FixIQ identifies mold → WFW remediation referral',
    from: 'FixIQ',
    to: 'WFW',
    estimatedValue: '$22,000',
    pipeline: '2 inspections flagged',
    priority: 'high',
  },
]

// ─── Data Fetcher (Supabase — real data for Empire communities) ─────────────

async function getAtRiskCommunities(tenantId: string): Promise<AtRiskCommunity[]> {
  const supabase = await createClient()

  // Fetch community health scores with association details
  const { data: healthScores } = await supabase
    .from('community_health_scores')
    .select(
      'association_id, overall_score, financial_score, score_trend, associations(name, unit_count)'
    )
    .eq('tenant_id', tenantId)
    .order('overall_score', { ascending: true })
    .limit(20)

  if (!healthScores || healthScores.length === 0) return []

  // Fetch recent charges to compute delinquency rates per association
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: charges } = await supabase
    .from('charges')
    .select('association_id, amount, balance_due, status')
    .eq('tenant_id', tenantId)
    .gte('due_date', threeMonthsAgo.toISOString().split('T')[0])
    .not('status', 'eq', 'voided')

  // Aggregate delinquency by association
  const delinquencyMap: Record<string, { billed: number; overdue: number }> = {}
  for (const c of charges ?? []) {
    const id = c.association_id as string
    if (!id) continue
    if (!delinquencyMap[id]) delinquencyMap[id] = { billed: 0, overdue: 0 }
    delinquencyMap[id].billed += c.amount ?? 0
    if ((c.balance_due ?? 0) > 0) {
      delinquencyMap[id].overdue += c.balance_due ?? 0
    }
  }

  type HealthRow = {
    association_id: string
    overall_score: number | null
    financial_score: number | null
    score_trend: string | null
    associations: { name: string | null; unit_count: number | null } | null
  }

  // Build at-risk list: communities with health < 70 OR delinquency > 15%
  const atRisk: AtRiskCommunity[] = (healthScores as HealthRow[])
    .filter((h) => {
      const score = h.overall_score ?? 100
      const delinquency = delinquencyMap[h.association_id]
      const delinquencyRate =
        delinquency && delinquency.billed > 0
          ? (delinquency.overdue / delinquency.billed) * 100
          : 0
      return score < 70 || delinquencyRate > 15
    })
    .map((h) => {
      const delinquency = delinquencyMap[h.association_id]
      return {
        name: h.associations?.name ?? 'Unknown',
        healthScore: h.overall_score,
        financialScore: h.financial_score,
        delinquencyRate:
          delinquency && delinquency.billed > 0
            ? Math.round((delinquency.overdue / delinquency.billed) * 100)
            : 0,
        trend: h.score_trend,
        unitCount: h.associations?.unit_count ?? null,
      }
    })
    .sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))
    .slice(0, 10)

  return atRisk
}

// ─── Helper Components ──────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-[#1C74AC]" />
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

function scoreBadgeVariant(
  score: number
): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

function priorityBadgeVariant(
  priority: 'high' | 'medium' | 'low'
): 'error' | 'warning' | 'info' {
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (
    !profile ||
    (profile.role !== 'super_admin' && profile.role !== 'tenant_admin')
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Executive Intelligence requires admin role.
          </p>
        </div>
      </div>
    )
  }

  const [atRiskCommunities, liveCrossSell] = await Promise.all([
    getAtRiskCommunities(profile.tenant_id),
    getCrossSellOpportunities(profile.tenant_id),
  ])

  // Use live data if available, otherwise fall back to hardcoded examples
  const crossSellOpportunities = liveCrossSell.length > 0 ? liveCrossSell : CROSS_SELL_FALLBACK

  return (
    <div className="space-y-8">
      <PageHeader
        title="Riance LLC — Executive Intelligence"
        subtitle="Cross-business portfolio view for CEO-level strategic decisions"
        backHref="/admin"
        backLabel="Admin"
        badge={
          <Badge variant="outline" className="text-xs">
            {TOTAL_EMPLOYEES} employees
          </Badge>
        }
      />

      {/* ── Quick Links ─────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Link
          href="/admin/executive/growth"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md"
        >
          <TrendingUp className="h-4 w-4 text-[#1C74AC]" />
          Growth Analysis
        </Link>
      </div>

      {/* ── Portfolio Summary Cards ────────────────────────────────────── */}
      <section>
        <SectionHeader title="Portfolio Companies" icon={Briefcase} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMPANIES.map((company) => {
            const Icon = company.icon
            const revenueShare = (
              (company.revenue / TOTAL_REVENUE) *
              100
            ).toFixed(1)
            return (
              <Card
                key={company.shortName}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${company.color}15` }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: company.color }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {company.shortName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {company.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {revenueShare}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Revenue
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatCompact(company.revenue)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Employees
                      </span>
                      <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                        {company.employees}
                      </span>
                    </div>
                    {company.communities && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Communities
                        </span>
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                          {company.communities}
                        </span>
                      </div>
                    )}
                    {company.doors && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Doors
                        </span>
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                          {company.doors.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Rev/Employee
                      </span>
                      <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(
                          Math.round(company.revenue / company.employees)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Portfolio total strip */}
        <Card className="mt-4 bg-[#1C244B] text-white border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[#F98761]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-300">
                    Riance LLC Total Revenue
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatCompact(TOTAL_REVENUE)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#F98761]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-300">
                    Total Headcount
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {TOTAL_EMPLOYEES}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-[#F98761]" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-300">
                    Business Units
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {COMPANIES.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Key Performance Indicators" icon={TrendingUp} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 mb-2 text-[#1C74AC]" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Revenue / Employee
              </p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(KPIS.revenuePerEmployee)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4">
              <TrendingUp className="h-5 w-5 mb-2 text-emerald-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                YoY Growth
              </p>
              <p className="text-2xl font-semibold tabular-nums text-emerald-600">
                +{KPIS.yoyGrowth}%
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4">
              <Briefcase className="h-5 w-5 mb-2 text-[#1C74AC]" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Cash Position
              </p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatCompact(KPIS.cashPosition)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4">
              <Users className="h-5 w-5 mb-2 text-[#F98761]" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Client Acq. Cost
              </p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(KPIS.clientAcquisitionCost)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Cross-Sell Opportunities ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Cross-Sell Opportunities"
          icon={ArrowRightLeft}
        />
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Est. Value</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crossSellOpportunities.map((opp, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {opp.scenario}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {opp.from}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {opp.to}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {opp.estimatedValue}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {opp.pipeline}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={priorityBadgeVariant(opp.priority)}
                        className="text-xs capitalize"
                      >
                        {opp.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── Charts (Client Component) ──────────────────────────────────── */}
      <section>
        <ExecutiveCharts
          quarterlyRevenue={QUARTERLY_REVENUE}
          cashFlowForecast={CASH_FLOW_FORECAST}
        />
      </section>

      {/* ── At-Risk Communities (Real Supabase Data) ───────────────────── */}
      <section>
        <SectionHeader title="At-Risk Communities" icon={AlertTriangle} />
        {atRiskCommunities.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  All communities are healthy
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No communities with health scores below 70 or delinquency
                  above 15%.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#F98761]" />
                Communities with health score &lt; 70 or delinquency &gt; 15%
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead className="text-center">
                      Health Score
                    </TableHead>
                    <TableHead className="text-center">
                      Financial Score
                    </TableHead>
                    <TableHead className="text-center">
                      Delinquency
                    </TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskCommunities.map((community, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {community.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm">
                        {community.unitCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {community.healthScore !== null ? (
                          <Badge
                            variant={scoreBadgeVariant(community.healthScore)}
                            className="text-xs tabular-nums"
                          >
                            {community.healthScore}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {community.financialScore !== null ? (
                          <span
                            className={`text-sm font-medium tabular-nums ${scoreColor(community.financialScore)}`}
                          >
                            {community.financialScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-mono font-medium tabular-nums ${
                            community.delinquencyRate > 25
                              ? 'text-red-600'
                              : community.delinquencyRate > 15
                                ? 'text-amber-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {community.delinquencyRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {community.trend === 'improving' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : community.trend === 'declining' ? (
                          <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
