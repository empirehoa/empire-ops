import { cn } from '@/lib/utils'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ─── Types ─────────────────────────────────────────────────────────────────

type KpiCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number // percentage change
    label: string // e.g. "vs last month"
  }
  sparkline?: number[] // array of values for mini chart
  status?: 'green' | 'yellow' | 'red' // RAG indicator
  href?: string
  className?: string
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null

  const width = 80
  const height = 28
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const polyline = points.join(' ')

  // Determine if trending up or down
  const isUp = data[data.length - 1] >= data[0]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={isUp ? 'oklch(0.65 0.15 145)' : 'oklch(0.65 0.2 25)'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={parseFloat(points[points.length - 1].split(',')[0])}
          cy={parseFloat(points[points.length - 1].split(',')[1])}
          r={2}
          fill={isUp ? 'oklch(0.65 0.15 145)' : 'oklch(0.65 0.2 25)'}
        />
      )}
    </svg>
  )
}

// ─── RAG Indicator ─────────────────────────────────────────────────────────

function RagDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', colors[status])} />
  )
}

// ─── Component ─────────────────────────────────────────────────────────────

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  sparkline,
  status,
  className,
}: KpiCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400'
    : ''

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {status && <RagDot status={status} />}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">{value}</p>
            {trend && TrendIcon && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal">{trend.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {sparkline && sparkline.length >= 2 && (
              <Sparkline data={sparkline} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
