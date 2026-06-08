/**
 * Cron: Run All Automation
 * POST /api/cron/run-all
 *
 * Vercel Cron entry point (configured in vercel.json at "0 6 * * *").
 * Vercel sends Authorization: Bearer <CRON_SECRET> with cron requests.
 *
 * This handler verifies the Vercel cron token and then internally
 * calls /api/automation/run-all with the AUTOMATION_SECRET header.
 *
 * Environment variables required:
 *   CRON_SECRET         — automatically set by Vercel for cron jobs
 *   AUTOMATION_SECRET   — shared secret for automation endpoints
 *   NEXT_PUBLIC_APP_URL — base URL of the deployment
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify Vercel cron authentication
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const automationSecret = process.env.AUTOMATION_SECRET
  if (!automationSecret) {
    return NextResponse.json(
      { error: 'AUTOMATION_SECRET is not configured' },
      { status: 500 }
    )
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  try {
    const res = await fetch(`${appUrl}/api/automation/run-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-automation-secret': automationSecret,
      },
    })

    const data = await res.json()

    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Also support GET for Vercel Cron (some Vercel plan tiers use GET)
export { POST as GET }
