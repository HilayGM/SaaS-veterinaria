import 'server-only'

export function reportServerError(scope: string, error: unknown) {
  if (process.env.NODE_ENV === 'production') return

  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : String(error ?? 'Unknown error')

  console.error(`[${scope}] ${message}`)
}
