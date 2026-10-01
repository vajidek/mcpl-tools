import { lookup as lookupDns } from 'node:dns/promises'
import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { FetchLike, Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js'
import { Agent } from 'undici'
import type { MCPConnectionStatus, MCPExecutionResult, MCPPrompt, MCPResource, MCPResourceContent, MCPServer, MCPTool, MCPToolInputSchema } from '../../../src/mcp/types/mcp.types.js'
import { BackendError } from '../errors/BackendError.js'
import type { BackendEnvironment } from '../config/environment.js'
import type { ExecutionSubmission, MCPGateway } from '../types/contracts.js'
import type { LogRepository, ServerRepository } from '../services/InMemoryRepositories.js'
import type { MCPServerConfiguration } from '../types/contracts.js'

type ProtocolTransport = StdioClientTransport | StreamableHTTPClientTransport

type GatewaySession = {
  server: MCPServer
  config: MCPServerConfiguration
  client: Client
  transport: ProtocolTransport
  httpDispatcher?: Agent
  capabilities: ServerCapabilities
  tools: Map<string, { model: MCPTool; protocolName: string; schema: MCPToolInputSchema }>
  resources: Map<string, { model: MCPResource; uri: string }>
  prompts: Map<string, { model: MCPPrompt; protocolName: string }>
  closing: boolean
}

const safeMessage = (operation: string, error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('timeout') || message.includes('timed out') || message.includes('abort')) return `MCP ${operation} timed out.`
  return `MCP ${operation} failed. Check backend diagnostics for the server-side error.`
}

const getStableId = (serverId: string, kind: string, remoteId: string) => {
  const digest = createHash('sha256').update(remoteId).digest('hex').slice(0, 24)
  return `${serverId}:${kind}:${digest}`
}

const isLoopback = (address: string) => address === '::1' || address.startsWith('127.')

const isPrivateAddress = (address: string): boolean => {
  const normalized = address.toLowerCase().split('%')[0]
  const ipVersion = isIP(normalized)
  if (ipVersion === 4) {
    const octets = normalized.split('.').map(Number)
    const [first, second] = octets
    return first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19))
  }
  if (ipVersion === 6) {
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice('::ffff:'.length)
      return isIP(mapped) === 4 ? isPrivateAddress(mapped) : true
    }
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
      normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('2001:db8:')
  }
  return true
}

const validateToolInput = (value: Record<string, unknown>, schema: MCPToolInputSchema) => {
  const errors: string[] = []
  for (const key of schema.required ?? []) {
    if (!(key in value) || value[key] === undefined || value[key] === null || value[key] === '') errors.push(`Missing required field: ${key}`)
  }
  const properties = schema.properties ?? {}
  for (const [key, field] of Object.entries(properties)) {
    if (!(key in value) || typeof field !== 'object' || field === null) continue
    const definition = field as { type?: unknown; enum?: unknown }
    const actual = value[key]
    const expected = definition.type
    const valid = expected === 'string' ? typeof actual === 'string'
      : expected === 'number' ? typeof actual === 'number' && Number.isFinite(actual)
        : expected === 'integer' ? typeof actual === 'number' && Number.isInteger(actual)
          : expected === 'boolean' ? typeof actual === 'boolean'
            : expected === 'object' ? typeof actual === 'object' && actual !== null && !Array.isArray(actual)
              : expected === 'array' ? Array.isArray(actual)
                : true
    if (!valid) errors.push(`Field ${key} must be ${String(expected)}.`)
    if (Array.isArray(definition.enum) && !definition.enum.some((item) => item === actual)) errors.push(`Field ${key} has an unsupported value.`)
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) if (!(key in properties)) errors.push(`Unexpected field: ${key}`)
  }
  return errors
}

export class MCPGatewayService implements MCPGateway {
  readonly supportedTransports: Array<'stdio' | 'http'> = ['stdio', 'http']
  private readonly sessions = new Map<string, GatewaySession>()
  private readonly pendingConnections = new Map<string, Promise<MCPServer>>()

  constructor(
    private readonly configurations: MCPServerConfiguration[],
    private readonly servers: ServerRepository,
    private readonly logs: LogRepository,
    private readonly environment: BackendEnvironment,
  ) {}

  async connect(server: MCPServer): Promise<MCPServer> {
    const pending = this.pendingConnections.get(server.id)
    if (pending) return pending
    const attempt = this.openSession(server)
    this.pendingConnections.set(server.id, attempt)
    try {
      return await attempt
    } finally {
      this.pendingConnections.delete(server.id)
    }
  }

  private async openSession(server: MCPServer): Promise<MCPServer> {
    const config = this.getConfig(server.id)
    if (!server.enabled || !config.enabled) throw new BackendError(409, 'SERVER_DISABLED', 'The MCP server is disabled.')
    await this.disconnect(server.id)
    this.servers.setConnectionStatus(server.id, 'connecting')
    this.logs.addLog('INFO', 'MCP connection attempt started', { operation: 'mcp.connect', serverId: server.id })

    let transport: ProtocolTransport | undefined
    let client: Client | undefined
    let httpDispatcher: Agent | undefined
    try {
      const createdTransport = this.createTransport(config)
      transport = createdTransport.transport
      httpDispatcher = createdTransport.httpDispatcher
      if (transport instanceof StdioClientTransport) transport.stderr?.on('data', () => undefined)
      client = new Client({ name: 'mcpl-tools-gateway', version: '0.1.0' }, { capabilities: {}, enforceStrictCapabilities: true })
      this.servers.setConnectionStatus(server.id, 'initializing')
      this.logs.addLog('INFO', 'MCP initialization started', { operation: 'mcp.initialize', serverId: server.id })
      let connectionTimer: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          client.connect(transport, { timeout: config.connectionTimeoutMs }),
          new Promise<never>((_, reject) => {
            connectionTimer = setTimeout(() => reject(new BackendError(504, 'MCP_CONNECTION_TIMEOUT', 'MCP connection and initialization timed out.')), config.connectionTimeoutMs)
          }),
        ])
      } finally {
        if (connectionTimer) clearTimeout(connectionTimer)
      }

      const session: GatewaySession = {
        server,
        config,
        client,
        transport,
        ...(httpDispatcher ? { httpDispatcher } : {}),
        capabilities: client.getServerCapabilities() ?? {},
        tools: new Map(),
        resources: new Map(),
        prompts: new Map(),
        closing: false,
      }
      this.sessions.set(server.id, session)
      this.servers.setConnectionStatus(server.id, 'connected')
      this.attachTransportHandlers(session)

      await this.discoverCapabilities(session)
      const serverVersion = client.getServerVersion()
      const metadata = {
        mcpServerName: serverVersion?.name ?? 'unknown',
        mcpServerVersion: serverVersion?.version ?? 'unknown',
        mcpCapabilities: Object.keys(session.capabilities),
      }
      const negotiatedCapabilities = Object.keys(session.capabilities).filter((capability) => session.capabilities[capability as keyof ServerCapabilities] !== undefined)
      this.servers.setConnectionStatus(server.id, 'ready', metadata, negotiatedCapabilities)
      this.logs.addLog('INFO', 'MCP connection ready after initialization and capability discovery', { operation: 'mcp.ready', serverId: server.id })
      return this.servers.getServer(server.id) ?? { ...server, connectionStatus: 'ready', metadata }
    } catch (error) {
      this.sessions.delete(server.id)
      await this.closeClientAndTransport(client, transport)
      await httpDispatcher?.close().catch(() => undefined)
      this.servers.setConnectionStatus(server.id, 'error')
      this.logs.addLog('ERROR', 'MCP connection or initialization failed', { operation: 'mcp.connect', serverId: server.id })
      if (error instanceof BackendError) throw error
      throw new BackendError(502, 'MCP_CONNECTION_FAILED', safeMessage('connection', error), undefined, { cause: error })
    }
  }

  private createTransport(config: MCPServerConfiguration): { transport: ProtocolTransport; httpDispatcher?: Agent } {
    if (config.transport === 'stdio') {
      const command = config.command
      if (!command) throw new BackendError(500, 'STDIO_COMMAND_MISSING', 'The configured stdio executable is missing.')
      const environment: Record<string, string> = {}
      for (const [key, envReference] of Object.entries(config.env ?? {})) {
        const value = process.env[envReference]
        if (value === undefined) throw new BackendError(500, 'STDIO_ENVIRONMENT_MISSING', 'A configured backend environment reference is unset.')
        environment[key] = value
      }
      return { transport: new StdioClientTransport({ command, args: config.args, env: environment, stderr: 'pipe', maxBufferSize: 1024 * 1024 }) }
    }
    if (config.transport === 'http' && config.baseUrl) {
      const base = new URL(config.baseUrl)
      const httpDispatcher = this.createPinnedDispatcher(config, base)
      return { transport: new StreamableHTTPClientTransport(base, { fetch: this.createSafeFetch(config, httpDispatcher) }), httpDispatcher }
    }
    throw new BackendError(400, 'UNSUPPORTED_MCP_TRANSPORT', 'Only configured stdio and MCP Streamable HTTP transports are supported.')
  }

  private createPinnedDispatcher(config: MCPServerConfiguration, base: URL): Agent {
    const allowedAuthority = base.host.toLowerCase()
    const pinnedLookup = (
      hostname: string,
      options: { all?: boolean },
      callback: (error: NodeJS.ErrnoException | null, address: string | Array<{ address: string; family: number }>, family?: number) => void,
    ) => {
      if (hostname.toLowerCase() !== base.hostname.toLowerCase()) {
        callback(Object.assign(new Error('MCP DNS lookup host mismatch.'), { code: 'EACCES' }), '', 0)
        return
      }
      void lookupDns(hostname, { all: true, verbatim: true }).then((addresses) => {
        const allowLoopback = this.environment.environment === 'development' && this.environment.allowedMcpHosts.includes(allowedAuthority)
        if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address) && !(allowLoopback && isLoopback(address)))) {
          callback(Object.assign(new Error('MCP hostname resolved to an address denied by outbound policy.'), { code: 'EACCES' }), '', 0)
          return
        }
        if (options.all) callback(null, addresses)
        else {
          const selected = addresses[0]
          callback(null, selected.address, selected.family)
        }
      }).catch((error: unknown) => {
        callback(Object.assign(new Error('MCP hostname resolution failed.'), { code: 'ENOTFOUND', cause: error }), '', 0)
      })
    }
    return new Agent({ connect: { lookup: pinnedLookup } })
  }

  private createSafeFetch(config: MCPServerConfiguration, dispatcher: Agent): FetchLike {
    const base = new URL(config.baseUrl!)
    return async (input, init) => {
      const target = new URL(input instanceof URL ? input.href : input)
      if (target.origin !== base.origin) throw new BackendError(403, 'MCP_OUTBOUND_ORIGIN_DENIED', 'The MCP transport attempted to contact an unapproved origin.')
      await this.validateResolvedAddress(target)
      const method = (init?.method ?? 'GET').toUpperCase()
      const requestTimeout = config.requestTimeoutMs ?? 30_000
      const timeout = method === 'GET' ? undefined : AbortSignal.timeout(requestTimeout)
      const signal = timeout && init?.signal ? AbortSignal.any([timeout, init.signal]) : timeout ?? init?.signal
      const requestInit = {
        ...init,
        signal,
        credentials: 'omit',
        redirect: 'error',
        dispatcher,
        headers: { ...Object.fromEntries(new Headers(init?.headers).entries()) },
      } as RequestInit & { dispatcher: Agent }
      return fetch(target, requestInit)
    }
  }

  private async validateResolvedAddress(target: URL): Promise<void> {
    const authority = target.host.toLowerCase()
    if (!this.environment.allowedMcpHosts.includes(authority)) {
      throw new BackendError(403, 'MCP_HOST_NOT_ALLOWED', 'The MCP endpoint host is not allowlisted.')
    }
    const hostname = target.hostname.replace(/^\[|\]$/g, '')
    let addresses: Array<{ address: string; family: number }>
    try {
      addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookupDns(hostname, { all: true, verbatim: true })
    } catch (error) {
      throw new BackendError(502, 'MCP_DNS_FAILED', 'The MCP endpoint hostname could not be resolved.', undefined, { cause: error })
    }
    if (addresses.length === 0) throw new BackendError(502, 'MCP_DNS_FAILED', 'The MCP endpoint hostname has no resolved addresses.')
    const allowDevelopmentLoopback = this.environment.environment === 'development' && this.environment.allowedMcpHosts.includes(authority)
    if (addresses.some(({ address }) => isPrivateAddress(address) && !(allowDevelopmentLoopback && isLoopback(address)))) {
      throw new BackendError(403, 'MCP_PRIVATE_ADDRESS_DENIED', 'The MCP endpoint resolves to a private or reserved network address.')
    }
  }

  private attachTransportHandlers(session: GatewaySession) {
    session.transport.onerror = () => {
      if (session.closing) return
      this.logs.addLog('ERROR', 'MCP transport reported an error', { operation: 'mcp.transport', serverId: session.server.id })
      this.servers.setConnectionStatus(session.server.id, 'error')
    }
    session.transport.onclose = () => {
      if (session.closing || this.sessions.get(session.server.id) !== session) return
      this.sessions.delete(session.server.id)
      this.servers.setConnectionStatus(session.server.id, 'disconnected')
      this.logs.addLog('WARN', 'MCP transport closed unexpectedly', { operation: 'mcp.disconnect', serverId: session.server.id })
    }
    session.client.onclose = () => {
      if (session.closing || this.sessions.get(session.server.id) !== session) return
      this.sessions.delete(session.server.id)
      this.servers.setConnectionStatus(session.server.id, 'disconnected')
    }
  }

  private async discoverCapabilities(session: GatewaySession): Promise<void> {
    const { capabilities } = session
    const timeout = session.config.requestTimeoutMs
    const [tools, resources, prompts] = await Promise.all([
      capabilities.tools ? session.client.listTools(undefined, { timeout }) : Promise.resolve({ tools: [] }),
      capabilities.resources ? session.client.listResources(undefined, { timeout }) : Promise.resolve({ resources: [] }),
      capabilities.prompts ? session.client.listPrompts(undefined, { timeout }) : Promise.resolve({ prompts: [] }),
    ])

    for (const tool of tools.tools) {
      const schema: MCPToolInputSchema = {
        type: 'object',
        properties: tool.inputSchema.properties as Record<string, unknown> | undefined,
        required: tool.inputSchema.required,
      }
      const id = getStableId(session.server.id, 'tool', tool.name)
      session.tools.set(id, {
        protocolName: tool.name,
        schema,
        model: {
          id,
          serverId: session.server.id,
          name: tool.name,
          description: tool.description ?? '',
          category: 'MCP',
          inputSchema: schema,
          available: true,
          tags: [],
        },
      })
    }
    for (const resource of resources.resources) {
      const uri = new URL(resource.uri).toString()
      const id = getStableId(session.server.id, 'resource', uri)
      session.resources.set(id, {
        uri,
        model: { id, serverId: session.server.id, name: resource.name, uri, mimeType: resource.mimeType ?? 'application/octet-stream', description: resource.description },
      })
    }
    for (const prompt of prompts.prompts) {
      const id = getStableId(session.server.id, 'prompt', prompt.name)
      session.prompts.set(id, {
        protocolName: prompt.name,
        model: {
          id,
          serverId: session.server.id,
          name: prompt.name,
          description: prompt.description ?? '',
          arguments: prompt.arguments?.map((argument) => ({ name: argument.name, description: argument.description, required: argument.required })) ?? [],
        },
      })
    }
    this.logs.addLog('INFO', 'MCP capabilities discovered', { operation: 'mcp.capabilities', serverId: session.server.id })
  }

  private getConfig(serverId: string): MCPServerConfiguration {
    const config = this.configurations.find((server) => server.id === serverId)
    if (!config) throw new BackendError(404, 'SERVER_NOT_FOUND', 'The requested server configuration was not found.')
    return config
  }

  private getSession(serverId: string): GatewaySession {
    const session = this.sessions.get(serverId)
    if (!session || this.servers.getServer(serverId)?.connectionStatus !== 'ready') {
      throw new BackendError(409, 'SERVER_NOT_READY', 'Connect and initialize the MCP server before using its capabilities.')
    }
    return session
  }

  async disconnect(serverId: string): Promise<MCPServer> {
    const session = this.sessions.get(serverId)
    this.sessions.delete(serverId)
    if (session) {
      session.closing = true
      try {
        await session.client.close()
      } catch {
        await session.transport.close().catch(() => undefined)
      }
      await session.httpDispatcher?.close().catch(() => undefined)
      this.logs.addLog('INFO', 'MCP transport disconnected and cleaned up', { operation: 'mcp.disconnect', serverId })
    }
    this.servers.setConnectionStatus(serverId, 'disconnected')
    const server = this.servers.getServer(serverId)
    if (!server) throw new BackendError(404, 'SERVER_NOT_FOUND', 'The requested server was not found.')
    return server
  }

  async testConnection(serverId: string): Promise<{ success: boolean; message: string }> {
    let temporarySession = false
    try {
      let session = this.sessions.get(serverId)
      if (!session) {
        const server = this.servers.getServer(serverId)
        if (!server) throw new BackendError(404, 'SERVER_NOT_FOUND', 'The requested server was not found.')
        await this.connect(server)
        session = this.sessions.get(serverId)
        temporarySession = true
      }
      if (!session) throw new BackendError(502, 'MCP_CONNECTION_FAILED', 'MCP session was not established.')
      await session.client.ping({ timeout: session.config.requestTimeoutMs })
      this.logs.addLog('INFO', 'MCP connectivity test succeeded', { operation: 'mcp.test', serverId })
      return { success: true, message: 'MCP initialization and ping completed successfully.' }
    } catch (error) {
      this.logs.addLog('ERROR', 'MCP connectivity test failed', { operation: 'mcp.test', serverId })
      if (error instanceof BackendError) throw error
      throw new BackendError(502, 'MCP_TEST_FAILED', safeMessage('connection test', error), undefined, { cause: error })
    } finally {
      if (temporarySession) await this.disconnect(serverId).catch(() => undefined)
    }
  }

  async listTools(serverId: string): Promise<MCPTool[]> {
    const session = this.getSession(serverId)
    return [...session.tools.values()].map((entry) => entry.model)
  }

  async listResources(serverId: string): Promise<MCPResource[]> {
    const session = this.getSession(serverId)
    return [...session.resources.values()].map((entry) => entry.model)
  }

  async listPrompts(serverId: string): Promise<MCPPrompt[]> {
    const session = this.getSession(serverId)
    return [...session.prompts.values()].map((entry) => entry.model)
  }

  async callTool(request: ExecutionSubmission): Promise<MCPExecutionResult> {
    const started = Date.now()
    const startedAt = request.createdAt
    const session = this.getSession(request.serverId!)
    const tool = session.tools.get(request.toolId ?? '')
    if (!tool) throw new BackendError(404, 'TOOL_NOT_FOUND', 'The requested tool was not discovered for this server.')
    const validationErrors = validateToolInput(request.input, tool.schema)
    if (validationErrors.length) throw new BackendError(400, 'TOOL_INPUT_INVALID', validationErrors.join(' '))
    try {
      const response = await session.client.callTool({ name: tool.protocolName, arguments: request.input }, undefined, { timeout: session.config.requestTimeoutMs })
      const toolResponse = response as { content?: unknown; structuredContent?: unknown; isError?: boolean }
      const content = Array.isArray(toolResponse.content) ? toolResponse.content : []
      const isError = toolResponse.isError ?? false
      const output = { content, structuredContent: toolResponse.structuredContent, isError }
      const errorText = isError ? content.flatMap((item) => {
        if (typeof item === 'object' && item !== null && 'type' in item && item.type === 'text' && 'text' in item && typeof item.text === 'string') return [item.text]
        return []
      }).join('\n') : undefined
      const result: MCPExecutionResult = {
        id: request.id,
        requestId: request.id,
        kind: 'tool',
        toolId: tool.model.id,
        serverId: session.server.id,
        toolName: tool.protocolName,
        input: request.input,
        request,
        status: isError ? 'error' : 'success',
        output,
        ...(errorText ? { error: errorText } : {}),
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      }
      this.logs.addLog(response.isError ? 'WARN' : 'INFO', `MCP tool ${response.isError ? 'returned an error' : 'completed'}`, { operation: 'mcp.tool.execute', executionId: request.id, serverId: session.server.id, toolId: tool.model.id })
      return result
    } catch (error) {
      if (error instanceof BackendError) throw error
      this.logs.addLog('ERROR', 'MCP tool execution failed', { operation: 'mcp.tool.execute', executionId: request.id, serverId: session.server.id, toolId: tool.model.id })
      return {
        id: request.id,
        requestId: request.id,
        kind: 'tool',
        toolId: tool.model.id,
        serverId: session.server.id,
        toolName: tool.protocolName,
        input: request.input,
        request,
        status: 'error',
        error: safeMessage('tool request', error),
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      }
    }
  }

  async readResource(resourceId: string): Promise<MCPResourceContent> {
    for (const session of this.sessions.values()) {
      const resource = session.resources.get(resourceId)
      if (!resource) continue
      try {
        const result = await session.client.readResource({ uri: resource.uri }, { timeout: session.config.requestTimeoutMs })
        const texts = result.contents.flatMap((content) => 'text' in content ? [content.text] : [])
        const blobs = result.contents.flatMap((content) => 'blob' in content ? [content.blob] : [])
        this.logs.addLog('INFO', 'MCP resource read completed', { operation: 'mcp.resource.read', serverId: session.server.id })
        return {
          uri: resource.uri,
          mimeType: result.contents[0]?.mimeType ?? resource.model.mimeType,
          ...(texts.length ? { text: texts.join('\n') } : {}),
          ...(blobs.length ? { blob: blobs.join('') } : {}),
        }
      } catch (error) {
        this.logs.addLog('ERROR', 'MCP resource read failed', { operation: 'mcp.resource.read', serverId: session.server.id })
        throw new BackendError(502, 'MCP_RESOURCE_READ_FAILED', safeMessage('resource read', error), undefined, { cause: error })
      }
    }
    throw new BackendError(404, 'RESOURCE_NOT_FOUND', 'The requested resource is not available in an active MCP session.')
  }

  async executePrompt(request: ExecutionSubmission): Promise<MCPExecutionResult> {
    const started = Date.now()
    const promptId = request.promptId ?? ''
    const session = request.serverId
      ? this.getSession(request.serverId)
      : [...this.sessions.values()].find((candidate) => candidate.prompts.has(promptId) && this.servers.getServer(candidate.server.id)?.connectionStatus === 'ready')
    if (!session) throw new BackendError(409, 'SERVER_NOT_READY', 'Connect and initialize the MCP server that provides this prompt.')
    if (!session.capabilities.prompts) throw new BackendError(409, 'MCP_CAPABILITY_NOT_SUPPORTED', 'This MCP server does not advertise prompt support.')
    const prompt = session.prompts.get(promptId)
    if (!prompt) throw new BackendError(404, 'PROMPT_NOT_FOUND', 'The requested prompt was not discovered for this server.')
    const promptArguments: Record<string, string> = {}
    for (const [key, value] of Object.entries(request.input)) {
      if (typeof value !== 'string') throw new BackendError(400, 'PROMPT_ARGUMENT_INVALID', 'MCP prompt arguments must be strings.')
      promptArguments[key] = value
    }
    for (const argument of prompt.model.arguments ?? []) {
      if (argument.required && !promptArguments[argument.name]?.trim()) throw new BackendError(400, 'PROMPT_ARGUMENT_REQUIRED', `Missing required prompt argument: ${argument.name}`)
    }
    try {
      const result = await session.client.getPrompt({ name: prompt.protocolName, arguments: promptArguments }, { timeout: session.config.requestTimeoutMs })
      this.logs.addLog('INFO', 'MCP prompt retrieval completed', { operation: 'mcp.prompt.execute', executionId: request.id, serverId: session.server.id })
      return {
        id: request.id,
        requestId: request.id,
        kind: 'prompt',
        promptId: prompt.model.id,
        serverId: session.server.id,
        toolName: prompt.protocolName,
        input: request.input,
        request,
        status: 'success',
        output: { description: result.description, messages: result.messages },
        startedAt: request.createdAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      }
    } catch (error) {
      this.logs.addLog('ERROR', 'MCP prompt operation failed', { operation: 'mcp.prompt.execute', executionId: request.id, serverId: session.server.id })
      return {
        id: request.id,
        requestId: request.id,
        kind: 'prompt',
        promptId: prompt.model.id,
        serverId: session.server.id,
        toolName: prompt.protocolName,
        input: request.input,
        request,
        status: 'error',
        error: safeMessage('prompt request', error),
        startedAt: request.createdAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      }
    }
  }

  async close(): Promise<void> {
    await Promise.allSettled([...this.sessions.keys()].map((serverId) => this.disconnect(serverId)))
  }

  private async closeClientAndTransport(client?: Client, transport?: ProtocolTransport): Promise<void> {
    if (client) {
      try {
        await client.close()
        return
      } catch {
        // Fall through to transport close to ensure child processes/sessions are cleaned up.
      }
    }
    if (transport) await transport.close().catch(() => undefined)
  }
}