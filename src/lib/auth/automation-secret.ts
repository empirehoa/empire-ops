import { timingSafeEqual } from 'crypto'
import { type NextRequest } from 'next/server'

/**
 * Verify the automation secret header using constant-time comparison.
 * Accepts both x-automation-secret and x-automation-key for backwards compat.
 */
export function verifyAutomationSecret(request: NextRequest): boolean {
  const secret = process.env.AUTOMATION_SECRET
  if (!secret) return false

  const header =
    request.headers.get('x-automation-secret') ??
    request.headers.get('x-automation-key')
  if (!header) return false

  try {
    const a = Buffer.from(secret, 'utf-8')
    const b = Buffer.from(header, 'utf-8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
