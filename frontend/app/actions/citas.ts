'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile } from './inventario'

export type { PerfilUsuario } from './inventario'

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} } }
  )
}

export type CitaConMascota = {
  id_cita: number
  fecha: string
  estado: string
  mascota_nombre: string
  propietario_nombre: string
  id_mascota: number | null
}

// Trae TODAS las citas de la clínica (no solo las de hoy)
// usando service_role para saltar RLS en citas (que filtra por mascota→clínica)
export async function getCitas(): Promise<CitaConMascota[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Mascotas de la clínica con su dueño
  const { data: mascotasData, error: mError } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, id_dueño')
    .eq('id_clinica', perfil.id_clinica)
  const mascotas = mascotasData as any[] | null

  if (mError || !mascotas?.length) return []

  const mascotaMap: Record<number, { nombre: string; id_dueño: number | null }> = {}
  mascotas.forEach(m => { mascotaMap[m.id_mascota] = { nombre: m.nombre, id_dueño: m.id_dueño } })

  // 2. Dueños
  const idsDuenos = [...new Set(mascotas.map(m => m.id_dueño).filter(Boolean))] as number[]
  const duenioMap: Record<number, string> = {}

  if (idsDuenos.length > 0) {
    const { data: duenosData } = await adminSupabase
      .from('clientes_duenos')
      .select('id_dueño, nombre')
      .in('id_dueño', idsDuenos)
    const duenos = duenosData as any[] | null
    duenos?.forEach(d => { duenioMap[d.id_dueño] = d.nombre })
  }

  // 3. Citas de esas mascotas
  const { data: citas, error: cError } = await adminSupabase
    .from('citas')
    .select('id_cita, id_mascota, fecha, estado')
    .in('id_mascota', mascotas.map(m => m.id_mascota))
    .order('fecha', { ascending: false })

  if (cError) { console.error('[getCitas]', cError); return [] }

  return (citas ?? []).map(c => {
    const m = c.id_mascota ? mascotaMap[c.id_mascota] : null
    return {
      id_cita: c.id_cita,
      fecha: c.fecha,
      estado: c.estado,
      id_mascota: c.id_mascota,
      mascota_nombre: m?.nombre ?? '—',
      propietario_nombre: m?.id_dueño ? (duenioMap[m.id_dueño] ?? '—') : '—',
    }
  })
}

// Alias para compatibilidad con el page.tsx existente
export const getCitasHoy = getCitas

export type CitaState = { error?: string; success?: boolean } | null

export async function agendarCitaAction(
  _prev: CitaState,
  formData: FormData
): Promise<CitaState> {
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  const fecha = (formData.get('fecha') as string)?.trim()

  if (isNaN(id_mascota)) return { error: 'Debes seleccionar una mascota.' }
  if (!fecha) return { error: 'La fecha y hora son obligatorias.' }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return { error: 'No se detectó la clínica del usuario.' }

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validar que la mascota pertenece a la clínica
  const { data: mascota } = await adminSupabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .eq('id_clinica', perfil.id_clinica)
    .maybeSingle()

  if (!mascota) return { error: 'La mascota no pertenece a esta clínica.' }

  const { error } = await adminSupabase
    .from('citas')
    .insert({ id_mascota, fecha, estado: 'Pendiente' })

  if (error) {
    console.error('[agendarCita]', error)
    return { error: 'No se pudo agendar la cita. Intenta de nuevo.' }
  }

  revalidatePath('/citas')
  return { success: true }
}

export type CambiarEstadoCitaResponse = { success?: boolean; error?: string }

export async function cambiarEstadoCitaAction(
  id_cita: number,
  nuevoEstado: 'Completada' | 'Cancelada'
): Promise<CambiarEstadoCitaResponse> {
  const perfil = await getCurrentUserProfile()
  if (!perfil) return { error: 'No autenticado.' }
  if (perfil.rol !== 'Veterinario' && perfil.rol !== 'Administrador') {
    return { error: 'Solo Veterinarios y Administradores pueden cambiar el estado.' }
  }

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: cita } = await adminSupabase
    .from('citas')
    .select('estado')
    .eq('id_cita', id_cita)
    .maybeSingle()

  if (!cita) return { error: 'Cita no encontrada.' }
  if (cita.estado !== 'Pendiente') return { error: 'Solo se pueden modificar citas Pendientes.' }

  const { error } = await adminSupabase
    .from('citas')
    .update({ estado: nuevoEstado })
    .eq('id_cita', id_cita)

  if (error) {
    console.error('[cambiarEstado]', error)
    return { error: 'Error al actualizar la cita.' }
  }

  revalidatePath('/citas')
  return { success: true }
}
