// ---------------------------------------------------------------------------
// HubSpot CRM Sync Service
// ---------------------------------------------------------------------------
// Pulls deals, contacts, and companies from HubSpot and upserts into the
// Vera leads table. Logs sync progress to integration_sync_logs.

import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchAllDeals,
  fetchAllContacts,
  fetchAllCompanies,
  fetchOwners,
  getHubSpotAccessToken,
} from './client'
import {
  mapDealStageToLeadStage,
  type HubSpotDeal,
  type HubSpotContact,
  type HubSpotOwner,
  type HubSpotSyncEntityType,
  type HubSpotSyncLogEntry,
  type HubSpotSyncResult,
} from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createLogEntry(entityType: HubSpotSyncEntityType): HubSpotSyncLogEntry {
  return {
    entity_type: entityType,
    direction: 'pull',
    started_at: new Date().toISOString(),
    completed_at: null,
    records_processed: 0,
    records_created: 0,
    records_updated: 0,
    records_skipped: 0,
    records_failed: 0,
    error_message: null,
    status: 'running',
  }
}

/**
 * Build a lookup map from HubSpot owner ID to owner info.
 * Used to populate contact fields on leads from the deal's owner.
 */
function buildOwnerMap(
  owners: HubSpotOwner[]
): Map<string, HubSpotOwner> {
  const map = new Map<string, HubSpotOwner>()
  for (const owner of owners) {
    map.set(owner.id, owner)
  }
  return map
}

/**
 * Build a lookup map from HubSpot contact ID to contact record.
 * If a deal's associated contact is in this map, we use their details.
 */
function buildContactMap(
  contacts: HubSpotContact[]
): Map<string, HubSpotContact> {
  const map = new Map<string, HubSpotContact>()
  for (const contact of contacts) {
    map.set(contact.id, contact)
  }
  return map
}

/**
 * Parse a HubSpot monetary amount string to a number, or null.
 * HubSpot stores amounts as strings like "5000.00".
 */
function parseAmount(value: string | null | undefined): number | null {
  if (!value) return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Parse a HubSpot integer string (e.g., unit count), or null.
 */
function parseIntOrNull(value: string | null | undefined): number | null {
  if (!value) return null
  const num = parseInt(value, 10)
  return isNaN(num) ? null : num
}

// ---------------------------------------------------------------------------
// Sync deals -> leads
// ---------------------------------------------------------------------------

async function syncDeals(
  tenantId: string,
  accessToken: string,
  contactMap: Map<string, HubSpotContact>,
  ownerMap: Map<string, HubSpotOwner>
): Promise<HubSpotSyncLogEntry> {
  const log = createLogEntry('deals')
  const supabase = createAdminClient()

  try {
    const deals = await fetchAllDeals(accessToken)
    log.records_processed = deals.length

    for (const deal of deals) {
      try {
        if (deal.archived) {
          log.records_skipped++
          continue
        }

        const dealName = deal.properties.dealname
        if (!dealName) {
          log.records_skipped++
          continue
        }

        // Resolve contact info from the deal's HubSpot owner
        const ownerId = deal.properties.hubspot_owner_id
        const owner = ownerId ? ownerMap.get(ownerId) : null

        // Map HubSpot deal stage to Vera lead stage
        const veraStage = mapDealStageToLeadStage(deal.properties.dealstage)

        // Build the lead record
        const estimatedAnnual = parseAmount(deal.properties.amount)
        const leadRecord = {
          tenant_id: tenantId,
          association_name: dealName,
          stage: veraStage,
          estimated_annual_value: estimatedAnnual,
          estimated_monthly_fee: estimatedAnnual ? Math.round((estimatedAnnual / 12) * 100) / 100 : null,
          expected_close_date: deal.properties.closedate ?? null,
          contact_name: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
          contact_email: owner?.email ?? null,
          notes: deal.properties.description ?? null,
          stage_changed_at: deal.updatedAt ?? new Date().toISOString(),
          metadata: {
            hubspot_deal_id: deal.id,
            hubspot_pipeline: deal.properties.pipeline ?? null,
            hubspot_owner_id: ownerId ?? null,
            hubspot_stage_raw: deal.properties.dealstage ?? null,
            source: 'hubspot_sync',
            last_synced_at: new Date().toISOString(),
          },
        }

        // Upsert: look for existing lead with matching hubspot_deal_id in metadata
        const { data: existing } = await supabase
          .from('leads')
          .select('id, metadata')
          .eq('tenant_id', tenantId)
          .contains('metadata', { hubspot_deal_id: deal.id })
          .maybeSingle()

        if (existing) {
          // Update existing lead
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              ...leadRecord,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .eq('tenant_id', tenantId)

          if (updateError) throw updateError
          log.records_updated++
        } else {
          // Also check by association_name to avoid duplicates
          const { data: byName } = await supabase
            .from('leads')
            .select('id, metadata')
            .eq('tenant_id', tenantId)
            .eq('association_name', dealName)
            .maybeSingle()

          if (byName) {
            // Update existing, now linking to HubSpot
            const existingMeta = (byName.metadata as Record<string, unknown>) ?? {}
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                ...leadRecord,
                metadata: { ...existingMeta, ...leadRecord.metadata },
                updated_at: new Date().toISOString(),
              })
              .eq('id', byName.id)
              .eq('tenant_id', tenantId)

            if (updateError) throw updateError
            log.records_updated++
          } else {
            // Insert new lead
            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                ...leadRecord,
                created_at: deal.properties.createdate ?? new Date().toISOString(),
              })

            if (insertError) throw insertError
            log.records_created++
          }
        }
      } catch (err) {
        log.records_failed++
        log.error_message = err instanceof Error ? err.message : String(err)
      }
    }

    log.status = 'completed'
    log.completed_at = new Date().toISOString()
  } catch (err) {
    log.status = 'failed'
    log.error_message = err instanceof Error ? err.message : String(err)
    log.completed_at = new Date().toISOString()
  }

  return log
}

// ---------------------------------------------------------------------------
// Sync contacts -> leads (contacts without deals create leads in "new" stage)
// ---------------------------------------------------------------------------

async function syncContacts(
  tenantId: string,
  accessToken: string,
  existingDealContactIds: Set<string>
): Promise<HubSpotSyncLogEntry> {
  const log = createLogEntry('contacts')
  const supabase = createAdminClient()

  try {
    const contacts = await fetchAllContacts(accessToken)
    log.records_processed = contacts.length

    for (const contact of contacts) {
      try {
        if (contact.archived) {
          log.records_skipped++
          continue
        }

        // Skip contacts that are already linked to deals (handled in deals sync)
        if (existingDealContactIds.has(contact.id)) {
          log.records_skipped++
          continue
        }

        const contactName = [
          contact.properties.firstname,
          contact.properties.lastname,
        ]
          .filter(Boolean)
          .join(' ')
          .trim()

        // Need either a name or company to create a lead
        const associationName = contact.properties.company || contactName
        if (!associationName) {
          log.records_skipped++
          continue
        }

        const leadRecord = {
          tenant_id: tenantId,
          association_name: associationName,
          stage: 'new' as const,
          contact_name: contactName || null,
          contact_email: contact.properties.email ?? null,
          contact_phone: contact.properties.phone ?? null,
          contact_title: contact.properties.jobtitle ?? null,
          city: contact.properties.city ?? null,
          state: contact.properties.state ?? null,
          zip: contact.properties.zip ?? null,
          address_line1: contact.properties.address ?? null,
          stage_changed_at: new Date().toISOString(),
          metadata: {
            hubspot_contact_id: contact.id,
            source: 'hubspot_sync',
            last_synced_at: new Date().toISOString(),
          },
        }

        // Check for existing lead with matching hubspot_contact_id
        const { data: existing } = await supabase
          .from('leads')
          .select('id, metadata')
          .eq('tenant_id', tenantId)
          .contains('metadata', { hubspot_contact_id: contact.id })
          .maybeSingle()

        if (existing) {
          const existingMeta = (existing.metadata as Record<string, unknown>) ?? {}
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              ...leadRecord,
              metadata: { ...existingMeta, ...leadRecord.metadata },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .eq('tenant_id', tenantId)

          if (updateError) throw updateError
          log.records_updated++
        } else {
          // Check by email to avoid duplicates
          let foundByEmail = false
          if (contact.properties.email) {
            const { data: byEmail } = await supabase
              .from('leads')
              .select('id, metadata')
              .eq('tenant_id', tenantId)
              .eq('contact_email', contact.properties.email)
              .maybeSingle()

            if (byEmail) {
              const existingMeta = (byEmail.metadata as Record<string, unknown>) ?? {}
              const { error: updateError } = await supabase
                .from('leads')
                .update({
                  ...leadRecord,
                  metadata: { ...existingMeta, ...leadRecord.metadata },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', byEmail.id)
                .eq('tenant_id', tenantId)

              if (updateError) throw updateError
              log.records_updated++
              foundByEmail = true
            }
          }

          if (!foundByEmail) {
            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                ...leadRecord,
                created_at: contact.properties.createdate ?? new Date().toISOString(),
              })

            if (insertError) throw insertError
            log.records_created++
          }
        }
      } catch (err) {
        log.records_failed++
        log.error_message = err instanceof Error ? err.message : String(err)
      }
    }

    log.status = 'completed'
    log.completed_at = new Date().toISOString()
  } catch (err) {
    log.status = 'failed'
    log.error_message = err instanceof Error ? err.message : String(err)
    log.completed_at = new Date().toISOString()
  }

  return log
}

// ---------------------------------------------------------------------------
// Sync companies -> leads (companies create/update leads with org data)
// ---------------------------------------------------------------------------

async function syncCompanies(
  tenantId: string,
  accessToken: string
): Promise<HubSpotSyncLogEntry> {
  const log = createLogEntry('companies')
  const supabase = createAdminClient()

  try {
    const companies = await fetchAllCompanies(accessToken)
    log.records_processed = companies.length

    for (const company of companies) {
      try {
        if (company.archived) {
          log.records_skipped++
          continue
        }

        const companyName = company.properties.name
        if (!companyName) {
          log.records_skipped++
          continue
        }

        const estimatedAnnual = parseAmount(company.properties.annualrevenue)
        const leadRecord = {
          tenant_id: tenantId,
          association_name: companyName,
          association_type: 'HOA' as const,
          unit_count: parseIntOrNull(company.properties.numberofemployees),
          city: company.properties.city ?? null,
          state: company.properties.state ?? null,
          zip: company.properties.zip ?? null,
          address_line1: company.properties.address ?? null,
          estimated_annual_value: estimatedAnnual,
          estimated_monthly_fee: estimatedAnnual ? Math.round((estimatedAnnual / 12) * 100) / 100 : null,
          stage_changed_at: new Date().toISOString(),
          metadata: {
            hubspot_company_id: company.id,
            hubspot_domain: company.properties.domain ?? null,
            hubspot_industry: company.properties.industry ?? null,
            source: 'hubspot_sync',
            last_synced_at: new Date().toISOString(),
          },
        }

        // Check for existing lead with matching hubspot_company_id
        const { data: existing } = await supabase
          .from('leads')
          .select('id, metadata')
          .eq('tenant_id', tenantId)
          .contains('metadata', { hubspot_company_id: company.id })
          .maybeSingle()

        if (existing) {
          const existingMeta = (existing.metadata as Record<string, unknown>) ?? {}
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              ...leadRecord,
              metadata: { ...existingMeta, ...leadRecord.metadata },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .eq('tenant_id', tenantId)

          if (updateError) throw updateError
          log.records_updated++
        } else {
          // Check by name to avoid duplicates
          const { data: byName } = await supabase
            .from('leads')
            .select('id, metadata')
            .eq('tenant_id', tenantId)
            .eq('association_name', companyName)
            .maybeSingle()

          if (byName) {
            const existingMeta = (byName.metadata as Record<string, unknown>) ?? {}
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                ...leadRecord,
                metadata: { ...existingMeta, ...leadRecord.metadata },
                updated_at: new Date().toISOString(),
              })
              .eq('id', byName.id)
              .eq('tenant_id', tenantId)

            if (updateError) throw updateError
            log.records_updated++
          } else {
            const { error: insertError } = await supabase
              .from('leads')
              .insert({
                ...leadRecord,
                stage: 'new',
                created_at: company.properties.createdate ?? new Date().toISOString(),
              })

            if (insertError) throw insertError
            log.records_created++
          }
        }
      } catch (err) {
        log.records_failed++
        log.error_message = err instanceof Error ? err.message : String(err)
      }
    }

    log.status = 'completed'
    log.completed_at = new Date().toISOString()
  } catch (err) {
    log.status = 'failed'
    log.error_message = err instanceof Error ? err.message : String(err)
    log.completed_at = new Date().toISOString()
  }

  return log
}

// ---------------------------------------------------------------------------
// Write sync log to integration_sync_logs table
// ---------------------------------------------------------------------------

async function writeSyncLog(
  tenantId: string,
  integrationId: string | null,
  log: HubSpotSyncLogEntry
): Promise<void> {
  const supabase = createAdminClient()

  await supabase.from('integration_sync_logs').insert({
    tenant_id: tenantId,
    integration_id: integrationId,
    provider: 'hubspot',
    sync_type: `hubspot_${log.entity_type}`,
    status: log.status,
    started_at: log.started_at,
    completed_at: log.completed_at,
    records_synced: log.records_created + log.records_updated,
    records_failed: log.records_failed,
    errors: log.error_message ? { message: log.error_message } : null,
    metadata: {
      entity_type: log.entity_type,
      direction: log.direction,
      records_processed: log.records_processed,
      records_created: log.records_created,
      records_updated: log.records_updated,
      records_skipped: log.records_skipped,
    },
  })
}

// ---------------------------------------------------------------------------
// Update external_integrations record
// ---------------------------------------------------------------------------

async function updateIntegrationStatus(
  tenantId: string,
  result: HubSpotSyncResult
): Promise<string | null> {
  const supabase = createAdminClient()

  const hasFailed = Object.values(result.entity_results).some(
    (r) => r?.status === 'failed'
  )
  const allFailed = Object.values(result.entity_results).every(
    (r) => r?.status === 'failed'
  )

  const status = allFailed ? 'error' : 'connected'
  const errorMessage = hasFailed
    ? Object.values(result.entity_results)
        .filter((r) => r?.status === 'failed')
        .map((r) => `${r!.entity_type}: ${r!.error_message}`)
        .join('; ')
    : null

  // Upsert the external_integrations record
  const { data } = await supabase
    .from('external_integrations')
    .upsert(
      {
        tenant_id: tenantId,
        provider: 'hubspot',
        display_name: 'HubSpot CRM',
        category: 'crm',
        status,
        last_sync_at: new Date().toISOString(),
        error_message: errorMessage,
        config: {
          auto_sync_enabled: false,
          last_full_sync: result.completed_at,
          sync_totals: result.totals,
        },
        credentials: {}, // Token is in env, not stored in DB
      },
      { onConflict: 'tenant_id,provider' }
    )
    .select('id')
    .single()

  return data?.id ?? null
}

// ---------------------------------------------------------------------------
// Full sync orchestrator
// ---------------------------------------------------------------------------

export type HubSpotSyncOptions = {
  entityTypes?: HubSpotSyncEntityType[]
}

export async function runHubSpotSync(
  tenantId: string,
  options: HubSpotSyncOptions = {}
): Promise<HubSpotSyncResult> {
  const startedAt = new Date().toISOString()
  const accessToken = getHubSpotAccessToken()

  const typesToSync = options.entityTypes ?? ['deals', 'contacts', 'companies']
  const entityResults: Partial<Record<HubSpotSyncEntityType, HubSpotSyncLogEntry>> = {}

  // Pre-fetch owners for deal contact resolution
  let ownerMap = new Map<string, HubSpotOwner>()
  try {
    const owners = await fetchOwners(accessToken)
    ownerMap = buildOwnerMap(owners)
  } catch {
    // Non-fatal: deals will sync without owner contact info
  }

  // Pre-fetch contacts for the contact map (used across deal + contact syncs)
  let contactMap = new Map<string, HubSpotContact>()
  const dealContactIds = new Set<string>()

  if (typesToSync.includes('contacts') || typesToSync.includes('deals')) {
    try {
      const { fetchAllContacts: fetchAll } = await import('./client')
      const contacts = await fetchAll(accessToken)
      contactMap = buildContactMap(contacts)
    } catch {
      // Non-fatal
    }
  }

  // Sync deals first (primary source of leads)
  if (typesToSync.includes('deals')) {
    entityResults.deals = await syncDeals(
      tenantId,
      accessToken,
      contactMap,
      ownerMap
    )
  }

  // Sync contacts (only those not already linked to deals)
  if (typesToSync.includes('contacts')) {
    entityResults.contacts = await syncContacts(
      tenantId,
      accessToken,
      dealContactIds
    )
  }

  // Sync companies
  if (typesToSync.includes('companies')) {
    entityResults.companies = await syncCompanies(tenantId, accessToken)
  }

  // Compute totals
  const totals = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }
  for (const entry of Object.values(entityResults)) {
    if (!entry) continue
    totals.processed += entry.records_processed
    totals.created += entry.records_created
    totals.updated += entry.records_updated
    totals.skipped += entry.records_skipped
    totals.failed += entry.records_failed
  }

  const result: HubSpotSyncResult = {
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    entity_results: entityResults,
    totals,
  }

  // Update external_integrations and log to integration_sync_logs
  const integrationId = await updateIntegrationStatus(tenantId, result)

  for (const entry of Object.values(entityResults)) {
    if (!entry) continue
    await writeSyncLog(tenantId, integrationId, entry)
  }

  return result
}
