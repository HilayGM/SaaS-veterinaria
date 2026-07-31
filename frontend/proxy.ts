import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const ACCESS_COOKIE = 'sb-access-token'
const REFRESH_COOKIE = 'sb-refresh-token'
const REFRESH_WINDOW_SECONDS = 5 * 60

function readExpiration(accessToken: string) {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

function setSessionCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_in?: number }
) {
  const sharedOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    priority: 'high' as const,
  }

  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...sharedOptions,
    maxAge: session.expires_in ?? 60 * 60,
  })
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...sharedOptions,
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return NextResponse.next()

  const expiresAt = accessToken ? readExpiration(accessToken) : null
  const now = Math.floor(Date.now() / 1000)
  if (expiresAt && expiresAt - now > REFRESH_WINDOW_SECONDS) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return NextResponse.next()

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })
  const response = NextResponse.next()

  if (error || !data.session) {
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }

  setSessionCookies(response, data.session)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
