// Small helpers shared by the intelligence functions. Everything here is pure.

import type { CommunityRow } from '@/lib/types/database'

export const DAY_MS = 86_400_000

/** Community fields the intelligence functions need. */
export type CommunityInput = Pick<
  CommunityRow,
  'id' | 'name' | 'doors' | 'monthly_management_fee' | 'manager_name' | 'status' | 'is_test'
>

/** Numeric columns can arrive as strings from PostgREST; null stays null. */
export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Parse 'YYYY-MM-DD' (or a full ISO timestamp) into a Date. Date-only values are UTC midnight. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole days from `from` to `to` (floored). */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS)
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

/** part / whole, or null when whole is zero or missing. */
export function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null
}

export function round(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** Linear-interpolated quantile of an ascending-sorted array. */
export function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

const INACTIVE_STATUS = /^(inactive|terminated|former|lost|cancell?ed|closed|archived)\b/i

/** Vantaca dummy-data gate: test/practice associations never count toward portfolio figures. */
export function portfolioCommunities<C extends Pick<CommunityInput, 'is_test'>>(communities: C[]): C[] {
  return communities.filter((c) => c.is_test !== true)
}

/**
 * Communities currently under management: not test data and not marked with an
 * inactive status. Unknown statuses count as active so a new importer label
 * does not silently drop the whole portfolio.
 */
export function activeCommunities<C extends Pick<CommunityInput, 'is_test' | 'status'>>(communities: C[]): C[] {
  return portfolioCommunities(communities).filter((c) => !INACTIVE_STATUS.test((c.status ?? '').trim()))
}

export function byIdMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]))
}
