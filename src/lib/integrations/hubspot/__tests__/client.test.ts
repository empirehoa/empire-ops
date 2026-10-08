import { describe, expect, it, vi } from 'vitest'
import {
  HUBSPOT_AUTH_ERROR_MESSAGE,
  HubSpotApiError,
  HubSpotAuthError,
  HubSpotClient,
  HubSpotConfigError,
  parseRetryAfter,
} from '../client'
import { HUBSPOT_DEAL_PROPERTIES } from '../types'

const TOKEN = 'pat-na1-test-token-do-not-log'

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function client(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, sleep = vi.fn(async () => {})) {
  return { c: new HubSpotClient({ accessToken: TOKEN, fetchImpl, sleep }), sleep }
}

describe('HubSpotClient pagination', () => {
  it('follows paging.next.after until exhausted and requests every property', async () => {
    const urls: URL[] = []
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      urls.push(new URL(url))
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
      const after = new URL(url).searchParams.get('after')
      if (!after) return json({ results: [{ id: '1', properties: {} }, { id: '2', properties: {} }], paging: { next: { after: 'cursor-2' } } })
      if (after === 'cursor-2') return json({ results: [{ id: '3', properties: {} }], paging: { next: { after: 'cursor-3' } } })
      return json({ results: [{ id: '4', properties: {} }] })
    })
    const { c } = client(fetchImpl)

    const deals = await c.fetchAllDeals()

    expect(deals.map((d) => d.id)).toEqual(['1', '2', '3', '4'])
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(urls[0].pathname).toBe('/crm/v3/objects/deals')
    expect(urls[0].searchParams.get('limit')).toBe('100')
    expect(urls[0].searchParams.get('properties')?.split(',')).toEqual([...HUBSPOT_DEAL_PROPERTIES])
    expect(urls[1].searchParams.get('after')).toBe('cursor-2')
    expect(urls[2].searchParams.get('after')).toBe('cursor-3')
  })

  it('pages owners and includes archived owners', async () => {
    const seen: string[] = []
    const fetchImpl = vi.fn(async (url: string) => {
      const u = new URL(url)
      seen.push(`${u.searchParams.get('archived')}:${u.searchParams.get('after') ?? ''}`)
      if (u.searchParams.get('archived') === 'false' && !u.searchParams.get('after')) {
        return json({ results: [{ id: '1' }], paging: { next: { after: 'x' } } })
      }
      if (u.searchParams.get('archived') === 'false') return json({ results: [{ id: '2' }] })
      return json({ results: [{ id: '3', archived: true }] })
    })
    const { c } = client(fetchImpl)
    const owners = await c.fetchOwners()
    expect(owners.map((o) => o.id)).toEqual(['1', '2', '3'])
    expect(seen).toEqual(['false:', 'false:x', 'true:'])
  })
})

describe('HubSpotClient errors and backoff', () => {
  it('waits for Retry-After on 429 and then succeeds', async () => {
    let calls = 0
    const fetchImpl = vi.fn(async () => {
      calls++
      if (calls === 1) return new Response('{"message":"rate limited"}', { status: 429, headers: { 'Retry-After': '2' } })
      return json({ results: [] })
    })
    const { c, sleep } = client(fetchImpl)
    await expect(c.fetchDealPipelines()).resolves.toEqual([])
    expect(sleep).toHaveBeenCalledWith(2000)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('backs off exponentially on 429 without Retry-After, then gives up', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"message":"slow down"}', { status: 429 }))
    const { c, sleep } = client(fetchImpl)
    await expect(c.fetchDealPipelines()).rejects.toBeInstanceOf(HubSpotApiError)
    expect(fetchImpl).toHaveBeenCalledTimes(6)
    expect(sleep.mock.calls.map((a) => (a as unknown[])[0])).toEqual([1000, 2000, 4000, 8000, 10000])
  })

  it('throws a clear scope error on 401 without retrying or leaking the token', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"message":"Authentication credentials not found"}', { status: 401 }))
    const { c } = client(fetchImpl)
    const err = await c.fetchAllDeals().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(HubSpotAuthError)
    expect((err as Error).message).toContain(HUBSPOT_AUTH_ERROR_MESSAGE)
    expect((err as Error).message).toContain('crm.objects.deals.read')
    expect((err as Error).message).not.toContain(TOKEN)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('treats 403 (missing scopes) as an auth error too', async () => {
    const { c } = client(vi.fn(async () => new Response('{}', { status: 403 })))
    await expect(c.fetchOwners()).rejects.toBeInstanceOf(HubSpotAuthError)
  })

  it('refuses to construct without a token', () => {
    const prev = process.env.HUBSPOT_ACCESS_TOKEN
    delete process.env.HUBSPOT_ACCESS_TOKEN
    try {
      expect(() => new HubSpotClient()).toThrow(HubSpotConfigError)
    } finally {
      if (prev !== undefined) process.env.HUBSPOT_ACCESS_TOKEN = prev
    }
  })
})

describe('parseRetryAfter', () => {
  it('handles seconds, HTTP dates and garbage', () => {
    expect(parseRetryAfter('10')).toBe(10_000)
    expect(parseRetryAfter('0.5')).toBe(500)
    const now = Date.parse('2026-10-08T06:00:00Z')
    expect(parseRetryAfter('Thu, 08 Oct 2026 06:00:03 GMT', now)).toBe(3000)
    expect(parseRetryAfter('soon')).toBeNull()
    expect(parseRetryAfter(null)).toBeNull()
  })
})
