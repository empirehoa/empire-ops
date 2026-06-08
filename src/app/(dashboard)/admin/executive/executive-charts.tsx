'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuarterlyRevenue {
  quarter: string
  empire: number
  rianceRealty: number
  wfw: number
  fixiq: number
}

interface CashFlowPoint {
  period: string
  projected: number
  cumulative: number
  baseline: number
}

interface Props {
  quarterlyRevenue: QuarterlyRevenue[]
  cashFlowForecast: CashFlowPoint[]
}

// ─── Custom Tooltips ────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-medium">
            ${(p.value / 1_000_000).toFixed(2)}M
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex items-center justify-between gap-6 font-semibold">
        <span className="text-gray-700">Total</span>
        <span className="font-mono">
          ${(payload.reduce((s, p) => s + p.value, 0) / 1_000_000).toFixed(2)}M
        </span>
      </div>
    </div>
  )
}

function CashFlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-medium">
            ${(p.value / 1_000).toFixed(0)}K
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Chart Components ───────────────────────────────────────────────────────

export function ExecutiveCharts({ quarterlyRevenue, cashFlowForecast }: Props) {
  return (
    <div className="space-y-6">
      {/* Revenue Breakdown by Company — Stacked Bar Chart */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#1C74AC]" />
            Revenue by Company — Quarterly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={quarterlyRevenue}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                width={56}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="empire"
                name="Empire Mgmt"
                stackId="revenue"
                fill="#1C244B"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="rianceRealty"
                name="Riance Realty"
                stackId="revenue"
                fill="#1C74AC"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="wfw"
                name="WFW Restoration"
                stackId="revenue"
                fill="#F98761"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="fixiq"
                name="FixIQ"
                stackId="revenue"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast — Line Chart */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#1C74AC]" />
            Cash Flow Forecast — 30 / 60 / 90 Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={cashFlowForecast}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1_000).toFixed(0)}K`}
                width={56}
              />
              <Tooltip content={<CashFlowTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected Inflow"
                stroke="#1C74AC"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Position"
                stroke="#1C244B"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline (Expenses)"
                stroke="#F98761"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Projections based on trailing 90-day revenue run rate and committed expenses.
            Baseline reflects fixed monthly operating costs.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
