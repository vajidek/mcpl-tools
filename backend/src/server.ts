import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getBackendEnvironment, validateBackendEnvironment, type BackendEnvironment } from './config/environment.js'
import { ApiController } from './controllers/ApiController.js'
import { BackendError } from './errors/BackendError.js'
import { InMemoryRateLimiter, applySecurityHeaders, validateRequestOrigin } from './middleware/security.js'
import { MCPGatewayService } from './mcp/MCPGatewayService.js'
import { InMemoryRuntimeRepositories } from './services/InMemoryRepositories.js'
import { loadServerConfigurations } from './services/ServerConfiguration.js'
import type { MCPServer } from './types/contracts.js'
import { sendError } from './utils/http.js'

export const createBackendServer = (providedEnvironment?: BackendEnvironment): Server => {
  const environment = validateBackendEnvironment(providedEnvironment ?? getBackendEnvironment())
  const configured = loadServerConfigurations(environment.mcpServers, {
    allowedCommands: environment.allowedCommands,
    allowedHosts: environment.allowedMcpHosts,
    environment: environment.environment,
    envValues: process.env,
  })
  const servers: MCPServer[] = configured.map(({ command: _command, args: _args, env: _env, connectionTimeoutMs: _connectionTimeoutMs, requestTimeoutMs: _requestTimeoutMs, ...server }) => ({
    ...server,
    connectionStatus: 'disconnected',
  }))
  const repositories = new InMemoryRuntimeRepositories(servers)
  const gateway = new MCPGatewayService(configured, repositories, repositories, environment)
  const controller = new ApiController(environment, repositories, repositories, repositories, gateway)
  const rateLimiter = new InMemoryRateLimiter()

  const handleError = (error: unknown, request: IncomingMessage, response: ServerResponse) => {
    const backendError = error instanceof BackendError ? error : undefined
    const status = backendError?.status ?? 500
    const code = backendError?.code ?? 'INTERNAL_ERROR'
    const message = backendError?.message ?? 'An unexpected server error occurred.'
    repositories.addLog(status >= 500 ? 'ERROR' : 'WARN', `Request rejected (${code})`, { operation: `${request.method ?? 'UNKNOWN'} API request` })
    if (!backendError) console.error('[mcpl-tools-api] unexpected request error:', error instanceof Error ? error.name : 'unknown error')
    if (!response.headersSent) sendError(response, status, code, message)
    else response.destroy()
  }

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin
    applySecurityHeaders(response, origin, environment)

    try {
      validateRequestOrigin(request, environment)
      if (request.method === 'OPTIONS') {
        if (!origin) throw new BackendError(400, 'ORIGIN_REQUIRED', 'CORS preflight requests require an Origin header.')
        response.statusCode = 204
        response.end()
        return
      }
      if (!['GET', 'POST', 'DELETE'].includes(request.method ?? '')) {
        response.setHeader('Allow', 'GET, POST, DELETE, OPTIONS')
        throw new BackendError(405, 'METHOD_NOT_ALLOWED', 'The requested method is not supported.')
      }
      const address = request.socket.remoteAddress ?? 'unknown'
      if (!rateLimiter.check(address)) throw new BackendError(429, 'RATE_LIMITED', 'Request rate limit exceeded. Retry shortly.')
      await controller.handle(request, response)
    } catch (error) {
      handleError(error, request, response)
    }
  })

  server.headersTimeout = 10_000
  server.requestTimeout = 15_000
  server.keepAliveTimeout = 5_000
  server.on('close', () => { void gateway.close() })
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const environment = validateBackendEnvironment(getBackendEnvironment())
  const server = createBackendServer(environment)
  server.listen(environment.port, environment.host, () => {
    console.info(`[mcpl-tools-api] listening on http://${environment.host}:${environment.port}`)
    console.info('[mcpl-tools-api] supported MCP transports:', 'stdio, streamable HTTP')
  })
  const shutdown = () => server.close()
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}