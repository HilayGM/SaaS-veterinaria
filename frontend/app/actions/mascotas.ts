'use server'

import { revalidatePath } from 'next/cache'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'
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

export async function getMascotas(): Promise<MascotaConDueno[]> {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data: mascotas, error: mascotasError } = await supabase
    .from('mascotas')
    .select('*')
    .order('id_mascota', { ascending: false })

  if (mascotasError) {
    reportServerError('pets:list', mascotasError)
    return []
  }
  if (!mascotas?.length) return []

  const idsDuenos = [
    ...new Set(
      mascotas
        .map((mascota) => mascota['id_dueño'])
        .filter((id): id is number => typeof id === 'number')
    ),
  ]
  const duenosPorId: Record<number, MascotaConDueno['dueno']> = {}

  if (idsDuenos.length > 0) {
    const { data: duenos, error: duenosError } = await supabase
      .from('clientes_duenos')
      .select('*')
      .in('id_dueño', idsDuenos)

    if (duenosError) {
      reportServerError('pets:owners-list', duenosError)
    } else {
      for (const dueno of duenos ?? []) {
        duenosPorId[dueno['id_dueño']] = {
          nombre: dueno.nombre,
          telefono: dueno.telefono,
          correo: dueno.correo,
        }
      }
    }
  }

  return mascotas.map((mascota) => {
    const idDueno = mascota['id_dueño']
    return {
      id_mascota: mascota.id_mascota,
      nombre: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza,
      fecha_nacimiento: mascota.fecha_nacimiento,
      id_clinica: mascota.id_clinica,
      medicamento: mascota.medicamento,
      dosis: mascota.dosis,
      frecuencia: mascota.frecuencia,
      duracion: mascota.duracion,
      dueno: idDueno ? (duenosPorId[idDueno] ?? null) : null,
    }
  })
}

export async function registrarMascotaAction(
  _prev: MascotaState,
  formData: FormData
): Promise<MascotaState> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const especie = String(formData.get('especie') ?? '').trim()
  const raza = String(formData.get('raza') ?? '').trim() || null
  const fecha_nacimiento = String(formData.get('fecha_nacimiento') ?? '').trim() || null
  const nombre_dueno = String(formData.get('nombre_dueno') ?? '').trim()
  const medicamento = String(formData.get('medicamento') ?? '').trim() || null
  const dosis = String(formData.get('dosis') ?? '').trim() || null
  const frecuencia = String(formData.get('frecuencia') ?? '').trim() || null
  const duracion = String(formData.get('duracion') ?? '').trim() || null

  if (!nombre || nombre.length > 255) return { error: 'El nombre de la mascota no es válido.' }
  if (!especie || especie.length > 100) return { error: 'La especie no es válida.' }
  if (!nombre_dueno || nombre_dueno.length > 255) {
    return { error: 'El nombre del propietario no es válido.' }
  }

  const perfil = await getCurrentUserProfile()
  const supabase = await createAuthenticatedClient()
  if (!perfil?.id_clinica || !supabase) return { error: 'Sesión no válida.' }

  const { error } = await supabase.rpc('registrar_mascota_con_dueno', {
    p_nombre: nombre,
    p_especie: especie,
    p_raza: raza ?? undefined,
    p_fecha_nacimiento: fecha_nacimiento ?? undefined,
    p_nombre_dueno: nombre_dueno,
    p_medicamento: medicamento ?? undefined,
    p_dosis: dosis ?? undefined,
    p_frecuencia: frecuencia ?? undefined,
    p_duracion: duracion ?? undefined,
  })

  if (error) {
    reportServerError('pets:create', error)
    return { error: 'No se pudo registrar la mascota. Verifica los datos e intenta de nuevo.' }
  }

  revalidatePath('/mascotas')
  return { success: true }
}

export async function eliminarMascotaAction(
  _prev: MascotaState,
  formData: FormData
): Promise<MascotaState> {
  const id_mascota = Number.parseInt(String(formData.get('id_mascota') ?? ''), 10)
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) return { error: 'Mascota inválida.' }

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'Sesión no válida.' }

  const { data, error } = await supabase
    .from('mascotas')
    .delete()
    .eq('id_mascota', id_mascota)
    .select('id_mascota')
    .maybeSingle()

  if (error) {
    reportServerError('pets:delete', error)
    return { error: 'No se pudo eliminar la mascota.' }
  }
  if (!data) return { error: 'La mascota no existe o no pertenece a tu clínica.' }

  revalidatePath('/mascotas')
  return { success: true }
}

export async function actualizarRecetaAction(
  _prev: MascotaState,
  formData: FormData
): Promise<MascotaState> {
  const id_mascota = Number.parseInt(String(formData.get('id_mascota') ?? ''), 10)
  if (!Number.isInteger(id_mascota) || id_mascota <= 0) return { error: 'Mascota inválida.' }

  const medicamento = String(formData.get('medicamento') ?? '').trim() || null
  const dosis = String(formData.get('dosis') ?? '').trim() || null
  const frecuencia = String(formData.get('frecuencia') ?? '').trim() || null
  const duracion = String(formData.get('duracion') ?? '').trim() || null

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'Sesión no válida.' }

  const { data, error } = await supabase
    .from('mascotas')
    .update({ medicamento, dosis, frecuencia, duracion })
    .eq('id_mascota', id_mascota)
    .select('id_mascota')
    .maybeSingle()

  if (error) {
    reportServerError('pets:update-prescription', error)
    return { error: 'No se pudo actualizar la receta médica.' }
  }
  if (!data) return { error: 'La mascota no existe o no pertenece a tu clínica.' }

  revalidatePath('/mascotas')
  revalidatePath(`/mascotas/detalle/${id_mascota}`)
  return { success: true }
}

export { getCurrentUserProfile }
