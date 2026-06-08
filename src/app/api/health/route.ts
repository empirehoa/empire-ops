import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 0

export async function GET() {
  const start = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; latency_ms?: number; detail?: string }> = {
    server: { status: 'ok' },
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const dbStart = Date.now()
    try {
      const supabase = createClient(url, key)
      const { error } = await supabase.from('tenants').select('id', { count: 'exact', head: true })
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
    checks.supabase = { status: 'error', detail: 'Environment variables not configured' }
  }

  checks.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'error',
    ...(!process.env.STRIPE_SECRET_KEY ? { detail: 'STRIPE_SECRET_KEY not configured' } : {}),
  }

  checks.automation = {
    status: process.env.AUTOMATION_SECRET ? 'ok' : 'error',
    ...(!process.env.AUTOMATION_SECRET ? { detail: 'AUTOMATION_SECRET not configured' } : {}),
  }

  checks.sentry = {
    status: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN ? 'ok' : 'error',
    ...(!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) ? { detail: 'Sentry DSN not configured' } : {}),
  }

  const statuses = Object.values(checks).map((c) => c.status)
  const overall = statuses.every((s) => s === 'ok')
    ? 'ok'
    : statuses.some((s) => s === 'ok')
      ? 'degraded'
      : 'down'

  return NextResponse.json(
    {
      status: overall,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      response_time_ms: Date.now() - start,
      checks,
    },
    { status: overall === 'ok' ? 200 : 503 },
  )
}
