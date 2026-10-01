import type { IncomingMessage, ServerResponse } from 'node:http'
import { BackendError } from '../errors/BackendError.js'
import type { ApiErrorEnvelope, ApiEnvelope } from '../types/contracts.js'

export const sendJson = <T>(response: ServerResponse, status: number, body: T) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

export const sendSuccess = <T>(response: ServerResponse, data: T, status = 200) => {
  const envelope: ApiEnvelope<T> = { success: true, data }
  sendJson(response, status, envelope)
}

export const sendError = (response: ServerResponse, status: number, code: string, message: string): void => {
  const envelope: ApiErrorEnvelope = { success: false, error: { code, message, status } }
  sendJson(response, status, envelope)
}

export const readJsonBody = async (request: IncomingMessage, maximumBytes = 256 * 1024): Promise<unknown> => {
  const contentType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') throw new BackendError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Requests with a body must use application/json.')

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maximumBytes) throw new BackendError(413, 'REQUEST_TOO_LARGE', 'Request body exceeds the allowed size.')
    chunks.push(buffer)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new BackendError(400, 'INVALID_JSON', 'Request body must contain valid JSON.')
  }
}

export const parseObjectBody = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BackendError(400, 'INVALID_BODY', 'Request body must be a JSON object.')
  }
  return value as Record<string, unknown>
}

export const decodePathPart = (value: string): string => {
  try {
    const decoded = decodeURIComponent(value)
    if (!decoded || decoded.length > 128 || [...decoded].some((character) => character.charCodeAt(0) < 32)) throw new Error('bad path component')
    return decoded
  } catch {
    throw new BackendError(400, 'INVALID_PATH', 'Request path contains an invalid identifier.')
  }
}