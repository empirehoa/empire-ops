import { describe, expect, it } from 'vitest'
import { headerSimilarity, KINDS, normalizeHeader, suggestMapping } from '../kinds'

// Headers below are made up for testing. They are not Vantaca's real column names.
describe('normalizeHeader', () => {
  it('lowercases, expands symbols and abbreviations', () => {
    expect(normalizeHeader('Assoc ID')).toEqual(['association', 'id'])
    expect(normalizeHeader('90+ Days')).toEqual(['90', 'plus', 'days'])
    expect(normalizeHeader('Action Item #')).toEqual(['action', 'item', 'number'])
    expect(normalizeHeader('Mgmt. Fee')).toEqual(['management', 'fee'])
  })
})

describe('headerSimilarity', () => {
  it('scores exact and reordered matches high', () => {
    expect(headerSimilarity('Assoc ID', 'association id')).toBe(1)
    expect(headerSimilarity('AssocID', 'assoc id')).toBe(0.98)
    expect(headerSimilarity('Days 30', '30 days')).toBe(0.95)
  })

  it('never matches different day buckets', () => {
    expect(headerSimilarity('Over 60', 'over 30')).toBe(0)
    expect(headerSimilarity('60 Days', '90 days')).toBe(0)
  })
})

describe('suggestMapping', () => {
  it('suggests communities fields from synonyms', () => {
    const { mapping } = suggestMapping('communities', [
      'Association Code',
      'Association Name',
      'Assoc Type',
      'Units',
      'Mgmt Fee',
      'Community Manager',
      'Something Else',
    ])
    expect(mapping).toMatchObject({
      vantaca_id: 'Association Code',
      name: 'Association Name',
      community_type: 'Assoc Type',
      doors: 'Units',
      monthly_management_fee: 'Mgmt Fee',
      manager_name: 'Community Manager',
      city: null,
      status: null,
    })
  })

  it('suggests "Assoc ID" as the Vantaca ID', () => {
    expect(suggestMapping('communities', ['Assoc ID', 'Name', 'City']).mapping.vantaca_id).toBe('Assoc ID')
  })

  it('suggests aging buckets without crossing numbers', () => {
    const { mapping } = suggestMapping('ar_aging', ['Assoc ID', 'Current', '31-60', '61-90', 'Over 90', 'Total Due'])
    expect(mapping).toEqual({
      association: 'Assoc ID',
      as_of: null,
      current_due: 'Current',
      days_30: '31-60',
      days_60: '61-90',
      days_90_plus: 'Over 90',
      total: 'Total Due',
    })
    expect(suggestMapping('ar_aging', ['Association', '90+ Days', 'Balance']).mapping.days_90_plus).toBe('90+ Days')
  })

  it('suggests XN from "XN" or "Action Item #"', () => {
    expect(suggestMapping('action_items', ['XN', 'Association', 'Status']).mapping.xn).toBe('XN')
    expect(suggestMapping('action_items', ['Action Item #', 'Opened', 'Closed']).mapping).toMatchObject({
      xn: 'Action Item #',
      opened_on: 'Opened',
      closed_on: 'Closed',
    })
  })

  it('uses each header for at most one field', () => {
    const { mapping } = suggestMapping('action_items', ['Type', 'Status', 'Assoc'])
    const used = Object.values(mapping).filter(Boolean)
    expect(new Set(used).size).toBe(used.length)
  })

  it('leaves fields unmapped when nothing is close', () => {
    const { mapping, suggestions } = suggestMapping('ar_aging', ['Foo', 'Bar', 'Baz'])
    expect(Object.values(mapping).every((v) => v === null)).toBe(true)
    expect(suggestions).toEqual([])
  })

  it('returns a key for every field of the kind', () => {
    for (const kind of ['communities', 'ar_aging', 'action_items'] as const) {
      expect(Object.keys(suggestMapping(kind, []).mapping)).toEqual(KINDS[kind].fields.map((f) => f.key))
    }
  })
})
