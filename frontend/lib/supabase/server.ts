import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required server environment variable: ${name}`)
  return value
}

function getSupabaseUrl() {
  return getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
}

function getAnonKey() {
  return getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function createServerClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    getAnonKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export function createAdminClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export function createAuthenticatedClientFromToken(accessToken: string) {
  return createClient<Database>(
    getSupabaseUrl(),
    getAnonKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

export async function getServerSessionTokens() {
  const cookieStore = await cookies()
  return {
    accessToken: cookieStore.get('sb-access-token')?.value ?? null,
    refreshToken: cookieStore.get('sb-refresh-token')?.value ?? null,
  }
}

export async function createAuthenticatedClient() {
  const { accessToken } = await getServerSessionTokens()
  if (!accessToken) return null

  return createAuthenticatedClientFromToken(accessToken)
}
