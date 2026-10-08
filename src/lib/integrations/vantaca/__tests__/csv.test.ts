import { describe, expect, it } from 'vitest'
import { CsvParseError, parseCsv } from '../csv'

describe('parseCsv (RFC 4180)', () => {
  it('splits simple records on LF and CRLF', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('treats a lone CR as a record break', () => {
    expect(parseCsv('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('does not add an empty record for a trailing line break', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']])
    expect(parseCsv('a,b\r\n\r\n')).toEqual([['a', 'b'], ['']])
  })

  it('keeps commas and line breaks inside quoted fields', () => {
    expect(parseCsv('"Smith, John","Line 1\r\nLine 2",x')).toEqual([['Smith, John', 'Line 1\r\nLine 2', 'x']])
  })

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCsv('"She said ""hi""",""""')).toEqual([['She said "hi"', '"']])
  })

  it('keeps empty fields, including a trailing one', () => {
    expect(parseCsv('a,,c,\n,,,')).toEqual([['a', '', 'c', ''], ['', '', '', '']])
    expect(parseCsv('""')).toEqual([['']])
  })

  it('strips a UTF-8 byte order mark', () => {
    expect(parseCsv('﻿Assoc ID,Name\n1,X')[0]).toEqual(['Assoc ID', 'Name'])
  })

  it('keeps a stray quote inside an unquoted field as text', () => {
    expect(parseCsv('12" pipe,b')).toEqual([['12" pipe', 'b']])
  })

  it('returns no records for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('rejects an unterminated quoted field with its line number', () => {
    expect(() => parseCsv('a,b\n1,"open\nstill open')).toThrow(CsvParseError)
    expect(() => parseCsv('a,b\n1,"open\nstill open')).toThrow(/line 2/)
  })
})
