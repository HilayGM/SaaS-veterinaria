'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ÔöÇÔöÇ Tipos ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export type InventarioState = {
  error?: string
  success?: boolean
} | null

// Helper: cliente autenticado con el JWT del usuario
async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  )
  return supabase
}

// ÔöÇÔöÇ PERFIL DEL USUARIO ACTUAL (sesi├│n + fila en `usuarios`) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export type PerfilUsuario = {
  id_usuario: string
  nombre: string
  correo: string
  rol: 'Administrador' | 'Veterinario' | 'Recepcionista'
  id_clinica: number | null
  nombre_clinica: string | null
}

export async function getCurrentUserProfile(): Promise<PerfilUsuario | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) return null

  const supabase = await getAuthenticatedClient()

  // 1. Identificar al usuario a partir del JWT
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData.user) return null

  // 2. Traer su fila de la tabla `usuarios` (RLS: cada quien solo ve la suya)
  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, correo, rol, id_clinica, clinicas(nombre)')
    .eq('id_usuario', userData.user.id)
    .maybeSingle()

  if (perfilError || !perfil) return null

  const clinicaRel = perfil.clinicas as unknown as { nombre: string } | { nombre: string }[] | null
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
  }
}

// ÔöÇÔöÇ LISTAR INVENTARIO DE LA CL├ìNICA DEL USUARIO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export type ProductoInventario = {
  id_producto: number
  nombre: string
  cantidad: number
  fecha_caducidad: string | null
  id_clinica: number | null
}

export async function getInventario(): Promise<ProductoInventario[]> {
  const supabase = await getAuthenticatedClient()
  // No filtramos id_clinica expl├¡citamente: RLS ya garantiza el aislamiento
  // multitenant, as├¡ que esta consulta solo regresa los productos de la
  // cl├¡nica del usuario autenticado (o vac├¡o si no tiene cl├¡nica/sesi├│n).
  const { data, error } = await supabase
    .from('inventario')
    .select('id_producto, nombre, cantidad, fecha_caducidad, id_clinica')
    .order('fecha_caducidad', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('[getInventario]', error)
    return []
  }
  return data ?? []
}

// ÔöÇÔöÇ AGREGAR PRODUCTO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export async function agregarProductoAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const nombre = (formData.get('nombre') as string)?.trim()
  const cantidad_str = formData.get('cantidad') as string
  const fecha_caducidad = (formData.get('fecha_caducidad') as string) || null
  const id_clinica_str = formData.get('id_clinica') as string

  if (!nombre) return { error: 'El nombre del producto es obligatorio.' }

  const cantidad = parseInt(cantidad_str)
  if (isNaN(cantidad) || cantidad < 0) {
    return { error: 'La cantidad debe ser un n├║mero positivo.' }
  }

  const id_clinica = id_clinica_str ? parseInt(id_clinica_str) : null
  if (!id_clinica) return { error: 'No se detect├│ la cl├¡nica del usuario.' }

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase.from('inventario').insert({
    nombre,
    cantidad,
    fecha_caducidad,
    id_clinica,
  })

  if (error) {
    console.error('[agregar producto]', error)
    return { error: 'No se pudo agregar el producto. Verifica tus permisos.' }
  }

  revalidatePath('/inventario')
  return { success: true }
}

// ÔöÇÔöÇ AJUSTAR STOCK (sumar o restar) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export async function ajustarStockAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const id_producto = parseInt(formData.get('id_producto') as string)
  const delta = parseInt(formData.get('delta') as string) // positivo = agregar, negativo = restar
  const cantidad_actual = parseInt(formData.get('cantidad_actual') as string)

  if (isNaN(id_producto) || isNaN(delta)) {
    return { error: 'Datos inv├ílidos.' }
  }

  const nueva_cantidad = cantidad_actual + delta
  if (nueva_cantidad < 0) {
    return { error: 'Stock insuficiente. La cantidad no puede ser negativa.' }
  }

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase
    .from('inventario')
    .update({ cantidad: nueva_cantidad })
    .eq('id_producto', id_producto)

  if (error) {
    console.error('[ajustar stock]', error)
    return { error: 'No se pudo actualizar el stock.' }
  }

  revalidatePath('/inventario')
  return { success: true }
}

// ÔöÇÔöÇ ELIMINAR PRODUCTO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export async function eliminarProductoAction(
  _prev: InventarioState,
  formData: FormData
): Promise<InventarioState> {
  const id_producto = parseInt(formData.get('id_producto') as string)

  if (isNaN(id_producto)) return { error: 'Producto inv├ílido.' }

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id_producto', id_producto)

  if (error) {
    console.error('[eliminar producto]', error)
    return { error: 'No se pudo eliminar el producto.' }
  }

  revalidatePath('/inventario')
  return { success: true }
}
