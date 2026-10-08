// Pure mapping from HubSpot API objects to crm_deals rows.
// No I/O here so the coercion rules are unit-testable.

import type { Database } from '@/lib/types/database'
import type { HubSpotDeal, HubSpotOwner, HubSpotPipeline } from './types'

export type CrmDealInsert = Database['public']['Tables']['crm_deals']['Insert']

/** numeric(14,2) holds |x| < 10^12. */
const MAX_MONEY = 1e12

/** HubSpot booleans are the strings "true"/"false". Anything else is unknown (null). */
export function parseHubSpotBool(value: string | null | undefined): boolean | null {
  if (value === null || value === undefined) return null
  const v = value.trim().toLowerCase()
  if (v === 'true') return true
  if (v === 'false') return false
  return null
}

/** HubSpot numbers are strings; empty or non-numeric means unknown (null). */
export function parseHubSpotNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const v = value.trim()
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Dollars rounded to cents; null when missing or out of the column's range. */
export function parseHubSpotMoney(value: string | null | undefined): number | null {
  const n = parseHubSpotNumber(value)
  if (n === null || Math.abs(n) >= MAX_MONEY) return null
  return Math.round(n * 100) / 100
}

/** Stage probability is a 0..1 fraction; anything outside that is rejected. */
export function parseProbability(value: string | null | undefined): number | null {
  const n = parseHubSpotNumber(value)
  if (n === null || n < 0 || n > 1) return null
  return Math.round(n * 10_000) / 10_000
}

function toEpochMs(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const v = value.trim()
  if (v === '') return null
  // Some HubSpot date properties come back as epoch milliseconds.
  const ms = /^\d{10,}$/.test(v) ? Number(v) : Date.parse(v)
  return Number.isFinite(ms) ? ms : null
}

/** ISO timestamp (UTC) or null. */
export function parseHubSpotTimestamp(value: string | null | undefined): string | null {
  const ms = toEpochMs(value)
  return ms === null ? null : new Date(ms).toISOString()
}

/** YYYY-MM-DD (UTC calendar date of the HubSpot datetime) or null. */
export function parseHubSpotDate(value: string | null | undefined): string | null {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim()
  const ms = toEpochMs(value)
  return ms === null ? null : new Date(ms).toISOString().slice(0, 10)
}

export function ownerDisplayName(owner: HubSpotOwner): string | null {
  const full = [owner.firstName, owner.lastName]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ')
  return full || owner.email?.trim() || null
}

type StageInfo = { label: string; isClosed: boolean | null; probability: number | null }

export type DealLookups = {
  pipelineLabels: Map<string, string>
  /** Keyed by `${pipelineId}|${stageId}`. */
  stagesByPipeline: Map<string, StageInfo>
  /** Fallback when a deal has a stage but no pipeline. First pipeline wins. */
  stagesById: Map<string, StageInfo>
  ownerNames: Map<string, string>
}

/**
 * Build label lookups from the pipelines and owners APIs. Stage ids in custom
 * pipelines are numeric strings, so labels must always come from here.
 */
export function buildLookups(pipelines: HubSpotPipeline[], owners: HubSpotOwner[]): DealLookups {
  const pipelineLabels = new Map<string, string>()
  const stagesByPipeline = new Map<string, StageInfo>()
  const stagesById = new Map<string, StageInfo>()

  for (const p of pipelines) {
    pipelineLabels.set(p.id, p.label)
    for (const s of p.stages ?? []) {
      const info: StageInfo = {
        label: s.label,
        isClosed: parseHubSpotBool(s.metadata?.isClosed),
        probability: parseProbability(s.metadata?.probability),
      }
      stagesByPipeline.set(`${p.id}|${s.id}`, info)
      if (!stagesById.has(s.id)) stagesById.set(s.id, info)
    }
  }

  const ownerNames = new Map<string, string>()
  for (const o of owners) {
    const name = ownerDisplayName(o)
    // Active owners are fetched first; don't let an archived duplicate overwrite them.
    if (name && !ownerNames.has(String(o.id))) ownerNames.set(String(o.id), name)
  }

  return { pipelineLabels, stagesByPipeline, stagesById, ownerNames }
}

function clean(value: string | null | undefined): string | null {
  const v = value?.trim()
  return v ? v : null
}

export function dealToRow(deal: HubSpotDeal, lookups: DealLookups, syncedAt: string): CrmDealInsert {
  const p = deal.properties ?? {}
  const pipelineId = clean(p.pipeline)
  const stageId = clean(p.dealstage)
  const ownerId = clean(p.hubspot_owner_id)

  const stage = stageId
    ? (pipelineId ? lookups.stagesByPipeline.get(`${pipelineId}|${stageId}`) : undefined) ??
      lookups.stagesById.get(stageId)
    : undefined

  return {
    hubspot_id: String(deal.id),
    name: clean(p.dealname) ?? `(unnamed deal ${deal.id})`,
    pipeline_id: pipelineId,
    pipeline_label: pipelineId ? (lookups.pipelineLabels.get(pipelineId) ?? null) : null,
    stage_id: stageId,
    stage_label: stage?.label ?? null,
    stage_probability: parseProbability(p.hs_deal_stage_probability) ?? stage?.probability ?? null,
    is_closed: parseHubSpotBool(p.hs_is_closed) ?? stage?.isClosed ?? false,
    is_won: parseHubSpotBool(p.hs_is_closed_won) ?? false,
    amount: parseHubSpotMoney(p.amount),
    close_date: parseHubSpotDate(p.closedate),
    owner_id: ownerId,
    owner_name: ownerId ? (lookups.ownerNames.get(ownerId) ?? null) : null,
    created_at_source: parseHubSpotTimestamp(p.createdate ?? deal.createdAt),
    updated_at_source: parseHubSpotTimestamp(p.hs_lastmodifieddate ?? deal.updatedAt),
    stage_entered_at: parseHubSpotTimestamp(p.hs_v2_date_entered_current_stage),
    synced_at: syncedAt,
  }
}
