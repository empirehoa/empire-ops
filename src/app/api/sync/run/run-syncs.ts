import type { AdminClient } from '@/lib/supabase/admin'
import { isHubSpotConfigured, syncHubSpotDeals } from '@/lib/integrations/hubspot'
import { quickBooksConfigProblem, syncAllQuickBooks } from '@/lib/integrations/quickbooks'

export type SourceResult =
  | { status: 'succeeded'; durationMs: number; result: unknown }
  | { status: 'failed'; durationMs: number; error: string; result?: unknown }
  | { status: 'skipped'; reason: string }

export type SyncSources = {
  hubspot: {
    configured: () => string | null
    run: (db: AdminClient) => Promise<unknown>
  }
  quickbooks: {
    configured: () => string | null
    run: (db: AdminClient) => Promise<unknown>
  }
}

export const defaultSources: SyncSources = {
  hubspot: {
    configured: () => (isHubSpotConfigured() ? null : 'HUBSPOT_ACCESS_TOKEN is not set'),
    run: (db) => syncHubSpotDeals(db),
  },
  quickbooks: {
    configured: () => quickBooksConfigProblem(),
    run: async (db) => {
      const result = await syncAllQuickBooks(db)
      if (result.failed.length > 0) {
        // Surface partial failures as a failed source while keeping the detail.
        const error = result.failed.map((f) => `${f.company}: ${f.error}`).join('; ')
        throw Object.assign(new Error(error), { result })
      }
      return result
    },
  },
}

async function runOne(
  source: SyncSources[keyof SyncSources],
  db: AdminClient,
  label: string,
): Promise<SourceResult> {
  const reason = source.configured()
  if (reason) return { status: 'skipped', reason }
  const started = Date.now()
  try {
    const result = await source.run(db)
    return { status: 'succeeded', durationMs: Date.now() - started, result }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[sync/run] ${label} failed:`, error)
    const partial = err && typeof err === 'object' && 'result' in err ? (err as { result: unknown }).result : undefined
    return { status: 'failed', durationMs: Date.now() - started, error, ...(partial ? { result: partial } : {}) }
  }
}

/** HubSpot first, then QuickBooks; each isolated from the other's failure. */
export async function runAllSyncs(
  db: AdminClient,
  sources: SyncSources = defaultSources,
): Promise<{ hubspot: SourceResult; quickbooks: SourceResult }> {
  const hubspot = await runOne(sources.hubspot, db, 'hubspot')
  const quickbooks = await runOne(sources.quickbooks, db, 'quickbooks')
  return { hubspot, quickbooks }
}
