import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BackendEnvironment } from '../config/environment.js'
import { BackendError } from '../errors/BackendError.js'

export const applySecurityHeaders = (response: ServerResponse, origin: string | undefined, environment: BackendEnvironment) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Vary', 'Origin')
  if (origin && environment.allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.setHeader('Access-Control-Max-Age', '600')
  }
}

export const validateRequestOrigin = (request: IncomingMessage, environment: BackendEnvironment) => {
  const origin = request.headers.origin
  if (origin && !environment.allowedOrigins.includes(origin)) {
    throw new BackendError(403, 'ORIGIN_NOT_ALLOWED', 'This request origin is not allowed.')
  }
}

export class InMemoryRateLimiter {
  private readonly requests = new Map<string, number[]>()

  constructor(private readonly maximumRequests = 120, private readonly windowMs = 60_000) {}

  check(key: string, now = Date.now()): boolean {
    const active = (this.requests.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs)
    if (active.length >= this.maximumRequests) {
      this.requests.set(key, active)
      return false
    }
    active.push(now)
    this.requests.set(key, active)
    if (this.requests.size > 5000) {
      for (const [entryKey, timestamps] of this.requests) {
        if (timestamps.every((timestamp) => now - timestamp >= this.windowMs)) this.requests.delete(entryKey)
      }
    }
    return true
  }
}