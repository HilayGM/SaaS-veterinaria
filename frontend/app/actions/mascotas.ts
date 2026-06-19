'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile } from './inventario'

export type { PerfilUsuario } from './inventario'

export type MascotaState = {
  error?: string
  success?: boolean
} | null

export type MascotaConDueno = {
  id_mascota: number
  nombre: string
  especie: string
  raza: string | null
  fecha_nacimiento: string | null
  id_clinica: number | null
  dueno: {
    nombre: string
    telefono: string | null
    correo: string | null
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

export async function getMascotas(): Promise<MascotaConDueno[]> {
  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // select('*') evita poner id_dueño (ñ) en el string de select que PostgREST parsea
  const { data: mascotasRaw, error } = await adminSupabase
    .from('mascotas')
    .select('*')
    .eq('id_clinica', perfil.id_clinica)
    .order('id_mascota', { ascending: false })

  if (error) {
    console.error('[getMascotas]', error)
    return []
  }
  if (!mascotasRaw?.length) return []

  // Query separada para clientes_duenos — PostgREST no puede seguir el FK
  // con el caracter ñ en el nombre de columna, así que hacemos el join en código
  const { data: duenosRaw } = await adminSupabase
    .from('clientes_duenos')
    .select('*')

  const duenosPorId: Record<number, MascotaConDueno['dueno']> = {}
  for (const d of duenosRaw ?? []) {
    const id = d['id_dueño'] as number
    duenosPorId[id] = { nombre: d.nombre, telefono: d.telefono, correo: d.correo }
  }

  return mascotasRaw.map(m => {
    const idDueno = m['id_dueño'] as number | null
    return {
      id_mascota: m.id_mascota,
      nombre: m.nombre,
      especie: m.especie,
      raza: m.raza,
      fecha_nacimiento: m.fecha_nacimiento,
      id_clinica: m.id_clinica,
      dueno: idDueno ? (duenosPorId[idDueno] ?? null) : null,
    }
  })
}

export async function registrarMascotaAction(
  _prev: MascotaState,
  formData: FormData
): Promise<MascotaState> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const especie = (formData.get('especie') as string)?.trim()
  const raza = (formData.get('raza') as string)?.trim() || null
  const fecha_nacimiento = (formData.get('fecha_nacimiento') as string) || null
  const nombre_dueno = (formData.get('nombre_dueno') as string)?.trim()
  const id_clinica_str = formData.get('id_clinica') as string

  if (!nombre) return { error: 'El nombre de la mascota es obligatorio.' }
  if (!especie) return { error: 'La especie es obligatoria.' }
  if (!nombre_dueno) return { error: 'El nombre del propietario es obligatorio.' }

  const id_clinica = id_clinica_str ? parseInt(id_clinica_str) : null
  if (!id_clinica) return { error: 'No se detectó la clínica del usuario.' }

  const supabase = await getAuthenticatedClient()

  // clientes_duenos no tiene RLS activo, pero la anon key no tiene GRANT de INSERT
  // por defecto en Supabase. Usamos el admin client (service_role) para este insert.
  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Crear el dueño
  const { data: dueno, error: duenoError } = await adminSupabase
    .from('clientes_duenos')
    .insert({ nombre: nombre_dueno })
    .select('*')
    .single()

  if (duenoError || !dueno) {
    console.error('[registrar mascota - dueño]', duenoError)
    return { error: 'No se pudo registrar al propietario.' }
  }

  // 2. Crear la mascota enlazada al dueño y a la clínica (RLS valida id_clinica)
  const { error: mascotaError } = await supabase
    .from('mascotas')
    .insert({
      nombre,
      especie,
      raza,
      fecha_nacimiento,
      id_dueño: dueno['id_dueño'],
      id_clinica,
    })

  if (mascotaError) {
    console.error('[registrar mascota]', mascotaError)
    return { error: 'No se pudo registrar la mascota. Verifica tus permisos.' }
  }

  revalidatePath('/mascotas')
  return { success: true }
}

export async function eliminarMascotaAction(
  _prev: MascotaState,
  formData: FormData
): Promise<MascotaState> {
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  if (isNaN(id_mascota)) return { error: 'Mascota inválida.' }

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase
    .from('mascotas')
    .delete()
    .eq('id_mascota', id_mascota)

  if (error) {
    console.error('[eliminar mascota]', error)
    return { error: 'No se pudo eliminar la mascota.' }
  }

  revalidatePath('/mascotas')
  return { success: true }
}

export { getCurrentUserProfile }
