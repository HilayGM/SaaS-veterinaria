// Utilidades para manejo de errores

export function getFriendlyError(
  error: unknown,
  fallbackMessage = 'Ha ocurrido un error inesperado.'
): string {
  if (!error) return fallbackMessage
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object'
    && 'message' in error
    && typeof error.message === 'string'
  ) {
    return error.message
  }
  return fallbackMessage
}
