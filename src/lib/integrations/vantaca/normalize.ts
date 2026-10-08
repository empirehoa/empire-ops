/**
 * Value normalizers for Vantaca export cells. Every parser takes the raw cell
 * text and returns either a value (null when the cell is blank) or a reason
 * the text could not be read. Nothing is guessed: unreadable text is an error
 * the caller reports, never a silent zero.
 */
export type ParseResult<T> = { ok: true; value: T | null } | { ok: false; reason: string }

const blank = (s: string) => s.trim() === ''

/**
 * Money in dollars, rounded to cents.
 * Accepts "$1,234.50", "1234.5", "-$1,234.50", "$-1,234.50", "(1,234.50)" and
 * "($1,234.50)" (accounting negatives), and "1,234.50-" (trailing minus).
 * A lone "-" or "$ -" is the Excel accounting format for zero and reads as 0.
 */
export function parseMoney(raw: string): ParseResult<number> {
  if (blank(raw)) return { ok: true, value: null }
  let s = raw.trim().replace(/ /g, ' ')
  let negative = false

  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  if (s.endsWith('-') && s.length > 1 && /\d/.test(s)) {
    negative = !negative
    s = s.slice(0, -1).trim()
  }
  if (s.startsWith('-')) {
    negative = !negative
    s = s.slice(1).trim()
  }
  if (s.startsWith('$')) s = s.slice(1).trim()
  if (s.startsWith('-')) {
    negative = !negative
    s = s.slice(1).trim()
  }
  if (s === '-' || s === '') {
    // "$ -" / "-" accounting zero. A bare "()" or "$" is not an amount.
    if (raw.includes('-')) return { ok: true, value: 0 }
    return { ok: false, reason: `"${raw.trim()}" is not an amount` }
  }
  // Thousands separators must be in groups of three.
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$|^\.\d+$/.test(s)) {
    return { ok: false, reason: `"${raw.trim()}" is not an amount` }
  }
  const n = Number(s.replace(/,/g, ''))
  if (!Number.isFinite(n)) return { ok: false, reason: `"${raw.trim()}" is not an amount` }
  const cents = Math.round(n * 100) / 100
  return { ok: true, value: negative && cents !== 0 ? -cents : cents }
}

/** Whole numbers: "1,234", "12", "12.0". "12.5" is an error, not a rounded guess. */
export function parseInteger(raw: string): ParseResult<number> {
  if (blank(raw)) return { ok: true, value: null }
  const s = raw.trim()
  if (!/^-?(\d{1,3}(,\d{3})+|\d+)(\.0+)?$/.test(s)) {
    return { ok: false, reason: `"${s}" is not a whole number` }
  }
  const n = Number(s.replace(/,/g, '').replace(/\.0+$/, ''))
  if (!Number.isSafeInteger(n)) return { ok: false, reason: `"${s}" is not a whole number` }
  return { ok: true, value: n }
}

const pad = (n: number) => String(n).padStart(2, '0')

function isoFromParts(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

/**
 * Excel serial date (1900 date system) to ISO date. Serial 1 = 1900-01-01;
 * Excel's fictitious 1900-02-29 (serial 60) is accounted for by counting from
 * 1899-12-30. Fractions (time of day) are dropped.
 */
export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null
  const ms = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000
  const dt = new Date(ms)
  return isoFromParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

// Plain numbers are read as Excel serial dates only inside this window
// (1927-05-18 to 2173-10-14), so a stray "2024" or "12" is an error, not a 1905 date.
const SERIAL_MIN = 10_000
const SERIAL_MAX = 100_000

/**
 * Dates to ISO YYYY-MM-DD. Accepts ISO (YYYY-MM-DD, optionally with a time),
 * M/D/YYYY and M/D/YY (US order, optional time after a space; two-digit years
 * follow Excel: 00-29 is 2000s, 30-99 is 1900s), and Excel serial numbers.
 */
export function parseDate(raw: string): ParseResult<string> {
  if (blank(raw)) return { ok: true, value: null }
  const s = raw.trim()
  const bad: ParseResult<string> = { ok: false, reason: `"${s}" is not a date` }

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s)
  if (m) {
    const iso = isoFromParts(+m[1], +m[2], +m[3])
    return iso ? { ok: true, value: iso } : bad
  }

  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})(?:\s+.*)?$/.exec(s)
  if (m) {
    let year = +m[3]
    if (m[3].length === 2) year += year <= 29 ? 2000 : 1900
    const iso = isoFromParts(year, +m[1], +m[2])
    return iso ? { ok: true, value: iso } : bad
  }

  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s)
    if (serial >= SERIAL_MIN && serial <= SERIAL_MAX) {
      const iso = excelSerialToIso(serial)
      if (iso) return { ok: true, value: iso }
    }
    return bad
  }
  return bad
}

/** Trimmed text with internal runs of whitespace collapsed; blank is null. */
export function parseText(raw: string): ParseResult<string> {
  const s = raw.replace(/\s+/g, ' ').trim()
  return { ok: true, value: s === '' ? null : s }
}
