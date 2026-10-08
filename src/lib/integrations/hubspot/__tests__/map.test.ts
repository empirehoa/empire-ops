import { describe, expect, it } from 'vitest'
import {
  buildLookups,
  dealToRow,
  parseHubSpotBool,
  parseHubSpotDate,
  parseHubSpotMoney,
  parseHubSpotNumber,
  parseHubSpotTimestamp,
  parseProbability,
} from '../map'
import type { HubSpotDeal, HubSpotOwner, HubSpotPipeline } from '../types'

describe('HubSpot boolean coercion', () => {
  it('maps the strings "true"/"false" to booleans', () => {
    expect(parseHubSpotBool('true')).toBe(true)
    expect(parseHubSpotBool('false')).toBe(false)
    expect(parseHubSpotBool(' TRUE ')).toBe(true)
  })

  it('treats anything else as unknown, never as false', () => {
    expect(parseHubSpotBool(null)).toBeNull()
    expect(parseHubSpotBool(undefined)).toBeNull()
    expect(parseHubSpotBool('')).toBeNull()
    expect(parseHubSpotBool('yes')).toBeNull()
  })
})

describe('HubSpot number coercion', () => {
  it('parses numeric strings, keeping zero', () => {
    expect(parseHubSpotNumber('1250.50')).toBe(1250.5)
    expect(parseHubSpotNumber('0')).toBe(0)
    expect(parseHubSpotNumber('-12')).toBe(-12)
  })

  it('returns null for empty or non-numeric values', () => {
    expect(parseHubSpotNumber('')).toBeNull()
    expect(parseHubSpotNumber('   ')).toBeNull()
    expect(parseHubSpotNumber('abc')).toBeNull()
    expect(parseHubSpotNumber(null)).toBeNull()
  })

  it('rounds money to cents and rejects values the column cannot hold', () => {
    expect(parseHubSpotMoney('48000')).toBe(48000)
    expect(parseHubSpotMoney('1234.567')).toBe(1234.57)
    expect(parseHubSpotMoney('1e13')).toBeNull()
  })

  it('accepts probabilities only in 0..1', () => {
    expect(parseProbability('0.2')).toBe(0.2)
    expect(parseProbability('1')).toBe(1)
    expect(parseProbability('0')).toBe(0)
    expect(parseProbability('1.5')).toBeNull()
    expect(parseProbability('-0.1')).toBeNull()
  })
})

describe('HubSpot date coercion', () => {
  it('normalises ISO and epoch-ms timestamps to ISO', () => {
    expect(parseHubSpotTimestamp('2026-03-31T16:12:11.183Z')).toBe('2026-03-31T16:12:11.183Z')
    expect(parseHubSpotTimestamp('1774973531183')).toBe('2026-03-31T16:12:11.183Z')
    expect(parseHubSpotTimestamp('not a date')).toBeNull()
    expect(parseHubSpotTimestamp('')).toBeNull()
  })

  it('reduces close dates to YYYY-MM-DD', () => {
    expect(parseHubSpotDate('2026-03-31T00:00:00Z')).toBe('2026-03-31')
    expect(parseHubSpotDate('2026-03-31')).toBe('2026-03-31')
    expect(parseHubSpotDate(null)).toBeNull()
  })
})

describe('dealToRow', () => {
  // Custom pipeline with numeric stage ids, as in the live portal.
  const pipelines: HubSpotPipeline[] = [
    {
      id: '987654321',
      label: 'New Management Contracts',
      stages: [
        { id: '1879956205', label: 'Proposal Sent', metadata: { isClosed: 'false', probability: '0.4' } },
        { id: '1879956206', label: 'Board Approved', metadata: { isClosed: 'true', probability: '1.0' } },
      ],
    },
    { id: 'default', label: 'Sales Pipeline', stages: [{ id: 'closedlost', label: 'Closed lost', metadata: { isClosed: 'true', probability: '0.0' } }] },
  ]
  const owners: HubSpotOwner[] = [
    { id: '111', firstName: 'Dana', lastName: 'Reyes', email: 'dana@example.com' },
    { id: '222', firstName: '', lastName: '', email: 'former@example.com', archived: true },
  ]
  const lookups = buildLookups(pipelines, owners)
  const syncedAt = '2026-10-08T06:00:00.000Z'

  it('labels numeric custom-pipeline stages from the pipelines API and coerces strings', () => {
    const deal: HubSpotDeal = {
      id: '5001',
      properties: {
        dealname: ' Palm Grove HOA ',
        amount: '36000.00',
        dealstage: '1879956205',
        pipeline: '987654321',
        closedate: '2026-11-15T05:00:00Z',
        hubspot_owner_id: '111',
        createdate: '2026-08-01T12:00:00Z',
        hs_lastmodifieddate: '2026-10-07T18:30:00Z',
        hs_is_closed: 'false',
        hs_is_closed_won: 'false',
        hs_deal_stage_probability: '0.4',
        hs_v2_date_entered_current_stage: '2026-09-20T10:00:00Z',
      },
    }
    expect(dealToRow(deal, lookups, syncedAt)).toEqual({
      hubspot_id: '5001',
      name: 'Palm Grove HOA',
      pipeline_id: '987654321',
      pipeline_label: 'New Management Contracts',
      stage_id: '1879956205',
      stage_label: 'Proposal Sent',
      stage_probability: 0.4,
      is_closed: false,
      is_won: false,
      amount: 36000,
      close_date: '2026-11-15',
      owner_id: '111',
      owner_name: 'Dana Reyes',
      created_at_source: '2026-08-01T12:00:00.000Z',
      updated_at_source: '2026-10-07T18:30:00.000Z',
      stage_entered_at: '2026-09-20T10:00:00.000Z',
      synced_at: syncedAt,
    })
  })

  it('maps "true" won flags and falls back to stage metadata only when the deal property is absent', () => {
    const row = dealToRow(
      {
        id: '5002',
        properties: {
          dealname: 'Lakeside Condo',
          dealstage: '1879956206',
          pipeline: '987654321',
          hs_is_closed_won: 'true',
          amount: '',
          hubspot_owner_id: '222',
        },
      },
      lookups,
      syncedAt,
    )
    expect(row.is_closed).toBe(true) // from stage metadata isClosed "true"
    expect(row.is_won).toBe(true)
    expect(row.stage_probability).toBe(1)
    expect(row.amount).toBeNull() // empty string is unknown, not $0
    expect(row.owner_name).toBe('former@example.com')
  })

  it('leaves labels null for stages the pipelines API does not know', () => {
    const row = dealToRow(
      { id: '5003', properties: { dealname: 'X', dealstage: '999', pipeline: 'missing', hubspot_owner_id: '404' } },
      lookups,
      syncedAt,
    )
    expect(row.stage_label).toBeNull()
    expect(row.pipeline_label).toBeNull()
    expect(row.owner_name).toBeNull()
    expect(row.is_closed).toBe(false)
  })
})
