import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Cliente para el servidor (Server Actions, Route Handlers)
// Usa la anon key + RLS para operaciones públicas
// Usa SUPABASE_SERVICE_ROLE_KEY solo para operaciones admin (bypassa RLS)
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
