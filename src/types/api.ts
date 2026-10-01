export type ApiErrorShape = {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}

export type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
}
