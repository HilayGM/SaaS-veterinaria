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

export type MascotaExpediente = {
  id_mascota: number
  nombre: string
  especie: string
  raza: string | null
}

export type ExpedienteConMascota = {
  id_expediente: number
  id_mascota: number | null
  diagnostico: string
  tratamiento: string | null
  fecha_consulta: string
  mascota: MascotaExpediente | null
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

export async function getMascotasExpediente(idClinica?: number | null): Promise<MascotaExpediente[]> {
  const perfil = idClinica ? null : await getCurrentUserProfile()
  const id_clinica = idClinica ?? perfil?.id_clinica
  if (!id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotasRaw, error } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, especie, raza')
    .eq('id_clinica', id_clinica)
    .order('id_mascota', { ascending: false })

  if (error) {
    console.error('[getMascotasExpediente]', error)
    return []
  }

  return mascotasRaw ?? []
}

export async function getExpedientes(idClinica?: number | null): Promise<ExpedienteConMascota[]> {
  const perfil = idClinica ? null : await getCurrentUserProfile()
  const id_clinica = idClinica ?? perfil?.id_clinica
  if (!id_clinica) return []

  const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mascotasRaw, error: mascotasError } = await adminSupabase
    .from('mascotas')
    .select('id_mascota, nombre, especie, raza')
    .eq('id_clinica', id_clinica)

  if (mascotasError) {
    console.error('[getExpedientes - mascotas]', mascotasError)
    return []
  }
  if (!mascotasRaw?.length) return []

  const mascotasPorId: Record<number, ExpedienteConMascota['mascota']> = {}
  const idsMascotas = mascotasRaw.map(m => {
    mascotasPorId[m.id_mascota] = {
      id_mascota: m.id_mascota,
      nombre: m.nombre,
      especie: m.especie,
      raza: m.raza,
    }
    return m.id_mascota
  })

  const { data: expedientesRaw, error: expedientesError } = await adminSupabase
    .from('expedientes')
    .select('id_expediente, id_mascota, diagnostico, tratamiento, fecha_consulta')
    .in('id_mascota', idsMascotas)
    .order('fecha_consulta', { ascending: false })

  if (expedientesError) {
    console.error('[getExpedientes]', expedientesError)
    return []
  }
  if (!expedientesRaw?.length) return []

  return expedientesRaw.map(e => ({
    id_expediente: e.id_expediente,
    id_mascota: e.id_mascota,
    diagnostico: e.diagnostico,
    tratamiento: e.tratamiento,
    fecha_consulta: e.fecha_consulta,
    mascota: e.id_mascota ? (mascotasPorId[e.id_mascota] ?? null) : null,
  }))
}

export async function registrarExpedienteAction(
  _prev: ExpedienteState,
  formData: FormData
): Promise<ExpedienteState> {
  const id_mascota = parseInt(formData.get('id_mascota') as string)
  const diagnostico = (formData.get('diagnostico') as string)?.trim()
  const tratamiento = (formData.get('tratamiento') as string)?.trim() || null
  const fecha_consulta = (formData.get('fecha_consulta') as string) || getFechaActual()
  const productosInsumos = formData.getAll('id_producto_insumo')
  const cantidadesInsumos = formData.getAll('cantidad_usada_insumo')

  if (isNaN(id_mascota)) return { error: 'La mascota es obligatoria.' }
  if (!diagnostico) return { error: 'El diagnostico es obligatorio.' }

  const insumos = productosInsumos.reduce<Array<{ id_producto: number; cantidad_usada: number }>>((acc, productoRaw, index) => {
    const productoValor = String(productoRaw || '').trim()
    const cantidadValor = String(cantidadesInsumos[index] || '').trim()

    if (!productoValor && !cantidadValor) return acc

    const id_producto = parseInt(productoValor)
    const cantidad_usada = parseInt(cantidadValor)

    if (isNaN(id_producto) || isNaN(cantidad_usada) || cantidad_usada <= 0) {
      acc.push({ id_producto: NaN, cantidad_usada: NaN })
      return acc
    }

    acc.push({ id_producto, cantidad_usada })
    return acc
  }, [])

  if (insumos.some(i => isNaN(i.id_producto) || isNaN(i.cantidad_usada))) {
    return { error: 'Verifica los productos y cantidades de los insumos.' }
  }

  const perfil = await getCurrentUserProfile()
  if (!perfil?.id_clinica) return { error: 'No se detecto la clinica del usuario.' }

  const supabase = await getAuthenticatedClient()

  const { data: mascota, error: mascotaError } = await supabase
    .from('mascotas')
    .select('id_mascota')
    .eq('id_mascota', id_mascota)
    .eq('id_clinica', perfil.id_clinica)
    .maybeSingle()

  if (mascotaError) {
    console.error('[registrar expediente - mascota]', mascotaError)
    return { error: 'No se pudo validar la mascota seleccionada.' }
  }
  if (!mascota) return { error: 'La mascota seleccionada no pertenece a esta clinica.' }

  const { data: expediente, error: expedienteError } = await supabase
    .from('expedientes')
    .insert({
      id_mascota,
      diagnostico,
      tratamiento,
      fecha_consulta,
    })
    .select('id_expediente')
    .single()

  if (expedienteError) {
    console.error('[registrar expediente]', expedienteError)
    return { error: 'No se pudo registrar el expediente. Verifica tus permisos.' }
  }

  if (insumos.length > 0) {
    const detalles = insumos.map(insumo => ({
      id_expediente: expediente.id_expediente,
      id_producto: insumo.id_producto,
      cantidad_usada: insumo.cantidad_usada,
    }))

    const { error: insumosError } = await supabase
      .from('detalle_insumos_expediente')
      .insert(detalles)

    if (insumosError) {
      console.error('[registrar expediente - insumos]', insumosError)
      return { error: insumosError.message || 'No se pudieron registrar los insumos del expediente.' }
    }
  }

  revalidatePath('/expedientes')
  revalidatePath('/inventario')
  return { success: true }
}

export { getCurrentUserProfile }
