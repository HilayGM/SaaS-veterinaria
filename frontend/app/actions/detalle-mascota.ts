'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { getCurrentUserProfile } from './inventario'

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

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  )
}

export async function getMascotaDetalle(id_mascota: number): Promise<MascotaDetalle | null> {
  const supabase = await getAuthenticatedClient()

  // Verify access implicitly via RLS
  const { data: mascota, error } = await supabase
    .from('mascotas')
    .select('*')
    .eq('id_mascota', id_mascota)
    .single()

  if (error || !mascota) {
    console.error('[getMascotaDetalle]', error)
    return null
  }

  // Get owner info securely using service_role since clientes_duenos doesn't have RLS active for anon yet
  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let dueno = null
  if (mascota['id_dueño']) {
    const { data: duenoData } = await adminSupabase
      .from('clientes_duenos')
      .select('nombre, telefono, correo')
      .eq('id_dueño', mascota['id_dueño'])
      .single()
    if (duenoData) {
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
  const supabase = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('expedientes')
    .select('id_expediente, diagnostico, tratamiento, fecha_consulta')
    .eq('id_mascota', id_mascota)
    .order('fecha_consulta', { ascending: false })

  if (error) {
    console.error('[getExpedientes]', error)
    return []
  }

  return data as Expediente[]
}

export async function getVacunas(id_mascota: number): Promise<Vacuna[]> {
  const supabase = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('vacunas')
    .select('id_vacuna, nombre, fecha_aplicacion, proxima_aplicacion')
    .eq('id_mascota', id_mascota)
    .order('fecha_aplicacion', { ascending: false })

  if (error) {
    console.error('[getVacunas]', error)
    return []
  }

  return data as Vacuna[]
}
