// QuickBooks Online Reports API client.
// GET {apiBase}/v3/company/{realmId}/reports/{ReportName}?...&minorversion=75

import { QBO_MINOR_VERSION } from './config'
import type { QboReport } from './report-parser'
import type { FetchLike } from './tokens'

const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 5
const MAX_RETRY_WAIT_MS = 60_000

export type QboReportName = 'ProfitAndLoss' | 'BalanceSheet' | 'AgedReceivables'

export class QuickBooksApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'QuickBooksApiError'
    this.status = status
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function retryAfterMs(value: string | null): number | null {
  if (!value) return null
  const v = value.trim()
  if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v) * 1000)
  const at = Date.parse(v)
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now())
}

/** First Fault error message from an Intuit error body, without echoing anything else. */
function faultMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const fault = (body as { Fault?: { Error?: { Message?: unknown; Detail?: unknown; code?: unknown }[] } }).Fault
  const first = fault?.Error?.[0]
  if (!first) return null
  const parts = [first.code, first.Message, first.Detail].filter((p) => typeof p === 'string' && p) as string[]
  return parts.join(': ').slice(0, 300) || 'QuickBooks returned a Fault'
}

export type QuickBooksClientOptions = {
  apiBase: string
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export class QuickBooksClient {
  private readonly apiBase: string
  private readonly fetchImpl: FetchLike
  private readonly sleep: (ms: number) => Promise<void>

  constructor(options: QuickBooksClientOptions) {
    this.apiBase = options.apiBase
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init))
    this.sleep = options.sleep ?? defaultSleep
  }

  async fetchReport(
    realmId: string,
    accessToken: string,
    report: QboReportName,
    params: Record<string, string>,
  ): Promise<QboReport> {
    const url = new URL(
      `/v3/company/${encodeURIComponent(realmId)}/reports/${report}`,
      this.apiBase,
    )
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    url.searchParams.set('minorversion', QBO_MINOR_VERSION)

    for (let attempt = 1; ; attempt++) {
      let res: Response
      try {
        res = await this.fetchImpl(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: 'no-store',
        })
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS) {
          throw new QuickBooksApiError(
            `QuickBooks ${report} request failed: ${err instanceof Error ? err.message : 'network error'}`,
            0,
          )
        }
        await this.sleep(Math.min(1000 * 2 ** (attempt - 1), 10_000))
        continue
      }

      if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
        const wait = retryAfterMs(res.headers.get('retry-after')) ?? Math.min(1000 * 2 ** attempt, 30_000)
        await res.body?.cancel().catch(() => undefined)
        await this.sleep(Math.min(wait, MAX_RETRY_WAIT_MS))
        continue
      }

      let body: unknown = null
      try {
        body = await res.json()
      } catch {
        // non-JSON body
      }

      if (res.status === 401 || res.status === 403) {
        throw new QuickBooksApiError(
          `QuickBooks rejected the access token for ${report} (HTTP ${res.status}); reconnect the company if this persists`,
          res.status,
        )
      }
      const fault = faultMessage(body)
      if (!res.ok || fault) {
        throw new QuickBooksApiError(
          `QuickBooks ${report} failed with HTTP ${res.status}${fault ? `: ${fault}` : ''}`,
          res.status,
        )
      }
      if (!body || typeof body !== 'object' || !('Header' in body)) {
        throw new QuickBooksApiError(`QuickBooks ${report} returned an unexpected response`, res.status)
      }
      return body as QboReport
    }
  }
}
