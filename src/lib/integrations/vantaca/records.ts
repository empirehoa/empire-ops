/**
 * Mapping checks and per-row validation (zod). Pure module: the import page
 * uses it to preview mapped rows, and the commit route uses it on every row.
 */
import { z } from 'zod'
import { KINDS, type FieldDef, type ImportKind, type Mapping } from './kinds'
import { parseDate, parseInteger, parseMoney, parseText, type ParseResult } from './normalize'

export type RowValue = string | number | null
export type RowValues = Record<string, RowValue>
export type RowOutcome = { ok: true; values: RowValues } | { ok: false; reasons: string[] }

export const AGING_BUCKETS = ['current_due', 'days_30', 'days_60', 'days_90_plus'] as const
const MAX_TEXT = 500

/** Field keys that have a column chosen. */
export function mappedFields(kind: ImportKind, mapping: Mapping): FieldDef[] {
  return KINDS[kind].fields.filter((f) => typeof mapping[f.key] === 'string' && mapping[f.key] !== '')
}

/**
 * Problems with the mapping itself (not with any row). Empty when the
 * mapping can be imported.
 */
export function mappingProblems(
  kind: ImportKind,
  mapping: Mapping,
  headers: string[],
  opts: { asOf?: string | null } = {},
): string[] {
  const problems: string[] = []
  const fields = KINDS[kind].fields
  const headerSet = new Set(headers)
  const usedBy = new Map<string, string>()

  for (const key of Object.keys(mapping)) {
    if (!fields.some((f) => f.key === key)) problems.push(`Unknown field "${key}".`)
  }
  for (const f of fields) {
    const header = mapping[f.key]
    if (header == null || header === '') continue
    if (!headerSet.has(header)) {
      problems.push(`${f.label}: the column "${header}" is not in this file.`)
      continue
    }
    const other = usedBy.get(header)
    if (other) problems.push(`The column "${header}" is chosen for both ${other} and ${f.label}.`)
    else usedBy.set(header, f.label)
  }

  const isMapped = (key: string) => typeof mapping[key] === 'string' && mapping[key] !== ''
  for (const f of fields) {
    if (!f.required || isMapped(f.key)) continue
    if (kind === 'ar_aging' && f.key === 'as_of') {
      if (!opts.asOf) problems.push('As-of date: choose a column or set one date for the whole file.')
      continue
    }
    problems.push(`${f.label} is required: choose the column that holds it.`)
  }

  if (kind === 'ar_aging') {
    if (opts.asOf) {
      const r = parseDate(opts.asOf)
      if (!r.ok || !r.value) problems.push(`As-of date for the file: "${opts.asOf}" is not a date.`)
    }
    if (![...AGING_BUCKETS, 'total'].some(isMapped)) {
      problems.push('Choose at least one balance column (Current, 30, 60, 90+ days, or Total).')
    }
  }
  return problems
}

function fieldSchema(f: FieldDef, kind: ImportKind) {
  const parser: (s: string) => ParseResult<string | number> =
    f.type === 'money' ? parseMoney : f.type === 'integer' ? parseInteger : f.type === 'date' ? parseDate : parseText
  const blankIsZero = kind === 'ar_aging' && f.type === 'money'
  // as_of may fall back to the file-level date, so it is checked after this step.
  const required = f.required && !(kind === 'ar_aging' && f.key === 'as_of')

  return z.string().transform((raw, ctx): RowValue => {
    const r = parser(raw)
    if (!r.ok) {
      ctx.addIssue({ code: 'custom', message: `${f.label}: ${r.reason}` })
      return z.NEVER
    }
    let value: RowValue = r.value
    if (value === null && blankIsZero) value = 0
    if (value === null && required) {
      ctx.addIssue({ code: 'custom', message: `${f.label} is blank` })
      return z.NEVER
    }
    if (typeof value === 'string' && value.length > MAX_TEXT) {
      ctx.addIssue({ code: 'custom', message: `${f.label} is longer than ${MAX_TEXT} characters` })
      return z.NEVER
    }
    if (typeof value === 'number' && f.type === 'integer' && value < 0) {
      ctx.addIssue({ code: 'custom', message: `${f.label} cannot be negative` })
      return z.NEVER
    }
    return value
  })
}

/**
 * Returns a validator that turns one data row into typed values for the mapped
 * fields, or the reasons it cannot be imported. Assumes mappingProblems() is empty.
 */
export function makeRowValidator(
  kind: ImportKind,
  mapping: Mapping,
  headers: string[],
  opts: { asOf?: string | null } = {},
): (row: string[]) => RowOutcome {
  const fields = mappedFields(kind, mapping)
  const columns = fields.map((f) => headers.indexOf(mapping[f.key] as string))
  const schema = z.object(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f, kind)])))
  const fileAsOf = opts.asOf ? parseDate(opts.asOf) : null
  const fileAsOfValue = fileAsOf && fileAsOf.ok ? fileAsOf.value : null

  return (row) => {
    const input = Object.fromEntries(fields.map((f, i) => [f.key, row[columns[i]] ?? '']))
    const parsed = schema.safeParse(input)
    if (!parsed.success) return { ok: false, reasons: parsed.error.issues.map((i) => i.message) }
    const values = parsed.data as RowValues

    if (kind === 'ar_aging') {
      if (values.as_of == null) {
        if (!fileAsOfValue) return { ok: false, reasons: ['As-of date is blank'] }
        values.as_of = fileAsOfValue
      }
      if (!('total' in values)) {
        const cents = AGING_BUCKETS.reduce((sum, k) => sum + Math.round(((values[k] as number | undefined) ?? 0) * 100), 0)
        values.total = cents / 100
      }
    }
    return { ok: true, values }
  }
}
