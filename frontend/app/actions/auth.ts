'use server'

import type { Session, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  createAdminClient,
  createServerClient,
  getServerSessionTokens,
} from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'

const OWNER_ROLE = 'Administrador' as const

function getSupabase() {
  return createServerClient()
}

function getAdminSupabase() {
  return createAdminClient()
}

function buildClinicName(nombre: string, email: string, nombreClinica?: string | null) {
  const cleanClinicName = nombreClinica?.trim()
  if (cleanClinicName) return cleanClinicName

  const firstName = nombre.split(/\s+/)[0] || email.split('@')[0]
  return `Clinica de ${firstName}`
}

async function createClinicForUser(
  adminSupabase: ReturnType<typeof getAdminSupabase>,
  nombre: string,
  email: string,
  nombreClinica?: string | null
) {
  const { data, error } = await adminSupabase
    .from('clinicas')
    .insert({
      nombre: buildClinicName(nombre, email, nombreClinica),
    })
    .select('id_clinica')
    .single()

  if (error || !data) {
    reportServerError('auth:clinic-insert', error)
    throw new Error('No se pudo crear la clinica.')
  }

  return data.id_clinica
}

async function ensureUserProfileHasClinic(
  adminSupabase: ReturnType<typeof getAdminSupabase>,
  user: User
) {
  const { data: perfil, error } = await adminSupabase
    .from('usuarios')
    .select('id_usuario, nombre, correo, id_clinica')
    .eq('id_usuario', user.id)
    .maybeSingle()

  if (error) {
    reportServerError('login:profile-lookup', error)
    throw new Error('No se pudo validar el perfil del usuario.')
  }

  if (!perfil) {
    const email = user.email
    if (!email) throw new Error('La cuenta no tiene un correo válido.')

    const metadataName = typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : ''
    const nombre = metadataName || email.split('@')[0]
    const metadataClinic = typeof user.user_metadata?.clinic_name === 'string'
      ? user.user_metadata.clinic_name
      : null
    const idClinica = await createClinicForUser(
      adminSupabase,
      nombre,
      email,
      metadataClinic
    )
    const { error: insertError } = await adminSupabase
      .from('usuarios')
      .insert({
        id_usuario: user.id,
        nombre,
        correo: email,
        rol: OWNER_ROLE,
        id_clinica: idClinica,
      })

    if (!insertError) return

    await adminSupabase
      .from('clinicas')
      .delete()
      .eq('id_clinica', idClinica)

    const { data: concurrentProfile } = await adminSupabase
      .from('usuarios')
      .select('id_usuario, id_clinica')
      .eq('id_usuario', user.id)
      .maybeSingle()

    if (concurrentProfile?.id_clinica) return

    reportServerError('login:profile-create', insertError)
    throw new Error('No se pudo crear el perfil interno de la cuenta.')
  }

  if (perfil.id_clinica) return

  const idClinica = await createClinicForUser(
    adminSupabase,
    perfil.nombre,
    perfil.correo,
  )

  const { data: updatedProfile, error: updateError } = await adminSupabase
    .from('usuarios')
    .update({ id_clinica: idClinica, rol: OWNER_ROLE })
    .eq('id_usuario', user.id)
    .select('id_usuario')
    .maybeSingle()

  if (updateError || !updatedProfile) {
    await adminSupabase
      .from('clinicas')
      .delete()
      .eq('id_clinica', idClinica)

    reportServerError('login:profile-clinic-update', updateError)
    throw new Error('No se pudo asignar una clinica al usuario.')
  }
}

async function setSessionCookies(session: Session) {
  const cookieStore = await cookies()
  const sharedOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    priority: 'high' as const,
  }

  cookieStore.set('sb-access-token', session.access_token, {
    ...sharedOptions,
    maxAge: session.expires_in ?? 60 * 60,
  })
  cookieStore.set('sb-refresh-token', session.refresh_token, {
    ...sharedOptions,
    maxAge: 60 * 60 * 24 * 30,
  })
}

async function rollbackRegistration(userId: string, idClinica?: number) {
  try {
    const adminSupabase = getAdminSupabase()

    await adminSupabase
      .from('usuarios')
      .delete()
      .eq('id_usuario', userId)

    if (idClinica) {
      await adminSupabase
        .from('clinicas')
        .delete()
        .eq('id_clinica', idClinica)
    }

    await adminSupabase.auth.admin.deleteUser(userId)
  } catch (error) {
    reportServerError('register:rollback', error)
  }
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

  try {
    const adminSupabase = getAdminSupabase()
    await ensureUserProfileHasClinic(adminSupabase, data.user)
  } catch (profileError) {
    reportServerError('login:profile-repair', profileError)
    return {
      error: profileError instanceof Error
        ? profileError.message
        : 'No se pudo preparar tu perfil para entrar al panel.',
    }
  }

  await setSessionCookies(data.session)

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
  const nombre_clinica = (formData.get('nombre_clinica') as string)?.trim() || null

  // Validaciones
  if (!nombre || !email || !password || !confirmPassword || !nombre_clinica) {
    return { error: 'Todos los campos marcados con * son obligatorios.' }
  }
  if (nombre.length > 255 || nombre_clinica.length > 255) {
    return { error: 'El nombre y la clínica no pueden exceder 255 caracteres.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'El correo electrónico no es válido.' }
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }
  let adminSupabase: ReturnType<typeof getAdminSupabase>
  try {
    adminSupabase = getAdminSupabase()
  } catch (setupError) {
    reportServerError('register:admin-client', setupError)
    return { error: 'La configuración del servidor no permite crear cuentas todavía.' }
  }

  const supabase = getSupabase()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nombre,
        clinic_name: nombre_clinica,
      },
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
    }
    return { error: authError?.message ?? 'Error al crear la cuenta. Intenta de nuevo.' }
  }

  if (authData.user.identities?.length === 0) {
    return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
  }

  let id_clinica: number
  try {
    id_clinica = await createClinicForUser(adminSupabase, nombre, email, nombre_clinica)
  } catch (clinicError) {
    await rollbackRegistration(authData.user.id)
    return {
      error: clinicError instanceof Error
        ? clinicError.message
        : 'No se pudo crear la clínica para esta cuenta.',
    }
  }

  // 2. Insertar perfil en tabla usuarios (usa service role para bypass RLS en registro)
  const { error: profileError } = await adminSupabase
    .from('usuarios')
    .insert({
      id_usuario: authData.user.id,
      nombre,
      correo: email,
      rol: OWNER_ROLE,
      id_clinica,
    })

  if (profileError) {
    reportServerError('register:profile-insert', profileError)
    await rollbackRegistration(authData.user.id, id_clinica)
    return { error: 'No se pudo completar el registro. Intenta nuevamente.' }
  }

  // 3. Si Auth exige confirmacion, la cuenta queda lista para iniciar sesion
  // despues de validar el correo.
  if (!authData.session) {
    return { success: true }
  }

  await setSessionCookies(authData.session)

  redirect('/mascotas')
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const { accessToken, refreshToken } = await getServerSessionTokens()
  if (accessToken && refreshToken) {
    const supabase = getSupabase()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (!sessionError) {
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' })
      if (logoutError) reportServerError('logout:revoke-session', logoutError)
    }
  }

  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  redirect('/login')
}
