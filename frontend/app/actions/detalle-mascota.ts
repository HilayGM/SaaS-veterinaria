'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'

export type MascotaDetalle = {
  id_mascota: number
  nombre: string
  especie: string
  raza: string | null
  fecha_nacimiento: string | null
  medicamento: string | null
  dosis: string | null
  frecuencia: string | null
  duracion: string | null
  dueno: {
    nombre: string
    telefono: string | null
    correo: string | null
  } | null
}

export type Expediente = {
  id_expediente: number
  diagnostico: string
  tratamiento: string | null
  fecha_consulta: string
}

export type Vacuna = {
  id_vacuna: number
  nombre: string
  fecha_aplicacion: string
  proxima_aplicacion: string | null
}

export async function getMascotaDetalle(id_mascota: number): Promise<MascotaDetalle | null> {
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) return null

  const supabase = await createAuthenticatedClient()
  if (!supabase) return null

  const { data: mascota, error } = await supabase
    .from('mascotas')
    .select('*')
    .eq('id_mascota', id_mascota)
    .maybeSingle()

  if (error) {
    reportServerError('pet-detail:lookup', error)
    return null
  }
  if (!mascota) return null

  let dueno: MascotaDetalle['dueno'] = null
  if (mascota['id_dueño']) {
    const { data: duenoData, error: duenoError } = await supabase
      .from('clientes_duenos')
      .select('nombre, telefono, correo')
      .eq('id_dueño', mascota['id_dueño'])
      .maybeSingle()

    if (duenoError) {
      reportServerError('pet-detail:owner', duenoError)
    } else {
      dueno = duenoData
    }
  }

  return {
    id_mascota: mascota.id_mascota,
    nombre: mascota.nombre,
    especie: mascota.especie,
    raza: mascota.raza,
    fecha_nacimiento: mascota.fecha_nacimiento,
    medicamento: mascota.medicamento,
    dosis: mascota.dosis,
    frecuencia: mascota.frecuencia,
    duracion: mascota.duracion,
    dueno,
  }
}

export async function getExpedientes(id_mascota: number): Promise<Expediente[]> {
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) return []

  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('expedientes')
    .select('id_expediente, diagnostico, tratamiento, fecha_consulta')
    .eq('id_mascota', id_mascota)
    .order('fecha_consulta', { ascending: false })

  if (error) {
    reportServerError('pet-detail:records', error)
    return []
  }

  return data ?? []
}

export async function getVacunas(id_mascota: number): Promise<Vacuna[]> {
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) return []

  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vacunas')
    .select('id_vacuna, nombre, fecha_aplicacion, proxima_aplicacion')
    .eq('id_mascota', id_mascota)
    .order('fecha_aplicacion', { ascending: false })

  if (error) {
    reportServerError('pet-detail:vaccines', error)
    return []
  }

  return data ?? []
}
