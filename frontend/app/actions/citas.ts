'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile } from '@/app/actions/inventario'

export type CitaState = {
  error?: string
  success?: boolean
} | null

export type MascotaParaCita = {
  id_mascota: number
  nombre: string
}

export type CitaConMascota = {
  id_cita: number
  id_mascota: number | null
  fecha: string
  estado: 'Pendiente' | 'Completada' | 'Cancelada'
  mascota: MascotaParaCita | null
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

export async function getMascotasParaCita(): Promise<MascotaParaCita[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotasRaw, error } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre')
    .eq('id_clinica', perfil.id_clinica)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('[getMascotasParaCita]', error)
    return []
  }

  return mascotasRaw ?? []
}

export async function getCitas(): Promise<CitaConMascota[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotasRaw, error: mascotasError } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre')
    .eq('id_clinica', perfil.id_clinica)

  if (mascotasError) {
    console.error('[getCitas - mascotas]', mascotasError)
    return []
  }

  if (!mascotasRaw?.length) return []

  const mascotasPorId: Record<number, MascotaParaCita> = {}
  const idsMascotas = mascotasRaw.map(m => {
    mascotasPorId[m.id_mascota] = {
      id_mascota: m.id_mascota,
      nombre: m.nombre,
    }
    return m.id_mascota
  })

  if (idsMascotas.length === 0) return []

  const { data: citasRaw, error: citasError } = await adminSupabase
    .from('citas')
    .select('id_cita, id_mascota, fecha, estado')
    .in('id_mascota', idsMascotas)
    .order('fecha', { ascending: true })

  if (citasError) {
    console.error('[getCitas]', citasError)
    return []
  }

  if (!citasRaw?.length) return []

  return citasRaw.map(c => ({
    id_cita: c.id_cita,
    id_mascota: c.id_mascota,
    fecha: c.fecha,
    estado: c.estado,
    mascota: c.id_mascota ? mascotasPorId[c.id_mascota] ?? null : null,
  }))
}

export async function registrarCitaAction(
  _prev: CitaState,
  formData: FormData
): Promise<CitaState> {
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  const fecha = (formData.get('fecha') as string)?.trim()

  if (isNaN(id_mascota)) {
    return { error: 'La mascota es obligatoria.' }
  }

  if (!fecha) {
    return { error: 'La fecha y hora son obligatorias.' }
  }

  const fechaObjeto = new Date(fecha)
  if (Number.isNaN(fechaObjeto.getTime())) {
    return { error: 'La fecha de la cita no es válida.' }
  }

  if (fechaObjeto.getTime() < Date.now()) {
    return { error: 'La fecha de la cita no puede estar en el pasado.' }
  }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) {
    return { error: 'No se detectó la clínica del usuario.' }
  }

  const supabase = await getAuthenticatedClient()

  const { data: mascota, error: mascotaError } = await supabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .eq('id_clinica', perfil.id_clinica)
    .maybeSingle()

  if (mascotaError) {
    console.error('[registrarCitaAction - mascota]', mascotaError)
    return { error: 'No se pudo validar la mascota seleccionada.' }
  }

  if (!mascota) {
    return { error: 'La mascota seleccionada no pertenece a esta clínica.' }
  }

  const { error } = await supabase.from('citas').insert({
    id_mascota,
    fecha,
    estado: 'Pendiente',
  })

  if (error) {
    console.error('[registrarCitaAction]', error)
    return { error: 'No se pudo registrar la cita. Verifica tus permisos.' }
  }

  revalidatePath('/citas')
  return { success: true }
}
