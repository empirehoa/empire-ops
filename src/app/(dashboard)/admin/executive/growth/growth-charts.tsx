'use client'

import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { count, usd } from '@/lib/intelligence/format'

type Point = { communityId: string; name: string; doors: number; feePerDoor: number }

const CANDIDATE_TICKS = [10, 25, 50, 100, 150, 300, 600, 1000, 2500, 5000]
const BAND_EDGES = [50, 150, 300, 600]

function PointTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-foreground">{p.name}</div>
      <div className="tabular-nums text-muted-foreground">
        {count(p.doors)} doors, {usd(p.feePerDoor, 2)} per door
      </div>
    </div>
  )
}

/**
 * One dot per association: doors (log scale, labeled) against monthly fee per
 * door (linear from $0). Dashed lines mark the size-band edges used in the table.
 */
export function FeePerDoorScatter({ points }: { points: Point[] }) {
  const minDoors = Math.min(...points.map((p) => p.doors))
  const maxDoors = Math.max(...points.map((p) => p.doors))
  const lo = Math.max(1, Math.floor(minDoors * 0.9))
  const hi = Math.ceil(maxDoors * 1.1)
  const ticks = CANDIDATE_TICKS.filter((t) => t >= lo && t <= hi)
  return (
    <div className="h-72 w-full" role="img" aria-label={`Fee per door against association size for ${points.length} associations`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            type="number"
            dataKey="doors"
            scale="log"
            domain={[lo, hi]}
            ticks={ticks.length >= 2 ? ticks : undefined}
            tickFormatter={(v: number) => count(v)}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            label={{ value: 'Doors (log scale)', position: 'insideBottom', offset: -16, fontSize: 11, fill: 'var(--muted-foreground)' }}
            allowDataOverflow
          />
          <YAxis
            type="number"
            dataKey="feePerDoor"
            domain={[0, 'auto']}
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          {BAND_EDGES.filter((e) => e > lo && e < hi).map((e) => (
            <ReferenceLine key={e} x={e} stroke="var(--border)" strokeDasharray="4 4" />
          ))}
          <Tooltip content={<PointTooltip />} cursor={false} />
          <Scatter data={points} fill="var(--foreground)" fillOpacity={0.55} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
