// Utilidades para manejo de errores

export function getFriendlyError(error: any, fallbackMessage: string = "Ha ocurrido un error inesperado."): string {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return fallbackMessage;
}
