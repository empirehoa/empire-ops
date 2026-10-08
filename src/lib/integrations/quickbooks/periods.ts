// Report periods, computed on the company's calendar (Florida = America/New_York)
// so a run at 06:00 UTC uses the correct local "today".

export const REPORT_TIMEZONE = 'America/New_York'

export type Period = { start: string; end: string }

/** YYYY-MM-DD for `now` in the given time zone. */
export function todayInZone(now: Date = new Date(), timeZone: string = REPORT_TIMEZONE): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) throw new Error(`Invalid date ${ymd}; expected YYYY-MM-DD`)
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** First day of today's month through today. */
export function monthToDate(today: string): Period {
  const { y, m } = parseYmd(today)
  return { start: fmt(new Date(Date.UTC(y, m - 1, 1))), end: today }
}

/** The `count` complete calendar months before today's month, most recent first. */
export function lastFullMonths(today: string, count = 12): Period[] {
  const { y, m } = parseYmd(today)
  const periods: Period[] = []
  for (let i = 1; i <= count; i++) {
    const start = new Date(Date.UTC(y, m - 1 - i, 1))
    const end = new Date(Date.UTC(y, m - i, 0)) // day 0 of next month = last day of this month
    periods.push({ start: fmt(start), end: fmt(end) })
  }
  return periods
}
