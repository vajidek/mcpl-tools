export type NormalizedError = {
  code: string
  message: string
  details?: string
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return { code: 'APP_ERROR', message: error.message }
  }

  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' }
}
