export type SupabaseEnvMode = 'configured' | 'missing'

export function getSupabaseEnvMode(): SupabaseEnvMode {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? 'configured' : 'missing'
}

export function isSupabaseEnvConfigured() {
  return getSupabaseEnvMode() === 'configured'
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
}
