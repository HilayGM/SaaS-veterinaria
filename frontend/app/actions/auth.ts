'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Helper: cliente browser-like con la anon key
function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Tipos ──────────────────────────────────────────────────────────────────
export type AuthState = {
  error?: string
  success?: boolean
} | null

// ── LOGIN ──────────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Correo y contraseña son obligatorios.' }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Guardar sesión en cookie httpOnly para SSR
  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect('/mascotas')
}

// ── REGISTRO ───────────────────────────────────────────────────────────────
export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const rol = formData.get('rol') as string
  const id_clinica_str = formData.get('id_clinica') as string

  // Validaciones
  if (!nombre || !email || !password || !rol) {
    return { error: 'Todos los campos marcados con * son obligatorios.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'El correo electrónico no es válido.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }
  if (!['Administrador', 'Veterinario', 'Recepcionista'].includes(rol)) {
    return { error: 'Selecciona un rol válido.' }
  }

  const id_clinica = id_clinica_str ? parseInt(id_clinica_str) : null

  const supabase = getSupabase()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
    }
    return { error: authError?.message ?? 'Error al crear la cuenta. Intenta de nuevo.' }
  }

  // 2. Insertar perfil en tabla usuarios (usa service role para bypass RLS en registro)
  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error: profileError } = await adminSupabase
    .from('usuarios')
    .insert({
      id_usuario: authData.user.id,
      nombre,
      correo: email,
      rol: rol as 'Administrador' | 'Veterinario' | 'Recepcionista',
      id_clinica,
    })

  if (profileError) {
    console.error('[register] profile insert error:', profileError)
    // El usuario en Auth ya existe, pero el perfil falló — no bloqueamos
    // En producción aquí se haría rollback con deleteUser
  }

  // 3. Auto-login después del registro
  const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError || !sessionData.session) {
    // Registro exitoso pero no pudimos auto-login — redirigir a login
    return { success: true }
  }

  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', sessionData.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  cookieStore.set('sb-refresh-token', sessionData.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect('/mascotas')
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  redirect('/login')
}
