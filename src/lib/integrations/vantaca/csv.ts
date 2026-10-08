/**
 * Small RFC 4180 CSV parser.
 *
 * - Fields are separated by commas; records by CRLF, LF, or a lone CR.
 * - A field wrapped in double quotes may contain commas, line breaks, and
 *   escaped quotes ("" inside a quoted field is one literal ").
 * - A trailing line break at the end of the file does not create an empty record.
 * - An unterminated quoted field is an error: a malformed file is never imported
 *   silently with shifted columns.
 */
export class CsvParseError extends Error {}

export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false
  let fieldQuoted = false
  let quoteStartLine = 0
  let line = 1
  let i = 0
  const n = text.length

  const endField = () => {
    record.push(field)
    field = ''
    fieldQuoted = false
  }
  const endRecord = () => {
    endField()
    records.push(record)
    record = []
  }

  while (i < n) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      if (ch === '\n' || (ch === '\r' && text[i + 1] !== '\n')) line += 1
      field += ch
      i += 1
      continue
    }

    if (ch === '"' && field === '' && !fieldQuoted) {
      inQuotes = true
      fieldQuoted = true
      quoteStartLine = line
      i += 1
      continue
    }
    if (ch === ',') {
      endField()
      i += 1
      continue
    }
    if (ch === '\r' || ch === '\n') {
      endRecord()
      line += 1
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1
      continue
    }
    // Lenient: a stray quote in the middle of an unquoted field is kept as text.
    field += ch
    i += 1
  }

  if (inQuotes) {
    throw new CsvParseError(`Unclosed quoted field starting on line ${quoteStartLine}`)
  }
  // Last record without a trailing line break.
  if (field !== '' || fieldQuoted || record.length > 0) endRecord()
  return records
}
