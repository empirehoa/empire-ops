// Display formatting shared by agents, the Notion report and the dashboards.
// Dates and times display in Eastern time (EMG is in Florida).

const TZ = 'America/New_York'

export function usd(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return 'n/a'
  const s = Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })
  return n < 0 ? `-${s}` : s
}

/** $1.2M / $340K / $950 style for big headline numbers. */
export function usdCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return 'n/a'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 1e7 ? 1 : 2)}M`
  if (abs >= 1e4) return `${sign}$${Math.round(abs / 1e3)}K`
  return usd(n)
}

export function pct(share: number | null | undefined, digits = 0): string {
  if (share === null || share === undefined || !Number.isFinite(share)) return 'n/a'
  return `${(share * 100).toFixed(digits)}%`
}

export function count(n: number): string {
  return n.toLocaleString('en-US')
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`
}

/** 'Oct 8, 2026' for a YYYY-MM-DD date (calendar date, no time zone shift). */
export function formatDay(value: string | null | undefined): string {
  if (!value) return 'n/a'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
  if (Number.isNaN(d.getTime())) return 'n/a'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ })
}

/** 'Oct 8, 2026, 2:05 AM' in Eastern time for a timestamp. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'n/a'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'n/a'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
    timeZoneName: 'short',
  })
}

/** 'Sep 2026' for a YYYY-MM key. */
export function formatMonth(key: string): string {
  const d = new Date(`${key}-15T12:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
