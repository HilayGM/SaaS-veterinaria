'use server'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import {
  createAuthenticatedClient,
  createAuthenticatedClientFromToken,
  getServerSessionTokens,
} from '@/lib/supabase/server'
import { reportServerError } from '@/lib/server-log'

export type InventarioState = {
  error?: string
  success?: boolean
} | null

export type PerfilUsuario = {
  id_usuario: string
  nombre: string
  correo: string
  rol: 'Administrador' | 'Veterinario' | 'Recepcionista'
  id_clinica: number | null
  nombre_clinica: string | null
}

function isUserRole(role: string): role is PerfilUsuario['rol'] {
  return role === 'Administrador' || role === 'Veterinario' || role === 'Recepcionista'
}

const getCurrentUserProfileByToken = cache(async (accessToken: string) => {
  const supabase = createAuthenticatedClientFromToken(accessToken)
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    reportServerError('profile:auth', userError)
    return null
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, correo, rol, id_clinica, clinicas(nombre)')
    .eq('id_usuario', userData.user.id)
    .maybeSingle()

  if (perfilError || !perfil) {
    reportServerError('profile:lookup', perfilError)
    return null
  }
  if (!isUserRole(perfil.rol)) {
    reportServerError('profile:invalid-role', `Rol no reconocido: ${perfil.rol}`)
    return null
  }

  const clinicaRel = perfil.clinicas as unknown as
    | { nombre: string }
    | { nombre: string }[]
    | null
  const nombre_clinica = Array.isArray(clinicaRel)
    ? clinicaRel[0]?.nombre ?? null
    : clinicaRel?.nombre ?? null

  return {
    id_usuario: perfil.id_usuario,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol,
    id_clinica: perfil.id_clinica,
    nombre_clinica,
  } satisfies PerfilUsuario
})

export async function getCurrentUserProfile(): Promise<PerfilUsuario | null> {
  const { accessToken } = await getServerSessionTokens()
  if (!accessToken) return null

  return getCurrentUserProfileByToken(accessToken)
}

export type ProductoInventario = {
  id_producto: number
  nombre: string
  cantidad: number
  fecha_caducidad: string | null
  id_clinica: number | null
}

export async function getInventario(): Promise<ProductoInventario[]> {
  const supabase = await createAuthenticatedClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('inventario')
    .select('id_producto, nombre, cantidad, fecha_caducidad, id_clinica')
    .order('fecha_caducidad', { ascending: true, nullsFirst: false })

  if (error) {
    reportServerError('inventory:list', error)
    return []
  }

  return data ?? []
}

export async function agregarProductoAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const cantidad = Number.parseInt(String(formData.get('cantidad') ?? ''), 10)
  const fechaCaducidadRaw = String(formData.get('fecha_caducidad') ?? '').trim()
  const fecha_caducidad = fechaCaducidadRaw || null

  if (!nombre || nombre.length > 255) {
    return { error: 'El nombre es obligatorio y no puede exceder 255 caracteres.' }
  }
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { error: 'La cantidad debe ser un número entero no negativo.' }
  }

  const perfil = await getCurrentUserProfile()
  const supabase = await createAuthenticatedClient()
  if (!perfil?.id_clinica || !supabase) return { error: 'Sesión no válida.' }

  const { data, error } = await supabase
    .from('inventario')
    .insert({ nombre, cantidad, fecha_caducidad })
    .select('id_producto')
    .maybeSingle()

  if (error || !data) {
    reportServerError('inventory:create', error)
    return { error: 'No se pudo agregar el producto. Verifica tus permisos.' }
  }

  revalidatePath('/inventario')
  return { success: true }
}

export async function ajustarStockAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const id_producto = Number.parseInt(String(formData.get('id_producto') ?? ''), 10)
  const delta = Number.parseInt(String(formData.get('delta') ?? ''), 10)

  if (!Number.isInteger(id_producto) || id_producto <= 0 || !Number.isInteger(delta) || delta === 0) {
    return { error: 'Datos de stock inválidos.' }
  }
  if (Math.abs(delta) > 1_000_000) {
    return { error: 'El ajuste solicitado es demasiado grande.' }
  }

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'Sesión no válida.' }

  const { error } = await supabase.rpc('ajustar_stock', {
    p_id_producto: id_producto,
    p_delta: delta,
  })

  if (error) {
    reportServerError('inventory:adjust-stock', error)
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      return { error: 'Stock insuficiente. La cantidad no puede ser negativa.' }
    }
    if (error.message.includes('PRODUCT_NOT_AVAILABLE')) {
      return { error: 'El producto no existe o no pertenece a tu clínica.' }
    }
    return { error: 'No se pudo actualizar el stock.' }
  }

  revalidatePath('/inventario')
  return { success: true }
}

export async function eliminarProductoAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const id_producto = Number.parseInt(String(formData.get('id_producto') ?? ''), 10)
  if (!Number.isInteger(id_producto) || id_producto <= 0) {
    return { error: 'Producto inválido.' }
  }

  const supabase = await createAuthenticatedClient()
  if (!supabase) return { error: 'Sesión no válida.' }

  const { data, error } = await supabase
    .from('inventario')
    .delete()
    .eq('id_producto', id_producto)
    .select('id_producto')
    .maybeSingle()

  if (error) {
    reportServerError('inventory:delete', error)
    return { error: 'No se pudo eliminar el producto.' }
  }
  if (!data) return { error: 'El producto no existe o no pertenece a tu clínica.' }

  revalidatePath('/inventario')
  return { success: true }
}
