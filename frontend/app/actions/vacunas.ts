'use server'

import { revalidatePath } from 'next/cache'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'
import { getCurrentUserProfile } from './inventario'

export type { PerfilUsuario } from './inventario'

export type VacunaState = {
  error?: string
  success?: boolean
} | null

export type VacunaConMascota = {
  id_vacuna: number
  id_mascota: number | null
  nombre: string
  fecha_aplicacion: string
  proxima_aplicacion: string | null
  mascota: {
    id_mascota: number
    nombre: string
    especie: string
    raza: string | null
  } | null
}

function getFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

export async function getVacunas(): Promise<VacunaConMascota[]> {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data: mascotas, error: mascotasError } = await supabase
    .from('mascotas')
    .select('id_mascota, nombre, especie, raza')

  if (mascotasError) {
    reportServerError('vaccines:pets-list', mascotasError)
    return []
  }
  if (!mascotas?.length) return []

  const mascotasPorId: Record<number, VacunaConMascota['mascota']> = {}
  for (const mascota of mascotas) {
    mascotasPorId[mascota.id_mascota] = mascota
  }

  const { data: vacunas, error: vacunasError } = await supabase
    .from('vacunas')
    .select('id_vacuna, id_mascota, nombre, fecha_aplicacion, proxima_aplicacion')
    .order('proxima_aplicacion', { ascending: true, nullsFirst: false })

  if (vacunasError) {
    reportServerError('vaccines:list', vacunasError)
    return []
  }

  return (vacunas ?? []).map((vacuna) => ({
    ...vacuna,
    mascota: vacuna.id_mascota ? (mascotasPorId[vacuna.id_mascota] ?? null) : null,
  }))
}

export async function registrarVacunaAction(
  _prev: VacunaState,
  formData: FormData
): Promise<VacunaState> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const id_mascota = Number.parseInt(String(formData.get('id_mascota') ?? ''), 10)
  const fecha_aplicacion = String(formData.get('fecha_aplicacion') ?? '').trim() || getFechaActual()
  const proxima_aplicacion = String(formData.get('proxima_aplicacion') ?? '').trim() || null

  if (!nombre || nombre.length > 255) return { error: 'El nombre de la vacuna no es válido.' }
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) {
    return { error: 'La mascota es obligatoria.' }
  }
  if (proxima_aplicacion && proxima_aplicacion <= fecha_aplicacion) {
    return { error: 'La próxima aplicación debe ser mayor que la fecha de aplicación.' }
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
    reportServerError('vaccines:validate-pet', mascotaError)
    return { error: 'No se pudo validar la mascota seleccionada.' }
  }
  if (!mascota) return { error: 'La mascota seleccionada no pertenece a esta clínica.' }

  const { data, error } = await supabase
    .from('vacunas')
    .insert({ id_mascota, nombre, fecha_aplicacion, proxima_aplicacion })
    .select('id_vacuna')
    .maybeSingle()

  if (error || !data) {
    reportServerError('vaccines:create', error)
    return { error: 'No se pudo registrar la vacuna. Verifica tus permisos.' }
  }

  revalidatePath('/vacunas')
  revalidatePath(`/mascotas/detalle/${id_mascota}`)
  return { success: true }
}

export { getCurrentUserProfile }
