/**
 * GET /api/admin/integration-health
 *
 * Returns the sync status of all integrations in one call.
 * Aggregates data from:
 *   - integration_sync_logs — latest entry per provider
 *   - plaid_items — bank connection status and last sync
 *   - qbo_entity_sync — QuickBooks entity sync status
 *   - external_integrations — configured providers and connection status
 *
 * Requires admin read permission (super_admin or tenant_admin).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRoutePermission } from '@/lib/auth/rbac'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationHealthItem {
  name: string
  provider: string
  source: 'external_integration' | 'plaid' | 'quickbooks'
  status: string
  last_sync_at: string | null
  staleness_days: number | null
  error_message: string | null
  details?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function syncStatusLabel(staleDays: number | null, baseStatus: string): string {
  if (baseStatus === 'error' || baseStatus === 'failed') return 'error'
  if (baseStatus === 'disconnected') return 'disconnected'
  if (staleDays === null) return 'never_synced'
  if (staleDays <= 1) return 'healthy'
  if (staleDays <= 7) return 'stale'
  return 'critical'
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  // ---- Auth ---------------------------------------------------------------
  const auth = await checkRoutePermission('admin', 'read')
  if (auth instanceof NextResponse) return auth

  const supabase = await createClient()
  const tenantId = auth.tenantId

  const integrations: IntegrationHealthItem[] = []

  // ---- 1. External integrations (configured providers) --------------------
  const { data: externalIntegrations } = await supabase
    .from('external_integrations')
    .select('id, provider, status, last_sync_at, error_message, updated_at')
    .eq('tenant_id', tenantId)

  // ---- 2. Integration sync logs — latest entry per provider ---------------
  // We fetch recent logs and deduplicate to latest per provider in JS,
  // since Supabase JS client does not support DISTINCT ON directly.
  const { data: syncLogs } = await supabase
    .from('integration_sync_logs')
    .select('provider, status, started_at, completed_at, records_synced, records_failed, errors')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(200)

  const latestSyncByProvider = new Map<
    string,
    {
      status: string
      started_at: string
      completed_at: string | null
      records_synced: number
      records_failed: number
    }
  >()

  for (const log of syncLogs ?? []) {
    if (!latestSyncByProvider.has(log.provider)) {
      latestSyncByProvider.set(log.provider, {
        status: log.status,
        started_at: log.started_at,
        completed_at: log.completed_at,
        records_synced: log.records_synced,
        records_failed: log.records_failed,
      })
    }
  }

  // Merge external integrations with their latest sync log
  for (const ext of externalIntegrations ?? []) {
    const syncLog = latestSyncByProvider.get(ext.provider)
    const lastSync = syncLog?.completed_at ?? syncLog?.started_at ?? ext.last_sync_at
    const staleDays = daysSince(lastSync)

    integrations.push({
      name: ext.provider.charAt(0).toUpperCase() + ext.provider.slice(1).replace(/_/g, ' '),
      provider: ext.provider,
      source: 'external_integration',
      status: syncStatusLabel(staleDays, ext.status ?? 'disconnected'),
      last_sync_at: lastSync,
      staleness_days: staleDays,
      error_message: ext.error_message ?? null,
      details: syncLog
        ? {
            sync_status: syncLog.status,
            records_synced: syncLog.records_synced,
            records_failed: syncLog.records_failed,
          }
        : undefined,
    })
  }

  // ---- 3. Plaid items — bank connections ----------------------------------
  const { data: plaidItems } = await supabase
    .from('plaid_items')
    .select('id, institution_name, status, last_sync_at, error_message')
    .eq('tenant_id', tenantId)

  for (const item of plaidItems ?? []) {
    const staleDays = daysSince(item.last_sync_at)

    integrations.push({
      name: item.institution_name ?? 'Plaid Bank Connection',
      provider: 'plaid',
      source: 'plaid',
      status: syncStatusLabel(staleDays, item.status ?? 'disconnected'),
      last_sync_at: item.last_sync_at,
      staleness_days: staleDays,
      error_message: item.error_message ?? null,
    })
  }

  // ---- 4. QuickBooks entity sync ------------------------------------------
  // Get the most recent sync per entity_type
  const { data: qboSyncs } = await supabase
    .from('qbo_entity_sync')
    .select('entity_type, last_synced_at, sync_status, error_message')
    .eq('tenant_id', tenantId)
    .order('last_synced_at', { ascending: false })
    .limit(500)

  const latestQboByType = new Map<
    string,
    { last_synced_at: string; sync_status: string; error_message: string | null }
  >()

  for (const row of qboSyncs ?? []) {
    if (!latestQboByType.has(row.entity_type)) {
      latestQboByType.set(row.entity_type, {
        last_synced_at: row.last_synced_at,
        sync_status: row.sync_status,
        error_message: row.error_message,
      })
    }
  }

  if (latestQboByType.size > 0) {
    // Find the oldest sync across all entity types to represent overall QBO health
    let oldestSync: string | null = null
    let hasError = false
    const entityDetails: Record<string, unknown> = {}

    for (const [entityType, data] of latestQboByType) {
      entityDetails[entityType] = {
        last_synced_at: data.last_synced_at,
        status: data.sync_status,
      }
      if (data.sync_status === 'error') hasError = true
      if (!oldestSync || data.last_synced_at < oldestSync) {
        oldestSync = data.last_synced_at
      }
    }

    const staleDays = daysSince(oldestSync)

    integrations.push({
      name: 'QuickBooks Online',
      provider: 'quickbooks',
      source: 'quickbooks',
      status: hasError ? 'error' : syncStatusLabel(staleDays, 'connected'),
      last_sync_at: oldestSync,
      staleness_days: staleDays,
      error_message: hasError ? 'One or more entity types have sync errors' : null,
      details: {
        entity_types: entityDetails,
        total_entity_types: latestQboByType.size,
      },
    })
  }

  // ---- Build summary ------------------------------------------------------
  const healthySummary = integrations.filter((i) => i.status === 'healthy').length
  const staleSummary = integrations.filter((i) => i.status === 'stale').length
  const criticalSummary = integrations.filter((i) => i.status === 'critical').length
  const errorSummary = integrations.filter((i) => i.status === 'error').length
  const disconnectedSummary = integrations.filter((i) => i.status === 'disconnected').length
  const neverSyncedSummary = integrations.filter((i) => i.status === 'never_synced').length

  // Sort: errors first, then critical, stale, never_synced, disconnected, healthy
  const statusOrder: Record<string, number> = {
    error: 0,
    critical: 1,
    stale: 2,
    never_synced: 3,
    disconnected: 4,
    healthy: 5,
  }
  integrations.sort(
    (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
  )

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    tenant_id: tenantId,
    summary: {
      total: integrations.length,
      healthy: healthySummary,
      stale: staleSummary,
      critical: criticalSummary,
      error: errorSummary,
      disconnected: disconnectedSummary,
      never_synced: neverSyncedSummary,
    },
    integrations,
  })
}
