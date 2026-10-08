import { describe, expect, it } from 'vitest'
import { excelSerialToIso, parseDate, parseInteger, parseMoney, parseText } from '../normalize'

const value = <T,>(r: { ok: true; value: T | null } | { ok: false; reason: string }) => {
  if (!r.ok) throw new Error(r.reason)
  return r.value
}

describe('parseMoney', () => {
  it.each([
    ['$1,234.50', 1234.5],
    ['1234.5', 1234.5],
    ['1,234,567.891', 1234567.89],
    ['$0.00', 0],
    ['.5', 0.5],
    [' $ 12 ', 12],
  ])('reads %s', (raw, expected) => {
    expect(value(parseMoney(raw))).toBe(expected)
  })

  it.each([
    ['(1,234.50)', -1234.5],
    ['($1,234.50)', -1234.5],
    ['-$1,234.50', -1234.5],
    ['$-1,234.50', -1234.5],
    ['-12', -12],
    ['1,234.50-', -1234.5],
  ])('reads negative %s', (raw, expected) => {
    expect(value(parseMoney(raw))).toBe(expected)
  })

  it('reads the accounting zero dash as 0 and never returns negative zero', () => {
    expect(value(parseMoney('-'))).toBe(0)
    expect(value(parseMoney('$ -'))).toBe(0)
    expect(Object.is(value(parseMoney('(0.00)')), 0)).toBe(true)
  })

  it('returns null for blank cells', () => {
    expect(value(parseMoney(''))).toBeNull()
    expect(value(parseMoney('   '))).toBeNull()
  })

  it.each(['abc', '$', '()', '1,23', '12a', '1.2.3', 'N/A'])('rejects %s', (raw) => {
    expect(parseMoney(raw).ok).toBe(false)
  })
})

describe('parseInteger', () => {
  it('reads whole numbers with separators and .0', () => {
    expect(value(parseInteger('1,234'))).toBe(1234)
    expect(value(parseInteger('12.0'))).toBe(12)
    expect(value(parseInteger('-3'))).toBe(-3)
    expect(value(parseInteger(''))).toBeNull()
  })

  it('rejects fractions and text instead of rounding', () => {
    expect(parseInteger('12.5').ok).toBe(false)
    expect(parseInteger('twelve').ok).toBe(false)
  })
})

describe('parseDate', () => {
  it('reads ISO dates and datetimes', () => {
    expect(value(parseDate('2026-10-01'))).toBe('2026-10-01')
    expect(value(parseDate('2026-10-01T13:45:00Z'))).toBe('2026-10-01')
  })

  it('reads M/D/YYYY and M/D/YY with an optional time', () => {
    expect(value(parseDate('10/1/2026'))).toBe('2026-10-01')
    expect(value(parseDate('01/05/2026 3:15 PM'))).toBe('2026-01-05')
    expect(value(parseDate('3/4/26'))).toBe('2026-03-04')
    expect(value(parseDate('3/4/95'))).toBe('1995-03-04')
  })

  it('reads Excel serial dates', () => {
    expect(value(parseDate('44927'))).toBe('2023-01-01')
    expect(value(parseDate('45658'))).toBe('2025-01-01')
    expect(value(parseDate('45658.75'))).toBe('2025-01-01')
    expect(excelSerialToIso(61)).toBe('1900-03-01')
  })

  it('does not read small plain numbers as serial dates', () => {
    expect(parseDate('2024').ok).toBe(false)
    expect(parseDate('12').ok).toBe(false)
  })

  it('rejects impossible calendar dates', () => {
    expect(parseDate('2/30/2026').ok).toBe(false)
    expect(parseDate('2026-13-01').ok).toBe(false)
    expect(parseDate('next week').ok).toBe(false)
  })

  it('returns null for blank cells', () => {
    expect(value(parseDate(''))).toBeNull()
  })
})

describe('parseText', () => {
  it('trims, collapses whitespace, and maps blank to null', () => {
    expect(value(parseText('  Lake   Nona  '))).toBe('Lake Nona')
    expect(value(parseText('  '))).toBeNull()
  })
})
