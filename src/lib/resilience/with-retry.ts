/**
 * Retry wrapper with optional exponential backoff.
 *
 * Retries the given function up to `maxRetries` additional times after the
 * first failure. When `backoff` is true the delay doubles on each attempt
 * (100 ms, 200 ms, 400 ms, ...).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number
    label: string
    backoff?: boolean
  }
): Promise<T> {
  const { maxRetries, label, backoff = true } = options
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < maxRetries) {
        const delayMs = backoff ? 100 * Math.pow(2, attempt) : 100
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw new Error(
    `${label} failed after ${maxRetries + 1} attempts: ${lastError?.message}`
  )
}
