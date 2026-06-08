// ---------------------------------------------------------------------------
// HubSpot CRM API Client
// ---------------------------------------------------------------------------
// Handles paginated fetches for deals, contacts, and companies with rate
// limiting (10 req/sec for HubSpot private apps) and proper error handling
// for 401 (token expired) and 429 (rate limit).

import { withTimeout } from '@/lib/resilience'
import type {
  HubSpotPaginatedResponse,
  HubSpotDeal,
  HubSpotContact,
  HubSpotCompany,
  HubSpotOwner,
} from './types'

const HUBSPOT_API_BASE = 'https://api.hubapi.com'

// HubSpot rate limit: 10 requests/second for private apps
const RATE_LIMIT_WINDOW_MS = 1000
const RATE_LIMIT_MAX_REQUESTS = 10
const REQUEST_TIMEOUT_MS = 15_000
const MAX_PAGE_SIZE = 100 // HubSpot CRM v3 max

// ---------------------------------------------------------------------------
// Rate Limiter (sliding window, same pattern as QuickBooks client)
// ---------------------------------------------------------------------------

class RateLimiter {
  private timestamps: number[] = []
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs)

    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0]
      const waitMs = this.windowMs - (now - oldestInWindow) + 10
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return this.acquire()
    }

    this.timestamps.push(now)
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class HubSpotAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HubSpotAuthError'
  }
}

export class HubSpotRateLimitError extends Error {
  public retryAfterMs: number
  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.name = 'HubSpotRateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

export class HubSpotApiError extends Error {
  public status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'HubSpotApiError'
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Core fetch helper with rate limiting and retry
// ---------------------------------------------------------------------------

async function hubspotFetch<T>(
  accessToken: string,
  path: string,
  options: { maxRetries?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await rateLimiter.acquire()

    const url = `${HUBSPOT_API_BASE}${path}`
    const response = await withTimeout(
      fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
      REQUEST_TIMEOUT_MS,
      'hubspot-api'
    )

    // 401: Token is invalid or expired — no point retrying
    if (response.status === 401) {
      const body = await response.text().catch(() => 'Unknown error')
      throw new HubSpotAuthError(
        `HubSpot authentication failed (401). Token may be expired or revoked. ${body}`
      )
    }

    // 429: Rate limited — back off and retry
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1', 10)
      const retryMs = retryAfter * 1000
      lastError = new HubSpotRateLimitError(
        `HubSpot rate limit exceeded (429). Retry after ${retryAfter}s`,
        retryMs
      )
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryMs))
        continue
      }
      throw lastError
    }

    // Other non-2xx
    if (!response.ok) {
      const body = await response.text().catch(() => 'Unknown error')
      throw new HubSpotApiError(
        `HubSpot API error ${response.status}: ${body}`,
        response.status
      )
    }

    return (await response.json()) as T
  }

  throw lastError ?? new Error('HubSpot request failed after retries')
}

// ---------------------------------------------------------------------------
// Public API: Paginated fetchers
// ---------------------------------------------------------------------------

/** Properties to request for each object type */
const DEAL_PROPERTIES = [
  'dealname',
  'amount',
  'dealstage',
  'pipeline',
  'closedate',
  'createdate',
  'hs_lastmodifieddate',
  'hubspot_owner_id',
  'description',
  'num_associated_contacts',
]

const CONTACT_PROPERTIES = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'jobtitle',
  'company',
  'city',
  'state',
  'zip',
  'address',
  'createdate',
  'hs_lastmodifieddate',
  'hubspot_owner_id',
]

const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'phone',
  'city',
  'state',
  'zip',
  'address',
  'numberofemployees',
  'annualrevenue',
  'industry',
  'createdate',
  'hs_lastmodifieddate',
  'hubspot_owner_id',
]

function buildPropertiesQuery(properties: string[]): string {
  return properties.map((p) => `properties=${encodeURIComponent(p)}`).join('&')
}

/**
 * Fetch a single page of deals from HubSpot CRM v3.
 * Returns results and optional cursor for next page.
 */
export async function fetchDeals(
  accessToken: string,
  cursor?: string
): Promise<{ deals: HubSpotDeal[]; nextCursor: string | null }> {
  const props = buildPropertiesQuery(DEAL_PROPERTIES)
  let path = `/crm/v3/objects/deals?limit=${MAX_PAGE_SIZE}&${props}`
  if (cursor) path += `&after=${encodeURIComponent(cursor)}`

  const data = await hubspotFetch<HubSpotPaginatedResponse<HubSpotDeal>>(
    accessToken,
    path
  )

  return {
    deals: data.results ?? [],
    nextCursor: data.paging?.next?.after ?? null,
  }
}

/**
 * Fetch ALL deals across all pages.
 */
export async function fetchAllDeals(
  accessToken: string
): Promise<HubSpotDeal[]> {
  const allDeals: HubSpotDeal[] = []
  let cursor: string | null = null

  do {
    const page = await fetchDeals(accessToken, cursor ?? undefined)
    allDeals.push(...page.deals)
    cursor = page.nextCursor
  } while (cursor)

  return allDeals
}

/**
 * Fetch a single page of contacts from HubSpot CRM v3.
 */
export async function fetchContacts(
  accessToken: string,
  cursor?: string
): Promise<{ contacts: HubSpotContact[]; nextCursor: string | null }> {
  const props = buildPropertiesQuery(CONTACT_PROPERTIES)
  let path = `/crm/v3/objects/contacts?limit=${MAX_PAGE_SIZE}&${props}`
  if (cursor) path += `&after=${encodeURIComponent(cursor)}`

  const data = await hubspotFetch<HubSpotPaginatedResponse<HubSpotContact>>(
    accessToken,
    path
  )

  return {
    contacts: data.results ?? [],
    nextCursor: data.paging?.next?.after ?? null,
  }
}

/**
 * Fetch ALL contacts across all pages.
 */
export async function fetchAllContacts(
  accessToken: string
): Promise<HubSpotContact[]> {
  const allContacts: HubSpotContact[] = []
  let cursor: string | null = null

  do {
    const page = await fetchContacts(accessToken, cursor ?? undefined)
    allContacts.push(...page.contacts)
    cursor = page.nextCursor
  } while (cursor)

  return allContacts
}

/**
 * Fetch a single page of companies from HubSpot CRM v3.
 */
export async function fetchCompanies(
  accessToken: string,
  cursor?: string
): Promise<{ companies: HubSpotCompany[]; nextCursor: string | null }> {
  const props = buildPropertiesQuery(COMPANY_PROPERTIES)
  let path = `/crm/v3/objects/companies?limit=${MAX_PAGE_SIZE}&${props}`
  if (cursor) path += `&after=${encodeURIComponent(cursor)}`

  const data = await hubspotFetch<HubSpotPaginatedResponse<HubSpotCompany>>(
    accessToken,
    path
  )

  return {
    companies: data.results ?? [],
    nextCursor: data.paging?.next?.after ?? null,
  }
}

/**
 * Fetch ALL companies across all pages.
 */
export async function fetchAllCompanies(
  accessToken: string
): Promise<HubSpotCompany[]> {
  const allCompanies: HubSpotCompany[] = []
  let cursor: string | null = null

  do {
    const page = await fetchCompanies(accessToken, cursor ?? undefined)
    allCompanies.push(...page.companies)
    cursor = page.nextCursor
  } while (cursor)

  return allCompanies
}

/**
 * Fetch HubSpot owners (used to resolve hubspot_owner_id to contact info).
 */
export async function fetchOwners(
  accessToken: string
): Promise<HubSpotOwner[]> {
  const data = await hubspotFetch<{ results: HubSpotOwner[] }>(
    accessToken,
    '/crm/v3/owners?limit=500'
  )
  return data.results ?? []
}

/**
 * Resolve the HubSpot access token from environment.
 * Supports HUBSPOT_ACCESS_TOKEN (preferred) or HUBSPOT_API_KEY (legacy).
 */
export function getHubSpotAccessToken(): string {
  const token =
    process.env.HUBSPOT_ACCESS_TOKEN ?? process.env.HUBSPOT_API_KEY
  if (!token) {
    throw new HubSpotAuthError(
      'HubSpot integration not configured. Set HUBSPOT_ACCESS_TOKEN environment variable.'
    )
  }
  return token
}
