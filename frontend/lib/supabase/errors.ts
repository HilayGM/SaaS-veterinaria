type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function getFriendlyError(
  error: unknown,
  fallback = 'No fue posible completar la operación.'
) {
  const supabaseError = (error ?? {}) as SupabaseError
  const code = supabaseError.code?.toLowerCase() ?? ''
  const description = [
    supabaseError.message,
    supabaseError.details,
    supabaseError.hint,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (
    description.includes('insufficient_stock') ||
    (code === '23514' &&
      (description.includes('chk_cantidad_no_negativa') ||
        description.includes('inventario') ||
        description.includes('stock')))
  ) {
    return 'No hay suficiente stock.'
  }

  if (code === '23514') {
    return 'Los datos ingresados no son válidos.'
  }

  if (code === '23505' || description.includes('already registered')) {
    return 'El registro ya existe.'
  }

  if (
    code === 'invalid_credentials' ||
    description.includes('invalid login credentials')
  ) {
    return 'Correo o contraseña incorrectos.'
  }

  if (description.includes('invalid_quantity')) {
    return 'La cantidad debe ser mayor que cero.'
  }

  if (
    description.includes('auth_required') ||
    description.includes('clinic_not_found')
  ) {
    return 'No fue posible identificar la clínica de la sesión.'
  }

  return fallback
}
