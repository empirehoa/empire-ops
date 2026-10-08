/**
 * GET /api/health
 *
 * Liveness plus Supabase connectivity. The database check is a head-only count
 * on `companies` with the anon key: RLS returns no rows to anon, so nothing is
 * exposed, but a successful round trip proves the project is reachable.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Check = { status: 'ok' | 'error'; latency_ms?: number; detail?: string }

export async function GET() {
  const start = Date.now()
  const checks: Record<string, Check> = { server: { status: 'ok' } }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const dbStart = Date.now()
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      const { error } = await supabase.from('companies').select('id', { count: 'exact', head: true })
      checks.supabase = {
        status: error ? 'error' : 'ok',
        latency_ms: Date.now() - dbStart,
        ...(error ? { detail: error.message } : {}),
      }
    } catch (err) {
      checks.supabase = {
        status: 'error',
        latency_ms: Date.now() - dbStart,
        detail: err instanceof Error ? err.message : 'Connection failed',
      }
    }
  } else {
    checks.supabase = { status: 'error', detail: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not configured' }
  }

  checks.automation = process.env.AUTOMATION_SECRET
    ? { status: 'ok' }
    : { status: 'error', detail: 'AUTOMATION_SECRET not configured' }

  const statuses = Object.values(checks).map((c) => c.status)
  const overall = statuses.every((s) => s === 'ok') ? 'ok' : statuses.some((s) => s === 'ok') ? 'degraded' : 'down'

  return NextResponse.json(
    {
      status: overall,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      response_time_ms: Date.now() - start,
      checks,
    },
    { status: overall === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
