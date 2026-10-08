// HubSpot deals -> crm_deals. Full sync each run (deal counts are small).
// Records a sync_runs row with source 'hubspot'.

import type { AdminClient } from '@/lib/supabase/admin'
import { finishSyncRun, startSyncRun } from '@/lib/runs'
import { HubSpotClient } from './client'
import { buildLookups, dealToRow } from './map'

const UPSERT_BATCH = 500

export type HubSpotSyncResult = {
  rows: number
  /** crm_deals rows removed because the deal no longer exists (or is archived) in HubSpot. */
  removed: number
  pipelines: number
  owners: number
  unlabeledStages: number
}

export type HubSpotSyncOptions = {
  /** Injected for tests. Defaults to a client using HUBSPOT_ACCESS_TOKEN. */
  client?: HubSpotClient
  now?: () => Date
}

export async function syncHubSpotDeals(
  db: AdminClient,
  options: HubSpotSyncOptions = {},
): Promise<HubSpotSyncResult> {
  // Throws HubSpotConfigError before a run is recorded when the token is missing.
  const client = options.client ?? new HubSpotClient()
  const now = options.now ?? (() => new Date())

  const runId = await startSyncRun(db, 'hubspot')
  let rows = 0
  try {
    const [pipelines, owners] = await Promise.all([client.fetchDealPipelines(), client.fetchOwners()])
    const deals = await client.fetchAllDeals()
    const lookups = buildLookups(pipelines, owners)

    const syncedAt = now().toISOString()
    const records = deals.map((d) => dealToRow(d, lookups, syncedAt))
    const unlabeledStages = records.filter((r) => r.stage_id && !r.stage_label).length

    for (let i = 0; i < records.length; i += UPSERT_BATCH) {
      const batch = records.slice(i, i + UPSERT_BATCH)
      const { error } = await db.from('crm_deals').upsert(batch, { onConflict: 'hubspot_id' })
      if (error) throw new Error(`crm_deals upsert failed: ${error.message}`)
      rows += batch.length
    }

    // Every live deal was just stamped with syncedAt, so anything older was deleted
    // or archived in HubSpot. Skip the purge if HubSpot returned nothing at all, so an
    // unexpected empty response can never wipe the table.
    let removed = 0
    if (records.length > 0) {
      const { data, error } = await db.from('crm_deals').delete().lt('synced_at', syncedAt).select('id')
      if (error) throw new Error(`crm_deals cleanup failed: ${error.message}`)
      removed = data?.length ?? 0
    }

    const result: HubSpotSyncResult = {
      rows,
      removed,
      pipelines: pipelines.length,
      owners: owners.length,
      unlabeledStages,
    }
    await finishSyncRun(db, runId, { ok: true, rows, detail: result })
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finishSyncRun(db, runId, { ok: false, error: message, rows })
    throw err
  }
}
