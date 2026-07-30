'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
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

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} } }
  )
}

export async function getExpedientes(): Promise<ExpedienteConMascota[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotas, error: mascotasError } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, especie')
    .eq('id_clinica', perfil.id_clinica)

  if (mascotasError || !mascotas?.length) return []

  const mascotasPorId: Record<number, ExpedienteConMascota['mascota']> = {}
  const idsMascotas = mascotas.map(m => {
    mascotasPorId[m.id_mascota] = { id_mascota: m.id_mascota, nombre: m.nombre, especie: m.especie }
    return m.id_mascota
  })

  const { data: expedientes, error: expedientesError } = await adminSupabase
    .from('expedientes')
    .select('id_expediente, id_mascota, diagnostico, tratamiento, fecha_consulta')
    .in('id_mascota', idsMascotas)
    .order('fecha_consulta', { ascending: false })

  if (expedientesError) {
    console.error('[getExpedientes]', expedientesError)
    return []
  }

  return (expedientes ?? []).map(e => ({
    id_expediente: e.id_expediente,
    id_mascota: e.id_mascota,
    diagnostico: e.diagnostico,
    tratamiento: e.tratamiento,
    fecha_consulta: e.fecha_consulta,
    mascota: e.id_mascota ? (mascotasPorId[e.id_mascota] ?? null) : null,
  }))
}

export async function getMascotasDeClinica() {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, especie')
    .eq('id_clinica', perfil.id_clinica)
    .order('nombre', { ascending: true })

  if (error) { console.error('[getMascotasDeClinica]', error); return [] }
  return data ?? []
}

export async function registrarExpedienteAction(
  _prev: ExpedienteState,
  formData: FormData
): Promise<ExpedienteState> {
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  const diagnostico = (formData.get('diagnostico') as string)?.trim()
  const tratamiento = (formData.get('tratamiento') as string)?.trim() || null

  if (isNaN(id_mascota)) return { error: 'La mascota es obligatoria.' }
  if (!diagnostico) return { error: 'El diagnóstico es obligatorio.' }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return { error: 'No se detectó la clínica del usuario.' }

  const supabase = await getAuthenticatedClient()

  const { data: mascota, error: mascotaError } = await supabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .eq('id_clinica', perfil.id_clinica)
    .maybeSingle()

  if (mascotaError) return { error: 'No se pudo validar la mascota.' }
  if (!mascota) return { error: 'La mascota no pertenece a esta clínica.' }

  const { error } = await supabase
    .from('expedientes')
    .insert({ id_mascota, diagnostico, tratamiento })

  if (error) {
    console.error('[registrar expediente]', error)
    return { error: 'No se pudo registrar el expediente.' }
  }

  revalidatePath('/expedientes')
  return { success: true }
}

export async function eliminarExpedienteAction(
  _prev: ExpedienteState,
  formData: FormData
): Promise<ExpedienteState> {
  const id_expediente = parseInt(formData.get('id_expediente') as string)
  if (isNaN(id_expediente)) return { error: 'Expediente inválido.' }

  const perfil = await getCurrentUserProfile()
  if (perfil?.rol !== 'Administrador') {
    return { error: 'Solo los Administradores pueden eliminar expedientes.' }
  }

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase
    .from('expedientes')
    .delete()
    .eq('id_expediente', id_expediente)

  if (error) {
    console.error('[eliminar expediente]', error)
    return { error: 'No se pudo eliminar el expediente.' }
  }

  revalidatePath('/expedientes')
  return { success: true }
}

export { getCurrentUserProfile }
