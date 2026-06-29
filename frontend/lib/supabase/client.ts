import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

let instance: SupabaseClient<Database> | null = null

// Singleton — una sola instancia por contexto de navegador
export function createBrowserClient(): SupabaseClient<Database> {
  if (!instance) {
    instance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}
