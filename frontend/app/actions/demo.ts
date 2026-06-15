'use server'

import { createServerClient } from '@/lib/supabase/server'

export type DemoFormState = {
  success: boolean
  error?: string
} | null

export async function submitDemoRequest(
  _prevState: DemoFormState,
  formData: FormData
): Promise<DemoFormState> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const clinica = (formData.get('clinica') as string)?.trim() || null
  const mensaje = (formData.get('mensaje') as string)?.trim() || null

  if (!nombre || !email) {
    return { success: false, error: 'Nombre y email son obligatorios.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'El email no es válido.' }
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('solicitudes_demo')
    .insert({ nombre, email, telefono, clinica, mensaje })

  if (error) {
    console.error('[demo action]', error)
    return { success: false, error: 'No pudimos procesar tu solicitud. Intenta de nuevo.' }
  }

  return { success: true }
}
