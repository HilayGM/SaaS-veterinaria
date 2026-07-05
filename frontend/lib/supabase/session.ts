import type { Session } from '@supabase/supabase-js'
import { createBrowserClient } from './client'

const CLINIC_STORAGE_KEY = 'petcare.id_clinica'

export type AuthSessionData = {
  session: Session
  accessToken: string
  clinicId: number
}

export function clearStoredClinic() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CLINIC_STORAGE_KEY)
  }
}

export async function loadCurrentAuthSession(): Promise<AuthSessionData | null> {
  const supabase = createBrowserClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError

  if (!session) {
    clearStoredClinic()
    return null
  }

  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select('id_clinica')
    .eq('id_usuario', session.user.id)
    .single()

  if (userError) throw userError
  if (usuario.id_clinica === null) throw new Error('CLINIC_NOT_FOUND')

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      CLINIC_STORAGE_KEY,
      String(usuario.id_clinica)
    )
  }

  return {
    session,
    accessToken: session.access_token,
    clinicId: usuario.id_clinica,
  }
}
