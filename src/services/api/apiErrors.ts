import type { ApiErrorShape } from '../../types/api'

export class ApiError extends Error {
  status?: number
  code?: string
  details?: Record<string, unknown>

  constructor(payload: ApiErrorShape) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = payload.status
    this.code = payload.code
    this.details = payload.details
  }
}
