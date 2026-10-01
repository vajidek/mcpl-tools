import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getBackendEnvironment, validateBackendEnvironment, type BackendEnvironment } from './config/environment.js'
import { ApiController } from './controllers/ApiController.js'
import { BackendError } from './errors/BackendError.js'
import { InMemoryRateLimiter, applySecurityHeaders, validateApiAuthentication, validateRequestOrigin } from './middleware/security.js'
import { MCPGatewayService } from './mcp/MCPGatewayService.js'
import { InMemoryRuntimeRepositories } from './services/InMemoryRepositories.js'
import { loadServerConfigurations } from './services/ServerConfiguration.js'
import type { MCPServer } from './types/contracts.js'
import { sendError } from './utils/http.js'

const appendBuiltinConfiguration = (raw: string, environment: BackendEnvironment): string => {
  if (!environment.enableBuiltinTools) return raw
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (!Array.isArray(parsed)) return raw
  if (parsed.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).id === 'mcpl-core-tools')) {
    throw new BackendError(500, 'BUILTIN_SERVER_CONFLICT', 'The reserved mcpl-core-tools server ID is already configured.')
  }
  const builtinScript = resolve(dirname(fileURLToPath(import.meta.url)), 'builtin/builtinToolsServer.js')
  return JSON.stringify([
    ...parsed,
    {
      id: 'mcpl-core-tools',
      name: 'MCPL Core Tools',
      description: 'Bundled utility MCP server with safe developer productivity tools.',
      transport: 'stdio',
      capabilities: ['tools', 'resources', 'prompts'],
      enabled: true,
      command: process.execPath,
      args: [builtinScript],
      connectionTimeoutMs: 10000,
      requestTimeoutMs: 30000,
    },
  ])
}

export const createBackendServer = (providedEnvironment?: BackendEnvironment): Server => {
  const environment = validateBackendEnvironment(providedEnvironment ?? getBackendEnvironment())
  const augmentedServers = appendBuiltinConfiguration(environment.mcpServers, environment)
  const configured = loadServerConfigurations(augmentedServers, {
    allowedCommands: [...environment.allowedCommands, process.execPath],
    allowedHosts: environment.allowedMcpHosts,
    environment: environment.environment,
    envValues: process.env,
  })
  const servers: MCPServer[] = configured.map((config) => ({
    id: config.id,
    name: config.name,
    description: config.description,
    transport: config.transport,
    capabilities: [...config.capabilities],
    enabled: config.enabled,
    ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
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
    if (!response.headersSent) {
      if (status === 401) response.setHeader('WWW-Authenticate', 'Bearer')
      sendError(response, status, code, message)
    } else response.destroy()
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
      const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname
      const publicPath = requestPath === '/' || requestPath === '/health' || requestPath === '/api' || requestPath === '/api/' || requestPath === '/api/health'
      if (!publicPath) validateApiAuthentication(request, environment)
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
  server.requestTimeout = Math.max(125_000, ...configured.map((item) => item.requestTimeoutMs ?? 30_000))
  server.keepAliveTimeout = 5_000
  server.on('close', () => { void gateway.close() })
  ;(server as Server & { __mcplGateway?: MCPGatewayService }).__mcplGateway = gateway
  ;(server as Server & { __mcplEnvironment?: BackendEnvironment }).__mcplEnvironment = environment
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const environment = validateBackendEnvironment(getBackendEnvironment())
  const server = createBackendServer(environment)
  server.listen(environment.port, environment.host, () => {
    console.info(`[mcpl-tools-api] listening on http://${environment.host}:${environment.port}`)
    console.info('[mcpl-tools-api] supported MCP transports:', 'stdio, streamable HTTP')
    void (server as Server & { __mcplGateway?: MCPGatewayService }).__mcplGateway?.initializeEnabledServers()
  })
  const shutdown = () => server.close()
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
