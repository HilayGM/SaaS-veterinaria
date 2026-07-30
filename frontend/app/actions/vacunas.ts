'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
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

function getFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

export async function getVacunas(): Promise<VacunaConMascota[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotasRaw, error: mascotasError } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, especie, raza')
    .eq('id_clinica', perfil.id_clinica)

  if (mascotasError) {
    console.error('[getVacunas - mascotas]', mascotasError)
    return []
  }
  if (!mascotasRaw?.length) return []

  const mascotasPorId: Record<number, VacunaConMascota['mascota']> = {}
  const idsMascotas = mascotasRaw.map(m => {
    mascotasPorId[m.id_mascota] = {
      id_mascota: m.id_mascota,
      nombre: m.nombre,
      especie: m.especie,
      raza: m.raza,
    }
    return m.id_mascota
  })

  const { data: vacunasRaw, error: vacunasError } = await adminSupabase
    .from('vacunas')
    .select('id_vacuna, id_mascota, nombre, fecha_aplicacion, proxima_aplicacion')
    .in('id_mascota', idsMascotas)
    .order('proxima_aplicacion', { ascending: true, nullsFirst: false })

  if (vacunasError) {
    console.error('[getVacunas]', vacunasError)
    return []
  }
  if (!vacunasRaw?.length) return []

  return vacunasRaw.map(v => ({
    id_vacuna: v.id_vacuna,
    id_mascota: v.id_mascota,
    nombre: v.nombre,
    fecha_aplicacion: v.fecha_aplicacion,
    proxima_aplicacion: v.proxima_aplicacion,
    mascota: v.id_mascota ? (mascotasPorId[v.id_mascota] ?? null) : null,
  }))
}

export async function registrarVacunaAction(
  _prev: VacunaState,
  formData: FormData
): Promise<VacunaState> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  const fecha_aplicacion = (formData.get('fecha_aplicacion') as string) || getFechaActual()
  const proxima_aplicacion = (formData.get('proxima_aplicacion') as string) || null

  if (!nombre) return { error: 'El nombre de la vacuna es obligatorio.' }
  if (isNaN(id_mascota)) return { error: 'La mascota es obligatoria.' }
  if (proxima_aplicacion && proxima_aplicacion <= fecha_aplicacion) {
    return { error: 'La próxima aplicación debe ser mayor que la fecha de aplicación.' }
  }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return { error: 'No se detectó la clínica del usuario.' }

  const supabase = await getAuthenticatedClient()

  const { data: mascota, error: mascotaError } = await supabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .eq('id_clinica', perfil.id_clinica)
    .maybeSingle()

  if (mascotaError) {
    console.error('[registrar vacuna - mascota]', mascotaError)
    return { error: 'No se pudo validar la mascota seleccionada.' }
  }
  if (!mascota) return { error: 'La mascota seleccionada no pertenece a esta clínica.' }

  const { error: vacunaError } = await supabase
    .from('vacunas')
    .insert({
      id_mascota,
      nombre,
      fecha_aplicacion,
      proxima_aplicacion,
    })

  if (vacunaError) {
    console.error('[registrar vacuna]', vacunaError)
    return { error: 'No se pudo registrar la vacuna. Verifica tus permisos.' }
  }

  revalidatePath('/vacunas')
  return { success: true }
}

export { getCurrentUserProfile }
