import { getRuntimeConnectionSettings } from '../mcp/runtimeConfig'
import type { ApiResponse } from '../../types/api'
import { ApiError } from './apiErrors'
import type { RequestOptions } from './apiTypes'

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { apiBaseUrl, apiToken } = getRuntimeConnectionSettings()
  if (!apiBaseUrl) throw new Error('API base URL is not configured. Open Settings → Connection and enter the backend URL.')
  const response = await fetch(apiBaseUrl + path, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(apiToken ? { Authorization: 'Bearer ' + apiToken } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'omit',
    redirect: 'error',
  })
  let payload: unknown
  try { payload = await response.json() } catch { payload = undefined }
  if (!response.ok) {
    const envelope = typeof payload === 'object' && payload !== null && 'error' in payload ? (payload as { error?: { message?: unknown; code?: unknown; details?: unknown } }).error : undefined
    throw new ApiError({
      message: typeof envelope?.message === 'string' ? envelope.message : 'Request failed with status ' + response.status,
      status: response.status,
      code: typeof envelope?.code === 'string' ? envelope.code : 'REQUEST_FAILED',
      details: typeof envelope?.details === 'object' && envelope.details !== null ? envelope.details as Record<string, unknown> : undefined,
    })
  }
  if (typeof payload === 'object' && payload !== null && 'data' in payload && 'success' in payload) return payload as ApiResponse<T>
  return { data: payload as T, success: true }
}