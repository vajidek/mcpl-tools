import type { IncomingMessage, ServerResponse } from 'node:http'
import { BackendError } from '../errors/BackendError.js'
import type { ExecutionRepository, LogRepository, ServerRepository } from '../services/InMemoryRepositories.js'
import type { BackendEnvironment } from '../config/environment.js'
import type { ExecutionSubmission, HealthStatus, MCPExecutionRequest, MCPGateway, MCPServer } from '../types/contracts.js'
import { decodePathPart, parseObjectBody, readJsonBody, sendSuccess } from '../utils/http.js'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requireString = (value: unknown, field: string, maximum = 200): string => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum) {
    throw new BackendError(400, 'INVALID_REQUEST', `${field} must be a non-empty string of at most ${maximum} characters.`)
  }
  return value.trim()
}

const validateValue = (value: unknown, depth = 0): void => {
  if (depth > 16) throw new BackendError(400, 'INPUT_TOO_DEEP', 'Input nesting exceeds the allowed depth.')
  if (typeof value === 'string' && value.length > 100_000) throw new BackendError(400, 'INPUT_VALUE_TOO_LARGE', 'An input string exceeds the allowed size.')
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new BackendError(400, 'INPUT_TOO_LARGE', 'An input array exceeds the allowed size.')
    value.forEach((item) => validateValue(item, depth + 1))
    return
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length > 500) throw new BackendError(400, 'INPUT_TOO_LARGE', 'An input object has too many properties.')
    for (const [key, child] of entries) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new BackendError(400, 'UNSAFE_INPUT_KEY', 'Input contains a forbidden property name.')
      validateValue(child, depth + 1)
    }
  }
}

const validateExecutionSubmission = (body: unknown, kind: 'tool' | 'prompt', id: string): ExecutionSubmission => {
  const input = parseObjectBody(body)
  const requestId = requireString(input.id, 'id', 128)
  const createdAt = requireString(input.createdAt, 'createdAt', 64)
  if (!Number.isFinite(Date.parse(createdAt))) throw new BackendError(400, 'INVALID_TIMESTAMP', 'createdAt must be a valid timestamp.')
  const args = parseObjectBody(input.input)
  validateValue(args)
  const request: MCPExecutionRequest = {
    id: requestId,
    createdAt,
    kind,
    input: args,
    ...(kind === 'tool' ? { toolId: id, serverId: requireString(input.serverId, 'serverId', 64) } : { promptId: id }),
  }
  if (kind === 'tool' && input.toolId !== undefined && input.toolId !== id) {
    throw new BackendError(400, 'RESOURCE_ID_MISMATCH', 'The tool ID in the body does not match the request path.')
  }
  if (kind === 'prompt' && input.promptId !== undefined && input.promptId !== id) {
    throw new BackendError(400, 'RESOURCE_ID_MISMATCH', 'The prompt ID in the body does not match the request path.')
  }
  return request as ExecutionSubmission
}

export class ApiController {
  constructor(
    private readonly environment: BackendEnvironment,
    private readonly servers: ServerRepository,
    private readonly executions: ExecutionRepository,
    private readonly logs: LogRepository,
    private readonly gateway: MCPGateway,
    private readonly startedAt = Date.now(),
  ) {}

  async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const method = request.method ?? 'GET'
    const rawUrl = request.url ?? '/'
    const url = new URL(rawUrl, 'http://localhost')
    const path = url.pathname === '/health' ? '/health' : url.pathname.replace(/^\/api(?=\/|$)/, '')
    const parts = path.split('/').filter(Boolean).map(decodePathPart)

    if (method === 'GET' && (path === '/health' || path === '/')) {
      const health: HealthStatus = {
        status: 'ok',
        service: 'mcpl-tools-api',
        environment: this.environment.environment,
        mcp: {
          configuredServers: this.servers.listServers().length,
          transportConfigured: this.gateway.supportedTransports.length > 0,
          supportedTransports: this.gateway.supportedTransports,
        },
        uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      }
      sendSuccess(response, health)
      return
    }

    if (parts[0] === 'servers') return this.handleServers(method, parts.slice(1), response)
    if (parts[0] === 'tools') return this.handleTools(method, parts.slice(1), url, request, response)
    if (parts[0] === 'resources') return this.handleResources(method, parts.slice(1), url, request, response)
    if (parts[0] === 'prompts') return this.handlePrompts(method, parts.slice(1), url, request, response)
    if (parts[0] === 'executions') return this.handleExecutions(method, parts.slice(1), response)
    if (parts[0] === 'logs') return this.handleLogs(method, url, response)
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private requireServer(serverId: string): MCPServer {
    const server = this.servers.getServer(serverId)
    if (!server) throw new BackendError(404, 'SERVER_NOT_FOUND', 'The requested server was not found.')
    return server
  }

  private async handleServers(method: string, parts: string[], response: ServerResponse): Promise<void> {
    if (method === 'GET' && parts.length === 0) return sendSuccess(response, this.servers.listServers())
    if (parts.length < 1) throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
    const serverId = parts[0]
    const server = this.requireServer(serverId)
    if (method === 'GET' && parts.length === 1) return sendSuccess(response, server)
    if (method === 'GET' && parts[1] === 'status' && parts.length === 2) {
      return sendSuccess(response, { id: server.id, enabled: server.enabled, connectionStatus: server.connectionStatus })
    }
    if (method === 'POST' && parts.length === 2) {
      if (parts[1] === 'connect') return sendSuccess(response, await this.gateway.connect(server))
      if (parts[1] === 'disconnect') {
        return sendSuccess(response, await this.gateway.disconnect(serverId))
      }
      if (parts[1] === 'test') return sendSuccess(response, await this.gateway.testConnection(serverId))
    }
    if (method === 'GET' && parts.length === 2 && ['tools', 'resources', 'prompts'].includes(parts[1])) {
      if (parts[1] === 'tools') return sendSuccess(response, await this.gateway.listTools(serverId))
      if (parts[1] === 'resources') return sendSuccess(response, await this.gateway.listResources(serverId))
      return sendSuccess(response, await this.gateway.listPrompts(serverId))
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private async handleTools(method: string, parts: string[], url: URL, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (method === 'GET' && parts.length === 0) {
      const serverId = url.searchParams.get('serverId')
      if (serverId) return sendSuccess(response, await this.gateway.listTools(this.requireServer(serverId).id))
      const results = await Promise.all(this.servers.listServers().filter((server) => server.connectionStatus === 'ready').map((server) => this.gateway.listTools(server.id)))
      return sendSuccess(response, results.flat())
    }
    const toolId = parts[0]
    if (!toolId) throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
    if (method === 'POST' && parts[1] === 'execute' && parts.length === 2) {
      const body = validateExecutionSubmission(await readJsonBody(request), 'tool', toolId)
      const serverId = body.serverId
      if (!serverId) throw new BackendError(400, 'INVALID_REQUEST', 'serverId is required for tool execution.')
      this.requireServer(serverId)
      const result = await this.gateway.callTool(body)
      this.executions.addExecution(result)
      this.logs.addLog('INFO', 'MCP tool execution completed', { operation: 'tool.execute', executionId: result.id, serverId, toolId })
      return sendSuccess(response, result)
    }
    if (method === 'GET' && parts.length === 1) {
      const tools = await Promise.all(this.servers.listServers().filter((server) => server.connectionStatus === 'ready').map((server) => this.gateway.listTools(server.id)))
      const tool = tools.flat().find((item) => item.id === toolId)
      if (!tool) throw new BackendError(404, 'TOOL_NOT_FOUND', 'The requested tool was not found.')
      return sendSuccess(response, tool)
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private async handleResources(method: string, parts: string[], url: URL, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (method === 'GET' && parts.length === 0) {
      const serverId = url.searchParams.get('serverId')
      const servers = serverId ? [this.requireServer(serverId)] : this.servers.listServers().filter((server) => server.connectionStatus === 'ready')
      const results = await Promise.all(servers.map((server) => this.gateway.listResources(server.id)))
      return sendSuccess(response, results.flat())
    }
    const resourceId = parts[0]
    if (!resourceId) throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
    if (method === 'POST' && parts[1] === 'read' && parts.length === 2) {
      parseObjectBody(await readJsonBody(request))
      return sendSuccess(response, await this.gateway.readResource(resourceId))
    }
    if (method === 'GET' && parts.length === 1) {
      const resources = await Promise.all(this.servers.listServers().filter((server) => server.connectionStatus === 'ready').map((server) => this.gateway.listResources(server.id)))
      const resource = resources.flat().find((item) => item.id === resourceId)
      if (!resource) throw new BackendError(404, 'RESOURCE_NOT_FOUND', 'The requested resource was not found.')
      return sendSuccess(response, resource)
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private async handlePrompts(method: string, parts: string[], url: URL, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (method === 'GET' && parts.length === 0) {
      const serverId = url.searchParams.get('serverId')
      const servers = serverId ? [this.requireServer(serverId)] : this.servers.listServers().filter((server) => server.connectionStatus === 'ready')
      const results = await Promise.all(servers.map((server) => this.gateway.listPrompts(server.id)))
      return sendSuccess(response, results.flat())
    }
    const promptId = parts[0]
    if (!promptId) throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
    if (method === 'POST' && parts[1] === 'execute' && parts.length === 2) {
      const body = validateExecutionSubmission(await readJsonBody(request), 'prompt', promptId)
      const result = await this.gateway.executePrompt(body)
      this.executions.addExecution(result)
      this.logs.addLog('INFO', 'MCP prompt execution completed', { operation: 'prompt.execute', executionId: result.id })
      return sendSuccess(response, result)
    }
    if (method === 'GET' && parts.length === 1) {
      const prompts = await Promise.all(this.servers.listServers().filter((server) => server.connectionStatus === 'ready').map((server) => this.gateway.listPrompts(server.id)))
      const prompt = prompts.flat().find((item) => item.id === promptId)
      if (!prompt) throw new BackendError(404, 'PROMPT_NOT_FOUND', 'The requested prompt was not found.')
      return sendSuccess(response, prompt)
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private handleExecutions(method: string, parts: string[], response: ServerResponse): void {
    if (method === 'GET' && parts.length === 0) return sendSuccess(response, this.executions.listExecutions())
    if (method === 'DELETE' && parts.length === 0) {
      this.executions.clearExecutions()
      return sendSuccess(response, { cleared: true })
    }
    if (method === 'GET' && parts[0]) {
      const execution = this.executions.getExecution(parts[0])
      if (!execution) throw new BackendError(404, 'EXECUTION_NOT_FOUND', 'The requested execution was not found.')
      return sendSuccess(response, execution)
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }

  private handleLogs(method: string, url: URL, response: ServerResponse): void {
    if (method === 'GET') {
      const level = url.searchParams.get('level') ?? undefined
      if (level && !['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level.toUpperCase())) {
        throw new BackendError(400, 'INVALID_LOG_LEVEL', 'level must be DEBUG, INFO, WARN, ERROR, or ALL.')
      }
      return sendSuccess(response, this.logs.listLogs(level, url.searchParams.get('search') ?? undefined, url.searchParams.get('source') ?? undefined))
    }
    if (method === 'DELETE') {
      this.logs.clearLogs()
      return sendSuccess(response, { cleared: true })
    }
    throw new BackendError(404, 'NOT_FOUND', 'The requested endpoint was not found.')
  }
}