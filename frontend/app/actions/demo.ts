'use server'

import { createServerClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'

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
  if (nombre.length > 120 || email.length > 254) {
    return { success: false, error: 'Nombre o email demasiado largo.' }
  }
  if ((telefono?.length ?? 0) > 40 || (clinica?.length ?? 0) > 160 || (mensaje?.length ?? 0) > 2000) {
    return { success: false, error: 'Uno de los campos excede la longitud permitida.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'El email no es válido.' }
  }

  const supabase = createServerClient()

  const { error } = await supabase.rpc('enviar_solicitud_demo', {
    p_nombre: nombre,
    p_email: email,
    p_telefono: telefono ?? undefined,
    p_clinica: clinica ?? undefined,
    p_mensaje: mensaje ?? undefined,
  })

  if (error) {
    reportServerError('demo:submit', error)
    if (error.message.includes('DEMO_RATE_LIMITED')) {
      return {
        success: false,
        error: 'Ya recibimos una solicitud con este correo. Espera unos minutos antes de reenviarla.',
      }
    }
    return { success: false, error: 'No pudimos procesar tu solicitud. Intenta de nuevo.' }
  }

  return { success: true }
}
