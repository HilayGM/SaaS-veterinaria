'use server'

import { revalidatePath } from 'next/cache'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'
import { getCurrentUserProfile } from './inventario'

export type { PerfilUsuario } from './inventario'

export type ExpedienteState = {
  error?: string
  success?: boolean
} | null

export type ExpedienteConMascota = {
  id_expediente: number
  id_mascota: number | null
  diagnostico: string
  tratamiento: string | null
  fecha_consulta: string
  mascota: {
    id_mascota: number
    nombre: string
    especie: string
  } | null
}

export async function getExpedientes(): Promise<ExpedienteConMascota[]> {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data: mascotas, error: mascotasError } = await supabase
    .from('mascotas')
    .select('id_mascota, nombre, especie')

  if (mascotasError) {
    reportServerError('records:pets-list', mascotasError)
    return []
  }
  if (!mascotas?.length) return []

  const mascotasPorId: Record<number, ExpedienteConMascota['mascota']> = {}
  for (const mascota of mascotas) {
    mascotasPorId[mascota.id_mascota] = mascota
  }

  const { data: expedientes, error } = await supabase
    .from('expedientes')
    .select('id_expediente, id_mascota, diagnostico, tratamiento, fecha_consulta')
    .order('fecha_consulta', { ascending: false })

  if (error) {
    reportServerError('records:list', error)
    return []
  }

  return (expedientes ?? []).map((expediente) => ({
    ...expediente,
    mascota: expediente.id_mascota
      ? (mascotasPorId[expediente.id_mascota] ?? null)
      : null,
  }))
}

export async function getMascotasDeClinica() {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('mascotas')
    .select('id_mascota, nombre, especie')
    .order('nombre', { ascending: true })

  if (error) {
    reportServerError('records:pets-options', error)
    return []
  }

  return data ?? []
}

export async function registrarExpedienteAction(
  _prev: ExpedienteState,
  formData: FormData
): Promise<ExpedienteState> {
  const id_mascota = Number.parseInt(String(formData.get('id_mascota') ?? ''), 10)
  const diagnostico = String(formData.get('diagnostico') ?? '').trim()
  const tratamiento = String(formData.get('tratamiento') ?? '').trim() || null

  if (!Number.isInteger(id_mascota) || id_mascota <= 0) {
    return { error: 'La mascota es obligatoria.' }
  }
  if (!diagnostico || diagnostico.length > 5_000) {
    return { error: 'El diagnóstico es obligatorio y no puede exceder 5000 caracteres.' }
  }
  if (tratamiento && tratamiento.length > 5_000) {
    return { error: 'El tratamiento no puede exceder 5000 caracteres.' }
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
    reportServerError('records:validate-pet', mascotaError)
    return { error: 'No se pudo validar la mascota.' }
  }
  if (!mascota) return { error: 'La mascota no pertenece a esta clínica.' }

  const { data, error } = await supabase
    .from('expedientes')
    .insert({ id_mascota, diagnostico, tratamiento })
    .select('id_expediente')
    .maybeSingle()

  if (error || !data) {
    reportServerError('records:create', error)
    return { error: 'No se pudo registrar el expediente.' }
  }

  revalidatePath('/expedientes')
  revalidatePath(`/mascotas/detalle/${id_mascota}`)
  return { success: true }
}

export async function eliminarExpedienteAction(
  _prev: ExpedienteState,
  formData: FormData
): Promise<ExpedienteState> {
  const id_expediente = Number.parseInt(String(formData.get('id_expediente') ?? ''), 10)
  if (!Number.isInteger(id_expediente) || id_expediente <= 0) {
    return { error: 'Expediente inválido.' }
  }

  const perfil = await getCurrentUserProfile()
  if (perfil?.rol !== 'Administrador' || !perfil.id_clinica) {
    return { error: 'Solo los Administradores pueden eliminar expedientes.' }
  }

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'Sesión no válida.' }

  const { data, error } = await supabase
    .from('expedientes')
    .delete()
    .eq('id_expediente', id_expediente)
    .select('id_expediente')
    .maybeSingle()

  if (error) {
    reportServerError('records:delete', error)
    return { error: 'No se pudo eliminar el expediente.' }
  }
  if (!data) return { error: 'El expediente no existe o no pertenece a tu clínica.' }

  revalidatePath('/expedientes')
  return { success: true }
}

export { getCurrentUserProfile }
