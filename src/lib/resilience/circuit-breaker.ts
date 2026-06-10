/**
 * Simple circuit breaker with three states:
 *   - CLOSED  — normal operation, requests pass through
 *   - OPEN    — too many consecutive failures, requests fail fast
 *   - HALF_OPEN — after resetTimeout, one probe request is allowed through
 *
 * Opens after `failureThreshold` (default 5) consecutive failures.
 * Returns the supplied fallback value while the circuit is open.
 */

import { withTimeout } from './with-timeout'
import { withRetry } from './with-retry'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CircuitBreakerOptions {
  /** Unique name for this circuit (used in error messages and logging). */
  name: string
  /** Request timeout in ms. @default 10_000 */
  timeout?: number
  /** Number of retries before counting a failure. @default 2 */
  maxRetries?: number
  /** Time in ms before transitioning from OPEN to HALF_OPEN. @default 30_000 */
  resetTimeout?: number
  /** Consecutive failures required to open the circuit. @default 5 */
  failureThreshold?: number
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

// ── Per-service state ────────────────────────────────────────────────────────

interface ServiceState {
  state: CircuitState
  failures: number
  lastFailureTime: number
}

const services = new Map<string, ServiceState>()

function getServiceState(name: string): ServiceState {
  let s = services.get(name)
  if (!s) {
    s = { state: 'CLOSED', failures: 0, lastFailureTime: 0 }
    services.set(name, s)
  }
  return s
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Execute `fn` through the circuit breaker.
 *
 * When the circuit is OPEN the call is short-circuited and `fallback` is
 * returned immediately (if provided) or an error is thrown.
 */
export async function circuitBreaker<T>(
  fn: () => Promise<T>,
  options: CircuitBreakerOptions,
  fallback?: T
): Promise<T> {
  const {
    name,
    timeout = 10_000,
    maxRetries = 2,
    resetTimeout = 30_000,
    failureThreshold = 5,
  } = options

  const svc = getServiceState(name)

  // ── OPEN state ──────────────────────────────────────────────────────────
  if (svc.state === 'OPEN') {
    // Check if enough time has passed to try again
    if (Date.now() - svc.lastFailureTime >= resetTimeout) {
      svc.state = 'HALF_OPEN'
    } else {
      if (fallback !== undefined) return fallback
      throw new Error(
        `Circuit breaker OPEN for ${name} — service unavailable, try again later`
      )
    }
  }

  // ── CLOSED / HALF_OPEN — attempt the call ───────────────────────────────
  try {
    const result = await withRetry(
      () => withTimeout(fn(), timeout, name),
      { maxRetries, label: name, backoff: true }
    )

    // Success — reset state
    svc.state = 'CLOSED'
    svc.failures = 0
    return result
  } catch (err) {
    svc.failures++
    svc.lastFailureTime = Date.now()

    if (svc.failures >= failureThreshold) {
      svc.state = 'OPEN'
    }

    // If we were probing in HALF_OPEN, go back to OPEN
    if (svc.state === 'HALF_OPEN') {
      svc.state = 'OPEN'
    }

    if (fallback !== undefined) return fallback

    throw err
  }
}

/**
 * Reset a circuit breaker (useful in tests or after manual recovery).
 */
export function resetCircuitBreaker(name: string): void {
  services.delete(name)
}

/**
 * Get current circuit state for monitoring / health checks.
 */
export function getCircuitState(name: string): {
  state: CircuitState
  failures: number
  lastFailureTime: number
} {
  const svc = getServiceState(name)
  return { ...svc }
}
