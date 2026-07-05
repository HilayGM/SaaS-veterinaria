import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

let browserClient: ReturnType<typeof createClient<Database>> | undefined

// Cliente para el navegador — usa la anon key, segura para exponer con RLS activo
export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return browserClient
}
