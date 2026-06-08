/**
 * POST /api/integrations/hubspot/sync
 * Trigger a HubSpot CRM sync into the Vera leads table.
 * Protected by admin auth (super_admin or tenant_admin).
 *
 * Body (optional):
 *   entity_types?: ('deals' | 'contacts' | 'companies')[]
 *
 * GET /api/integrations/hubspot/sync
 * Returns current sync status and last sync history.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, type UserRole } from '@/lib/auth/permissions'
import { runHubSpotSync } from '@/lib/integrations/hubspot/sync'
import { getHubSpotAccessToken, HubSpotAuthError } from '@/lib/integrations/hubspot/client'
import type { HubSpotSyncEntityType } from '@/lib/integrations/hubspot/types'

const VALID_ENTITY_TYPES: HubSpotSyncEntityType[] = ['deals', 'contacts', 'companies']

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !hasPermission(profile.role as UserRole, 'admin', 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // ── Validate HubSpot token is configured ─────────────────────────────
    try {
      getHubSpotAccessToken()
    } catch (err) {
      if (err instanceof HubSpotAuthError) {
        return NextResponse.json(
          { error: err.message, code: 'HUBSPOT_NOT_CONFIGURED' },
          { status: 400 }
        )
      }
      throw err
    }

    // ── Parse body ───────────────────────────────────────────────────────
    const body = await request.json().catch(() => ({}))
    const entityTypes = body.entity_types as HubSpotSyncEntityType[] | undefined

    if (entityTypes) {
      const invalid = entityTypes.filter((t) => !VALID_ENTITY_TYPES.includes(t))
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid entity types: ${invalid.join(', ')}. Valid: ${VALID_ENTITY_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // ── Run sync ─────────────────────────────────────────────────────────
    const result = await runHubSpotSync(profile.tenant_id, {
      entityTypes: entityTypes ?? undefined,
    })

    return NextResponse.json({
      status: 'ok',
      ...result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[HubSpot Sync] POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'No profile' }, { status: 403 })
    }

    // Get integration record
    const { data: integration } = await supabase
      .from('external_integrations')
      .select('id, status, config, last_sync_at, error_message')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', 'hubspot')
      .maybeSingle()

    if (!integration) {
      return NextResponse.json({
        connected: false,
        configured: !!process.env.HUBSPOT_ACCESS_TOKEN || !!process.env.HUBSPOT_API_KEY,
        last_sync_at: null,
        sync_history: [],
      })
    }

    // Get recent sync logs
    const { data: syncLogs } = await supabase
      .from('integration_sync_logs')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', 'hubspot')
      .order('created_at', { ascending: false })
      .limit(20)

    const config = (integration.config as Record<string, unknown>) ?? {}

    return NextResponse.json({
      connected: integration.status === 'connected',
      configured: true,
      status: integration.status,
      last_sync_at: integration.last_sync_at,
      error_message: integration.error_message,
      sync_totals: config.sync_totals ?? null,
      sync_history: syncLogs ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[HubSpot Sync] GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
