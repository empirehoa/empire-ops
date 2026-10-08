'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMonth, usd } from '@/lib/intelligence/format'

type Point = { month: string; income: number | null }

function MonthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
      <div className="text-muted-foreground">{formatMonth(p.month)}</div>
      <div className="tabular-nums text-foreground">{p.income === null ? 'No P&L for this month' : usd(p.income)}</div>
    </div>
  )
}

/**
 * Monthly revenue bars for one company. Every company's chart receives the same
 * domain so bar heights compare across companies; the axis starts at zero.
 */
export function RevenueBars({ data, domainMax, domainMin }: { data: Point[]; domainMax: number; domainMin: number }) {
  const label = `Monthly revenue, ${formatMonth(data[0]?.month ?? '')} to ${formatMonth(data[data.length - 1]?.month ?? '')}`
  return (
    <div className="h-24 w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => formatMonth(m).split(' ')[0]}
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis hide domain={[domainMin, domainMax]} />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="income" fill="var(--foreground)" fillOpacity={0.75} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
