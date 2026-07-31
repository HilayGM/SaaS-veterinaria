'use server'

import { revalidatePath } from 'next/cache'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'
import { getCurrentUserProfile } from './inventario'

export type { PerfilUsuario } from './inventario'

export type CitaConMascota = {
  id_cita: number
  fecha: string
  estado: string
  mascota_nombre: string
  propietario_nombre: string
  id_mascota: number | null
}

export async function getCitas(): Promise<CitaConMascota[]> {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data: mascotas, error: mascotasError } = await supabase
    .from('mascotas')
    .select('*')

  if (mascotasError) {
    reportServerError('appointments:pets-list', mascotasError)
    return []
  }
  if (!mascotas?.length) return []

  const mascotaMap = new Map(
    mascotas.map((mascota) => [
      mascota.id_mascota,
      { nombre: mascota.nombre, id_dueno: mascota['id_dueño'] },
    ])
  )
  const idsDuenos = [
    ...new Set(
      mascotas
        .map((mascota) => mascota['id_dueño'])
        .filter((id): id is number => typeof id === 'number')
    ),
  ]
  const duenosPorId = new Map<number, string>()

  if (idsDuenos.length > 0) {
    const { data: duenos, error: duenosError } = await supabase
      .from('clientes_duenos')
      .select('*')
      .in('id_dueño', idsDuenos)

    if (duenosError) {
      reportServerError('appointments:owners-list', duenosError)
    } else {
      for (const dueno of duenos ?? []) {
        duenosPorId.set(dueno['id_dueño'], dueno.nombre)
      }
    }
  }

  const { data: citas, error: citasError } = await supabase
    .from('citas')
    .select('id_cita, id_mascota, fecha, estado')
    .order('fecha', { ascending: false })

  if (citasError) {
    reportServerError('appointments:list', citasError)
    return []
  }

  return (citas ?? []).map((cita) => {
    const mascota = cita.id_mascota ? mascotaMap.get(cita.id_mascota) : null
    return {
      id_cita: cita.id_cita,
      fecha: cita.fecha,
      estado: cita.estado,
      id_mascota: cita.id_mascota,
      mascota_nombre: mascota?.nombre ?? '-',
      propietario_nombre: mascota?.id_dueno
        ? (duenosPorId.get(mascota.id_dueno) ?? '-')
        : '-',
    }
  })
}

export const getCitasHoy = getCitas

export type CitaState = { error?: string; success?: boolean } | null

export async function agendarCitaAction(
  _prev: CitaState,
  formData: FormData
): Promise<CitaState> {
  const id_mascota = Number.parseInt(String(formData.get('id_mascota') ?? ''), 10)
  const fecha = String(formData.get('fecha') ?? '').trim()

  if (!Number.isInteger(id_mascota) || id_mascota <= 0) {
    return { error: 'Debes seleccionar una mascota.' }
  }
  if (!fecha || Number.isNaN(Date.parse(fecha))) {
    return { error: 'La fecha y hora no son válidas.' }
  }

  const perfil = await getCurrentUserProfile()
  const supabase = await createAuthenticatedClient()
  if (!perfil?.id_clinica || !supabase) return { error: 'Sesión no válida.' }

  const { data: mascota, error: mascotaError } = await supabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .maybeSingle()

  if (mascotaError) {
    reportServerError('appointments:validate-pet', mascotaError)
    return { error: 'No se pudo validar la mascota seleccionada.' }
  }
  if (!mascota) return { error: 'La mascota no pertenece a esta clínica.' }

  const { data, error } = await supabase
    .from('citas')
    .insert({ id_mascota, fecha, estado: 'Pendiente' })
    .select('id_cita')
    .maybeSingle()

  if (error || !data) {
    reportServerError('appointments:create', error)
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
  if (!Number.isInteger(id_cita) || id_cita <= 0) return { error: 'Cita inválida.' }
  if (nuevoEstado !== 'Completada' && nuevoEstado !== 'Cancelada') {
    return { error: 'Estado inválido.' }
  }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return { error: 'No autenticado.' }
  if (perfil.rol !== 'Veterinario' && perfil.rol !== 'Administrador') {
    return { error: 'Solo Veterinarios y Administradores pueden cambiar el estado.' }
  }

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'No autenticado.' }

  const { data, error } = await supabase
    .from('citas')
    .update({ estado: nuevoEstado })
    .eq('id_cita', id_cita)
    .eq('estado', 'Pendiente')
    .select('id_cita')
    .maybeSingle()

  if (error) {
    reportServerError('appointments:update-status', error)
    return { error: 'No se pudo actualizar la cita.' }
  }
  if (!data) {
    return { error: 'La cita no existe, no pertenece a tu clínica o ya no está pendiente.' }
  }

  revalidatePath('/citas')
  return { success: true }
}
