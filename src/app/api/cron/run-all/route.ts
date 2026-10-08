/**
 * Cron: Run all
 * GET|POST /api/cron/run-all
 *
 * Vercel Cron entry point (vercel.json, "0 6 * * *" UTC). Vercel sends
 * Authorization: Bearer <CRON_SECRET>. After verifying it, this forwards to
 * /api/automation/run-all with the AUTOMATION_SECRET header.
 *
 * CRON_SECRET is required: without it the endpoint refuses every request, so
 * the daily run can never be triggered anonymously.
 */

import { timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'

export const maxDuration = 300

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header) return false
  const a = Buffer.from(header, 'utf-8')
  const b = Buffer.from(`Bearer ${secret}`, 'utf-8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (!bearerMatches(request.headers.get('authorization'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const automationSecret = process.env.AUTOMATION_SECRET
  if (!automationSecret) {
    return NextResponse.json({ error: 'AUTOMATION_SECRET is not configured' }, { status: 500 })
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  try {
    const res = await fetch(`${appUrl}/api/automation/run-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-automation-secret': automationSecret },
    })
    const data = await res.json().catch(() => ({ error: `run-all returned HTTP ${res.status}` }))
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

// Vercel Cron sends GET.
export { POST as GET }
