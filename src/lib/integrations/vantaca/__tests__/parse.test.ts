import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  detectFormat,
  detectHeaderRow,
  findDateInTitle,
  ImportFileError,
  MAX_UPLOAD_BYTES,
  parseImportFile,
  tableFromMatrix,
  uniqueHeaders,
} from '../parse'

const enc = (s: string) => {
  const bytes = new TextEncoder().encode(s)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

describe('detectHeaderRow', () => {
  it('skips title rows with fewer than 3 filled cells', () => {
    const matrix = [
      ['Sample Report Title'],
      ['As of 10/1/2026', '', ''],
      [],
      ['Col A', 'Col B', '', 'Col D'],
      ['1', '2', '3', '4'],
    ]
    expect(detectHeaderRow(matrix)).toBe(3)
  })

  it('returns -1 when no row qualifies', () => {
    expect(detectHeaderRow([['a', 'b'], ['c']])).toBe(-1)
  })
})

describe('uniqueHeaders', () => {
  it('names blank headers by column letter and numbers duplicates', () => {
    expect(uniqueHeaders(['Name', '', 'Name', ' name ', 'Total'])).toEqual([
      'Name',
      'Column B',
      'Name (2)',
      'name (3)',
      'Total',
    ])
  })
})

describe('tableFromMatrix', () => {
  it('returns headers, data rows padded to header width, and title lines', () => {
    const t = tableFromMatrix(
      [['Report title'], ['Col A', 'Col B', 'Col C', ''], ['1', '2'], ['', '', ''], ['4', '5', '6', 'extra']],
      { format: 'csv' },
    )
    expect(t.titleLines).toEqual(['Report title'])
    expect(t.headerRowNumber).toBe(2)
    expect(t.headers).toEqual(['Col A', 'Col B', 'Col C'])
    expect(t.rows).toEqual([['1', '2', ''], ['4', '5', '6']])
    expect(t.rowNumbers).toEqual([3, 5])
  })
})

describe('parseImportFile (csv)', () => {
  it('finds the header below title rows and keeps quoted values intact', async () => {
    const csv = 'Sample Title\r\nAs of 9/30/2026\r\n\r\nCode,Name,Balance\r\nA1,"Oak Hollow, Phase 2","$1,200.00"\r\n'
    const t = await parseImportFile(enc(csv), 'export.csv')
    expect(t.format).toBe('csv')
    expect(t.headerRowNumber).toBe(4)
    expect(t.headers).toEqual(['Code', 'Name', 'Balance'])
    expect(t.rows).toEqual([['A1', 'Oak Hollow, Phase 2', '$1,200.00']])
    expect(findDateInTitle(t.titleLines)).toBe('2026-09-30')
  })

  it('explains a malformed CSV', async () => {
    await expect(parseImportFile(enc('a,b,c\n"x,y'), 'x.csv')).rejects.toThrow(/Unclosed quoted field/)
  })

  it('rejects files with no header row', async () => {
    await expect(parseImportFile(enc('only,two\n1,2'), 'x.csv')).rejects.toBeInstanceOf(ImportFileError)
  })

  it('rejects files over 15 MB', async () => {
    await expect(parseImportFile(new ArrayBuffer(MAX_UPLOAD_BYTES + 1), 'big.csv')).rejects.toThrow(/15 MB/)
  })
})

describe('detectFormat', () => {
  it('accepts xlsx and csv and explains .xls', () => {
    expect(detectFormat('A.XLSX')).toBe('xlsx')
    expect(detectFormat('a.csv')).toBe('csv')
    expect(() => detectFormat('a.xls')).toThrow(/save it as .xlsx/)
    expect(() => detectFormat('a.pdf')).toThrow(ImportFileError)
  })
})

describe('parseImportFile (xlsx)', () => {
  async function workbookBuffer(): Promise<ArrayBuffer> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Export')
    ws.getCell('A1').value = 'Sample merged title'
    ws.mergeCells('A1:E1')
    ws.getCell('A2').value = 'As of 2026-09-30'
    ws.addRow([])
    ws.getRow(4).values = ['Code', 'Name', 'Opened', 'Amount', 'Doors']
    ws.getRow(5).values = ['A1', { richText: [{ text: 'Oak ' }, { text: 'Hollow' }] }, new Date(Date.UTC(2026, 0, 15)), -1234.5, 120]
    ws.getRow(6).values = ['A2', 'Pine Ridge', 45658, { formula: 'D5*2', result: -2469 }, null]
    const out = await wb.xlsx.writeBuffer()
    return out as ArrayBuffer
  }

  it('skips a merged title, reads rich text, dates, numbers, and formula results', async () => {
    const t = await parseImportFile(await workbookBuffer(), 'export.xlsx')
    expect(t.sheetName).toBe('Export')
    expect(t.headerRowNumber).toBe(4)
    expect(t.titleLines).toEqual(['Sample merged title', 'As of 2026-09-30'])
    expect(t.headers).toEqual(['Code', 'Name', 'Opened', 'Amount', 'Doors'])
    expect(t.rows).toEqual([
      ['A1', 'Oak Hollow', '2026-01-15', '-1234.5', '120'],
      ['A2', 'Pine Ridge', '45658', '-2469', ''],
    ])
    expect(t.rowNumbers).toEqual([5, 6])
  })

  it('rejects a file that is not a zip workbook', async () => {
    await expect(parseImportFile(enc('a,b,c'), 'fake.xlsx')).rejects.toThrow(/not a valid .xlsx/)
  })
})
