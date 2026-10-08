// HubSpot CRM v3 client (private app token).
// Reads deals, deal pipelines (for stage/pipeline labels) and owners.
// The token is only ever placed in the Authorization header; it never
// appears in error messages or logs.

import {
  HUBSPOT_DEAL_PROPERTIES,
  type HubSpotDeal,
  type HubSpotOwner,
  type HubSpotPage,
  type HubSpotPipeline,
} from './types'

export const HUBSPOT_API_BASE = 'https://api.hubapi.com'

const PAGE_SIZE = 100 // CRM v3 objects maximum
const OWNERS_PAGE_SIZE = 100
const REQUEST_TIMEOUT_MS = 20_000
const MAX_ATTEMPTS = 6
const MAX_RETRY_WAIT_MS = 60_000
/** Safety stop for runaway pagination (100 per page => 200k deals). */
const MAX_PAGES = 2_000

export const HUBSPOT_AUTH_ERROR_MESSAGE =
  'HubSpot token invalid or missing scopes (crm.objects.deals.read, crm.objects.owners.read)'

export class HubSpotConfigError extends Error {
  constructor() {
    super('HUBSPOT_ACCESS_TOKEN is not set')
    this.name = 'HubSpotConfigError'
  }
}

export class HubSpotAuthError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`${HUBSPOT_AUTH_ERROR_MESSAGE} [HTTP ${status}]`)
    this.name = 'HubSpotAuthError'
    this.status = status
  }
}

export class HubSpotApiError extends Error {
  readonly status: number
  constructor(status: number, path: string, detail: string) {
    super(`HubSpot request ${path} failed with HTTP ${status}${detail ? `: ${detail}` : ''}`)
    this.name = 'HubSpotApiError'
    this.status = status
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export type HubSpotClientOptions = {
  /** Defaults to process.env.HUBSPOT_ACCESS_TOKEN. */
  accessToken?: string
  fetchImpl?: FetchLike
  /** Injected for tests so retries don't actually wait. */
  sleep?: (ms: number) => Promise<void>
  baseUrl?: string
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function isHubSpotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN?.trim())
}

/**
 * Parse a Retry-After header (delta-seconds or HTTP date) into milliseconds.
 * Returns null when the header is absent or unparseable.
 */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.round(Number(trimmed) * 1000)
  const at = Date.parse(trimmed)
  if (Number.isNaN(at)) return null
  return Math.max(0, at - now)
}

/** Pull a short, safe error description out of a HubSpot error body. */
async function errorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text()
    try {
      const body = JSON.parse(text) as { message?: unknown; category?: unknown }
      const parts = [body.category, body.message].filter((p): p is string => typeof p === 'string')
      if (parts.length) return parts.join(': ').slice(0, 300)
    } catch {
      // not JSON
    }
    return text.slice(0, 200)
  } catch {
    return ''
  }
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), 10_000)
}

export class HubSpotClient {
  private readonly token: string
  private readonly fetchImpl: FetchLike
  private readonly sleep: (ms: number) => Promise<void>
  private readonly baseUrl: string

  constructor(options: HubSpotClientOptions = {}) {
    const token = options.accessToken ?? process.env.HUBSPOT_ACCESS_TOKEN
    if (!token || !token.trim()) throw new HubSpotConfigError()
    this.token = token.trim()
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init))
    this.sleep = options.sleep ?? defaultSleep
    this.baseUrl = options.baseUrl ?? HUBSPOT_API_BASE
  }

  /** GET with 429/5xx backoff (honouring Retry-After) and 401/403 auth errors. */
  async get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl)
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v)

    for (let attempt = 1; ; attempt++) {
      let res: Response
      try {
        res = await this.fetchImpl(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: 'no-store',
        })
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS) {
          const reason = err instanceof Error ? err.message : 'network error'
          throw new HubSpotApiError(0, path, reason)
        }
        await this.sleep(backoffMs(attempt))
        continue
      }

      if (res.ok) return (await res.json()) as T

      // HubSpot answers 401 for a bad/revoked token and 403 for missing scopes.
      if (res.status === 401 || res.status === 403) throw new HubSpotAuthError(res.status)

      const retryable = res.status === 429 || res.status >= 500
      if (retryable && attempt < MAX_ATTEMPTS) {
        const retryAfter = res.status === 429 ? parseRetryAfter(res.headers.get('retry-after')) : null
        await res.body?.cancel().catch(() => undefined)
        await this.sleep(Math.min(retryAfter ?? backoffMs(attempt), MAX_RETRY_WAIT_MS))
        continue
      }

      throw new HubSpotApiError(res.status, path, await errorDetail(res))
    }
  }

  /** Every non-archived deal, following paging.next.after until exhausted. */
  async fetchAllDeals(): Promise<HubSpotDeal[]> {
    const deals: HubSpotDeal[] = []
    let after: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = await this.get<HubSpotPage<HubSpotDeal>>('/crm/v3/objects/deals', {
        limit: String(PAGE_SIZE),
        properties: HUBSPOT_DEAL_PROPERTIES.join(','),
        archived: 'false',
        after,
      })
      deals.push(...(body.results ?? []))
      after = body.paging?.next?.after
      if (!after) return deals
    }
    throw new HubSpotApiError(0, '/crm/v3/objects/deals', `pagination exceeded ${MAX_PAGES} pages`)
  }

  /** All deal pipelines with their stages (labels, isClosed, probability). */
  async fetchDealPipelines(): Promise<HubSpotPipeline[]> {
    const body = await this.get<{ results: HubSpotPipeline[] }>('/crm/v3/pipelines/deals')
    return body.results ?? []
  }

  /** Active and archived owners, so deals owned by former users still get a name. */
  async fetchOwners(): Promise<HubSpotOwner[]> {
    const owners: HubSpotOwner[] = []
    for (const archived of ['false', 'true']) {
      let after: string | undefined
      for (let page = 0; page < MAX_PAGES; page++) {
        const body = await this.get<HubSpotPage<HubSpotOwner>>('/crm/v3/owners', {
          limit: String(OWNERS_PAGE_SIZE),
          archived,
          after,
        })
        owners.push(...(body.results ?? []))
        after = body.paging?.next?.after
        if (!after) break
      }
    }
    return owners
  }
}
