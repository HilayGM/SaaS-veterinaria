'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  )
  return supabase
}

export type CitaHoy = {
  id_cita: number
  fecha: string
  estado: string // 'Pendiente' | 'Completada' | 'Cancelada'
  mascota_nombre: string
  propietario_nombre: string
}

export async function getCitasHoy(): Promise<CitaHoy[]> {
  const supabase = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('vw_citas_hoy')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) {
    console.error('[getCitasHoy]', error)
    return []
  }

  return (data as any) as CitaHoy[]
}

export type CambiarEstadoCitaResponse = {
  success?: boolean
  error?: string
}

export async function cambiarEstadoCitaAction(id_cita: number, nuevoEstado: 'Completada' | 'Cancelada'): Promise<CambiarEstadoCitaResponse> {
  const supabase = await getAuthenticatedClient()
  
  // 1. Obtener la sesión y validar el rol
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) return { error: 'No autenticado.' }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id_usuario', userData.user.id)
    .single()
    
  if (perfilError || !perfil) return { error: 'No se encontró el perfil.' }
  if (perfil.rol !== 'Veterinario' && perfil.rol !== 'Administrador') {
    return { error: 'Solo Veterinarios y Administradores pueden cambiar el estado.' }
  }

  // 2. Obtener la cita actual para validar que su estado es Pendiente
  // RLS asegura que solo vea citas de su clínica
  const { data: citaActual, error: citaError } = await supabase
    .from('citas')
    .select('estado')
    .eq('id_cita', id_cita)
    .single()

  if (citaError || !citaActual) {
    return { error: 'Cita no encontrada o sin permisos.' }
  }

  if (citaActual.estado !== 'Pendiente') {
    return { error: 'Solo se pueden modificar citas en estado Pendiente.' }
  }

  // 3. Actualizar el estado
  const { error: updateError } = await supabase
    .from('citas')
    .update({ estado: nuevoEstado })
    .eq('id_cita', id_cita)

  if (updateError) {
    console.error('[cambiarEstadoCitaAction]', updateError)
    return { error: 'Ocurrió un error al actualizar la cita.' }
  }

  return { success: true }
}
