import ExcelJS from 'exceljs'
import { parseCsv, CsvParseError } from './csv'
import { parseDate } from './normalize'

export { parseCsv, CsvParseError } from './csv'
export {
  parseMoney,
  parseInteger,
  parseDate,
  parseText,
  excelSerialToIso,
  type ParseResult,
} from './normalize'

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
export const MAX_DATA_ROWS = 100_000
/** A header row is the first row with at least this many filled cells. */
export const HEADER_MIN_FILLED = 3
const HEADER_SCAN_ROWS = 100

export type FileFormat = 'xlsx' | 'csv'

export type ParsedTable = {
  format: FileFormat
  sheetName: string | null
  /** 1-based row (xlsx) or record (csv) number of the header row. */
  headerRowNumber: number
  /** Text of non-empty rows above the header (report titles, dates). */
  titleLines: string[]
  /** Unique, trimmed column headers exactly as the file names them. */
  headers: string[]
  /** Data rows, each the same length as headers. Fully blank rows are dropped. */
  rows: string[][]
  /** Source row number for each entry in rows, for error reporting. */
  rowNumbers: number[]
}

export class ImportFileError extends Error {}

export function detectFormat(filename: string): FileFormat {
  const name = filename.toLowerCase().trim()
  if (name.endsWith('.xlsx')) return 'xlsx'
  if (name.endsWith('.csv')) return 'csv'
  if (name.endsWith('.xls')) {
    throw new ImportFileError(
      'This is an older .xls file. Open it in Excel and save it as .xlsx, or export it as .csv.',
    )
  }
  throw new ImportFileError('Upload an .xlsx or .csv file.')
}

const filled = (cell: string) => cell.trim() !== ''

function columnLetter(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Index of the first row with at least HEADER_MIN_FILLED non-empty cells, or -1. */
export function detectHeaderRow(matrix: string[][], scanRows = HEADER_SCAN_ROWS): number {
  const limit = Math.min(matrix.length, scanRows)
  for (let i = 0; i < limit; i++) {
    if (matrix[i].filter(filled).length >= HEADER_MIN_FILLED) return i
  }
  return -1
}

/** Makes headers unique and names blank ones by column letter. */
export function uniqueHeaders(raw: string[]): string[] {
  const seen = new Map<string, number>()
  return raw.map((cell, i) => {
    const base = cell.replace(/\s+/g, ' ').trim() || `Column ${columnLetter(i)}`
    const key = base.toLowerCase()
    const count = (seen.get(key) ?? 0) + 1
    seen.set(key, count)
    return count === 1 ? base : `${base} (${count})`
  })
}

/**
 * Turns a raw cell matrix into a table: finds the header row (Vantaca exports
 * often have title rows above the table), keeps the columns up to the last
 * named header, and drops fully blank rows.
 */
export function tableFromMatrix(
  matrix: string[][],
  opts: { format: FileFormat; sheetName?: string | null; rowNumbers?: number[] },
): ParsedTable {
  const headerIdx = detectHeaderRow(matrix)
  if (headerIdx === -1) {
    throw new ImportFileError(
      `Could not find the column headers: none of the first ${HEADER_SCAN_ROWS} rows has ${HEADER_MIN_FILLED} or more filled cells.`,
    )
  }
  const sourceRowNumber = (i: number) => opts.rowNumbers?.[i] ?? i + 1
  const headerCells = matrix[headerIdx]
  let width = headerCells.length
  while (width > 0 && !filled(headerCells[width - 1])) width--
  const headers = uniqueHeaders(headerCells.slice(0, width))

  const titleLines = matrix
    .slice(0, headerIdx)
    .map((r) => r.filter(filled).map((c) => c.trim()).join(' '))
    .filter((t) => t !== '')

  const rows: string[][] = []
  const rowNumbers: number[] = []
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const cells = matrix[i].slice(0, width).map((c) => c.trim())
    while (cells.length < width) cells.push('')
    if (!cells.some(filled)) continue
    rows.push(cells)
    rowNumbers.push(sourceRowNumber(i))
    if (rows.length > MAX_DATA_ROWS) {
      throw new ImportFileError(
        `This file has more than ${MAX_DATA_ROWS.toLocaleString('en-US')} data rows. Split the export into smaller files.`,
      )
    }
  }

  return {
    format: opts.format,
    sheetName: opts.sheetName ?? null,
    headerRowNumber: sourceRowNumber(headerIdx),
    titleLines,
    headers,
    rows,
    rowNumbers,
  }
}

function isoFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Text for an exceljs cell value. Dates become ISO dates (exceljs reads them as UTC). */
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : isoFromDate(value)
  if ('richText' in value) return value.richText.map((r) => r.text).join('')
  if ('hyperlink' in value) return typeof value.text === 'string' ? value.text : cellText(value.text as ExcelJS.CellValue)
  if ('error' in value) return ''
  if ('result' in value) return cellText((value.result ?? null) as ExcelJS.CellValue)
  if ('formula' in value || 'sharedFormula' in value) return ''
  return ''
}

async function xlsxMatrix(buffer: ArrayBuffer): Promise<{ matrix: string[][]; rowNumbers: number[]; sheetName: string }> {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new ImportFileError('This file is not a valid .xlsx workbook.')
  }
  const workbook = new ExcelJS.Workbook()
  try {
    // exceljs types expect a Node Buffer.
    await workbook.xlsx.load(Buffer.from(buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0])
  } catch {
    throw new ImportFileError('Could not read this .xlsx workbook. Re-export it from Vantaca and try again.')
  }

  for (const sheet of workbook.worksheets) {
    const matrix: string[][] = []
    const rowNumbers: number[] = []
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = []
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        // A merged range (typical for report titles) counts once, at its top-left cell.
        const text = cell.isMerged && cell.master.address !== cell.address ? '' : cellText(cell.value)
        cells[col - 1] = text
      })
      for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = ''
      matrix.push(cells)
      rowNumbers.push(rowNumber)
    })
    if (detectHeaderRow(matrix) !== -1) return { matrix, rowNumbers, sheetName: sheet.name }
  }
  throw new ImportFileError(
    `Could not find the column headers: no worksheet has a row with ${HEADER_MIN_FILLED} or more filled cells.`,
  )
}

/** Parses an uploaded export. Throws ImportFileError with an admin-readable message. */
export async function parseImportFile(buffer: ArrayBuffer, filename: string): Promise<ParsedTable> {
  const format = detectFormat(filename)
  if (buffer.byteLength === 0) throw new ImportFileError('The file is empty.')
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImportFileError('The file is larger than 15 MB. Export a smaller date range or fewer columns.')
  }
  if (format === 'csv') {
    const text = new TextDecoder('utf-8').decode(buffer)
    let matrix: string[][]
    try {
      matrix = parseCsv(text)
    } catch (err) {
      if (err instanceof CsvParseError) throw new ImportFileError(`Could not read this CSV: ${err.message}.`)
      throw err
    }
    return tableFromMatrix(matrix, { format })
  }
  const { matrix, rowNumbers, sheetName } = await xlsxMatrix(buffer)
  return tableFromMatrix(matrix, { format, sheetName, rowNumbers })
}

/** First date written in the report title lines (e.g. "As of 10/1/2026"), if any. */
export function findDateInTitle(lines: string[]): string | null {
  for (const line of lines) {
    const matches = line.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g) ?? []
    for (const m of matches) {
      const r = parseDate(m)
      if (r.ok && r.value) return r.value
    }
  }
  return null
}
