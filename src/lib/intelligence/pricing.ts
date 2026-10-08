// Internal fee-per-door benchmarks: monthly management fee / doors for each active
// association, grouped by size. Internal data only. Nothing here compares EMG to
// the market; there is no market data in this system.

import { activeCommunities, num, quantile, ratio, type CommunityInput } from './shared'

export type SizeBand = { key: string; label: string; min: number; max: number | null }

export const SIZE_BANDS: SizeBand[] = [
  { key: 'under-50', label: 'Under 50 doors', min: 1, max: 49 },
  { key: '50-149', label: '50 to 149 doors', min: 50, max: 149 },
  { key: '150-299', label: '150 to 299 doors', min: 150, max: 299 },
  { key: '300-599', label: '300 to 599 doors', min: 300, max: 599 },
  { key: '600-plus', label: '600+ doors', min: 600, max: null },
]

export function sizeBandFor(doors: number): SizeBand {
  return SIZE_BANDS.find((b) => doors >= b.min && (b.max === null || doors <= b.max)) ?? SIZE_BANDS[0]
}

export type FeePoint = {
  communityId: string
  name: string
  manager: string | null
  doors: number
  monthlyFee: number
  feePerDoor: number
  band: string
}

export type BandBenchmark = {
  key: string
  label: string
  count: number
  doors: number
  monthlyFees: number
  /** total fees / total doors within the band. */
  weightedFeePerDoor: number | null
  p25: number | null
  median: number | null
  p75: number | null
  min: number | null
  max: number | null
}

export type PricingBenchmarks = {
  label: string
  communityCount: number
  missingFee: number
  missingDoors: number
  totalDoors: number
  totalMonthlyFees: number
  weightedFeePerDoor: number | null
  medianFeePerDoor: number | null
  bands: BandBenchmark[]
  points: FeePoint[]
  /** Associations below their band's 25th percentile (bands with at least 4 associations). */
  lowestQuartile: Array<FeePoint & { bandP25: number }>
}

export const PRICING_LABEL = 'Internal data only: EMG management fees from the Vantaca community list. No market comparison.'

/** Null when no active association has both a fee and a door count. */
export function computePricingBenchmarks(communities: CommunityInput[]): PricingBenchmarks | null {
  const active = activeCommunities(communities)
  let missingFee = 0
  let missingDoors = 0
  const points: FeePoint[] = []
  for (const c of active) {
    const fee = num(c.monthly_management_fee)
    const doors = num(c.doors)
    if (fee === null || fee <= 0) missingFee++
    if (doors === null || doors <= 0) missingDoors++
    if (fee === null || fee <= 0 || doors === null || doors <= 0) continue
    points.push({
      communityId: c.id,
      name: c.name,
      manager: c.manager_name,
      doors,
      monthlyFee: fee,
      feePerDoor: fee / doors,
      band: sizeBandFor(doors).key,
    })
  }
  if (points.length === 0) return null

  const bands = SIZE_BANDS.map((b): BandBenchmark => {
    const inBand = points.filter((p) => p.band === b.key)
    const sorted = inBand.map((p) => p.feePerDoor).sort((x, y) => x - y)
    const doors = inBand.reduce((s, p) => s + p.doors, 0)
    const fees = inBand.reduce((s, p) => s + p.monthlyFee, 0)
    return {
      key: b.key,
      label: b.label,
      count: inBand.length,
      doors,
      monthlyFees: fees,
      weightedFeePerDoor: ratio(fees, doors),
      p25: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      min: sorted[0] ?? null,
      max: sorted[sorted.length - 1] ?? null,
    }
  })

  const lowestQuartile = points
    .flatMap((p) => {
      const band = bands.find((b) => b.key === p.band)!
      return band.count >= 4 && band.p25 !== null && p.feePerDoor < band.p25 ? [{ ...p, bandP25: band.p25 }] : []
    })
    .sort((a, b) => a.feePerDoor / a.bandP25 - b.feePerDoor / b.bandP25)

  const totalDoors = points.reduce((s, p) => s + p.doors, 0)
  const totalMonthlyFees = points.reduce((s, p) => s + p.monthlyFee, 0)
  return {
    label: PRICING_LABEL,
    communityCount: points.length,
    missingFee,
    missingDoors,
    totalDoors,
    totalMonthlyFees,
    weightedFeePerDoor: ratio(totalMonthlyFees, totalDoors),
    medianFeePerDoor: quantile(points.map((p) => p.feePerDoor).sort((a, b) => a - b), 0.5),
    bands,
    points,
    lowestQuartile,
  }
}
