'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Clock,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevenueConcentrationItem {
  name: string
  revenue: number
  percentage: number
}

export interface PricingScatterPoint {
  name: string
  unitCount: number
  feePerDoor: number
  monthlyFee: number
}

export interface AgingBucket {
  bucket: string
  amount: number
  count: number
  color: string
}

export interface ManagerWorkload {
  name: string
  communities: number
  doors: number
}

// ─── Custom Tooltips ────────────────────────────────────────────────────────

function ConcentrationTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: RevenueConcentrationItem }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Revenue</span>
        <span className="font-mono font-medium">
          ${(data.revenue / 1_000).toFixed(0)}K
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Share</span>
        <span className="font-mono font-medium">{data.percentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function PricingTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PricingScatterPoint }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1 max-w-48 truncate">{data.name}</p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Units</span>
          <span className="font-mono font-medium">{data.unitCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Fee/Door</span>
          <span className="font-mono font-medium">${data.feePerDoor.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Monthly Fee</span>
          <span className="font-mono font-medium">
            ${(data.monthlyFee / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

function AgingTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: AgingBucket }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{data.bucket}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Amount</span>
        <span className="font-mono font-medium">
          ${(data.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Charges</span>
        <span className="font-mono font-medium">{data.count}</span>
      </div>
    </div>
  )
}

function WorkloadTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ManagerWorkload }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Communities</span>
        <span className="font-mono font-medium">{data.communities}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500">Doors</span>
        <span className="font-mono font-medium">{data.doors.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── Chart Components ───────────────────────────────────────────────────────

const BRAND_COLORS = ['#1C244B', '#1C74AC', '#F98761', '#10b981', '#8b5cf6']

export function RevenueConcentrationChart({
  data,
}: {
  data: RevenueConcentrationItem[]
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-[#1C74AC]" />
          Top 5 Communities by Revenue Share
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              domain={[0, 'auto']}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 10 }}
              width={140}
            />
            <Tooltip content={<ConcentrationTooltip />} />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function PricingScatterChart({
  data,
  avgFeePerDoor,
}: {
  data: PricingScatterPoint[]
  avgFeePerDoor: number
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-[#1C74AC]" />
          Pricing Analysis: Community Size vs Fee per Door
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="unitCount"
              type="number"
              name="Units"
              tick={{ fontSize: 11 }}
              label={{ value: 'Community Size (units)', position: 'bottom', fontSize: 11, offset: -2 }}
            />
            <YAxis
              dataKey="feePerDoor"
              type="number"
              name="Fee/Door"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
              label={{ value: '$/door/mo', angle: -90, position: 'insideLeft', fontSize: 11, offset: 10 }}
              width={56}
            />
            <ZAxis range={[40, 200]} />
            <Tooltip content={<PricingTooltip />} />
            <Scatter data={data} fill="#1C74AC">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.feePerDoor < avgFeePerDoor ? '#F98761' : '#1C74AC'}
                />
              ))}
            </Scatter>
            {/* Reference line for average */}
            <CartesianGrid
              strokeDasharray="8 4"
              stroke="#F98761"
              strokeWidth={0}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1C74AC]" />
            Above avg (${avgFeePerDoor.toFixed(2)}/door)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F98761]" />
            Below avg — pricing opportunity
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AgingChart({ data }: { data: AgingBucket[] }) {
  const total = data.reduce((s, b) => s + b.amount, 0)

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#1C74AC]" />
          AR Aging Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="bucket"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={2}
                label={(props) => {
                  // recharts types label props loosely — payload carries our AgingBucket
                  const { bucket, amount } = props as unknown as AgingBucket
                  return `${bucket}: $${(amount / 100_000).toFixed(0)}K`
                }}
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<AgingTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full lg:w-auto space-y-2 min-w-48">
            {data.map((bucket) => (
              <div
                key={bucket.bucket}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {bucket.bucket}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-medium text-gray-900 dark:text-white">
                    ${(bucket.amount / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({total > 0 ? ((bucket.amount / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ManagerWorkloadChart({ data }: { data: ManagerWorkload[] }) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#1C74AC]" />
          Manager Workload Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'Communities', angle: -90, position: 'insideLeft', fontSize: 10 }}
              width={48}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Doors', angle: 90, position: 'insideRight', fontSize: 10 }}
              width={48}
            />
            <Tooltip content={<WorkloadTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="communities"
              name="Communities"
              fill="#1C244B"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="doors"
              name="Doors"
              fill="#1C74AC"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
