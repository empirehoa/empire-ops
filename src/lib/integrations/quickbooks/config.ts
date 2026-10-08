import { z } from 'zod'

export const QBO_AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2'
export const QBO_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
export const QBO_SCOPE = 'com.intuit.quickbooks.accounting'
export const QBO_MINOR_VERSION = '75'

const API_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
} as const

export type QuickBooksEnvironment = keyof typeof API_BASE

export type QuickBooksConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: QuickBooksEnvironment
  apiBase: string
}

const envSchema = z.object({
  QUICKBOOKS_CLIENT_ID: z.string().trim().min(1),
  QUICKBOOKS_CLIENT_SECRET: z.string().trim().min(1),
  QUICKBOOKS_REDIRECT_URI: z.url(),
  QUICKBOOKS_ENVIRONMENT: z.enum(['sandbox', 'production']),
})

export class QuickBooksConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuickBooksConfigError'
  }
}

/** Reads and validates the QuickBooks env vars. Error messages name variables, never values. */
export function getQuickBooksConfig(env: NodeJS.ProcessEnv = process.env): QuickBooksConfig {
  const parsed = envSchema.safeParse({
    QUICKBOOKS_CLIENT_ID: env.QUICKBOOKS_CLIENT_ID,
    QUICKBOOKS_CLIENT_SECRET: env.QUICKBOOKS_CLIENT_SECRET,
    QUICKBOOKS_REDIRECT_URI: env.QUICKBOOKS_REDIRECT_URI,
    QUICKBOOKS_ENVIRONMENT: env.QUICKBOOKS_ENVIRONMENT,
  })
  if (!parsed.success) {
    const vars = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))]
    throw new QuickBooksConfigError(`QuickBooks is not configured: check ${vars.join(', ')}`)
  }
  const e = parsed.data
  return {
    clientId: e.QUICKBOOKS_CLIENT_ID,
    clientSecret: e.QUICKBOOKS_CLIENT_SECRET,
    redirectUri: e.QUICKBOOKS_REDIRECT_URI,
    environment: e.QUICKBOOKS_ENVIRONMENT,
    apiBase: API_BASE[e.QUICKBOOKS_ENVIRONMENT],
  }
}

/** Null when configured, otherwise the reason (names variables only). */
export function quickBooksConfigProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  try {
    getQuickBooksConfig(env)
  } catch (err) {
    return err instanceof Error ? err.message : 'QuickBooks is not configured'
  }
  if (!env.TOKEN_ENCRYPTION_KEY) return 'QuickBooks is not configured: check TOKEN_ENCRYPTION_KEY'
  return null
}

export function isQuickBooksConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return quickBooksConfigProblem(env) === null
}
