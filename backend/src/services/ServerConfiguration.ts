import type { MCPTransportType } from '../../../src/mcp/types/mcp.types.js'
import { isAbsolute, resolve } from 'node:path'
import { BackendError } from '../errors/BackendError.js'
import type { MCPServerConfiguration } from '../types/contracts.js'

const allowedTransports = new Set<MCPTransportType>(['stdio', 'http'])
const allowedFields = new Set(['id', 'name', 'description', 'transport', 'capabilities', 'enabled', 'baseUrl', 'command', 'args', 'env', 'connectionTimeoutMs', 'requestTimeoutMs'])
const serverIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/
const envReferencePattern = /^\$\{([A-Z_][A-Z0-9_]*)\}$/

export type ServerConfigurationValidationOptions = {
  allowedCommands: string[]
  allowedHosts: string[]
  environment: string
  envValues?: NodeJS.ProcessEnv
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateEndpoint = (transport: MCPTransportType, value: unknown): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 2048) throw new Error('baseUrl must be a URL under 2048 characters.')
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('baseUrl must be an absolute URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`baseUrl protocol is not compatible with ${transport}.`)
  if (url.username || url.password || url.search || url.hash) throw new Error('baseUrl must not contain credentials, query parameters, or fragments.')
  if (transport === 'stdio' || !['http', 'https'].includes(url.protocol.slice(0, -1))) {
    throw new Error(`baseUrl is not supported for ${transport}.`)
  }
  return url.toString().replace(/\/$/, '')
}

const isAllowedCommand = (command: string, allowedCommands: string[]) => {
  if (!isAbsolute(command)) return false
  const normalized = resolve(command)
  return allowedCommands.some((allowed) => isAbsolute(allowed) && resolve(allowed) === normalized)
}

const validateArguments = (value: unknown, serverId: string): string[] => {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 64 || value.some((argument) => typeof argument !== 'string' || argument.length > 2048 || argument.includes('\0'))) {
    throw new Error(`Server ${serverId} has invalid stdio arguments.`)
  }
  return [...value] as string[]
}

const validateEnvironmentReferences = (value: unknown, serverId: string, envValues: NodeJS.ProcessEnv): Record<string, string> => {
  if (value === undefined) return {}
  if (!isRecord(value) || Object.keys(value).length > 32) throw new Error(`Server ${serverId} has invalid environment references.`)
  const references: Record<string, string> = {}
  for (const [key, rawReference] of Object.entries(value)) {
    const match = typeof rawReference === 'string' ? envReferencePattern.exec(rawReference) : null
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key) || !match) {
      throw new Error(`Server ${serverId} environment values must be references like "\u0024{VARIABLE_NAME}", not literal secrets.`)
    }
    if (envValues[match[1]] === undefined) throw new Error(`Server ${serverId} references an unset backend environment variable.`)
    references[key] = match[1]
  }
  return references
}

const validateTimeout = (value: unknown, field: string, serverId: string, fallback: number): number => {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1000 || value > 120_000) {
    throw new Error(`Server ${serverId} ${field} must be an integer from 1000 to 120000.`)
  }
  return value
}

export const validateServerConfigurations = (
  raw: string,
  options: ServerConfigurationValidationOptions = { allowedCommands: [], allowedHosts: [], environment: 'development', envValues: process.env },
): MCPServerConfiguration[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('MCP_SERVERS_JSON must contain valid JSON.')
  }
  if (!Array.isArray(parsed) || parsed.length > 100) throw new Error('MCP_SERVERS_JSON must be an array containing at most 100 servers.')

  const servers = parsed.map((item, index): MCPServerConfiguration => {
    if (!isRecord(item)) throw new Error(`Server at index ${index} must be an object.`)
    const unknownField = Object.keys(item).find((key) => !allowedFields.has(key))
    if (unknownField) throw new Error(`Unsupported server configuration field: ${unknownField}. Credentials are not accepted here.`)
    const { id, name, description, transport, capabilities, enabled, baseUrl, command, args, env, connectionTimeoutMs, requestTimeoutMs } = item
    if (typeof id !== 'string' || !serverIdPattern.test(id)) throw new Error(`Server at index ${index} has an invalid id.`)
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 120) throw new Error(`Server ${id} has an invalid name.`)
    if (typeof description !== 'string' || description.length > 500) throw new Error(`Server ${id} has an invalid description.`)
    if (typeof transport !== 'string' || !allowedTransports.has(transport as MCPTransportType)) throw new Error(`Server ${id} has an unsupported transport.`)
    if (!Array.isArray(capabilities) || capabilities.length > 20 || capabilities.some((capability) => typeof capability !== 'string' || capability.length > 80)) {
      throw new Error(`Server ${id} has invalid capabilities.`)
    }
    if (typeof enabled !== 'boolean') throw new Error(`Server ${id} must define enabled as a boolean.`)
    let sanitizedBaseUrl: string | undefined
    let sanitizedCommand: string | undefined
    let sanitizedArgs: string[] | undefined
    let envReferences: Record<string, string> | undefined
    if (transport === 'http') {
      if (typeof baseUrl !== 'string') throw new Error(`Server ${id} requires baseUrl for http transport.`)
      try {
        sanitizedBaseUrl = validateEndpoint('http', baseUrl)
        if (!sanitizedBaseUrl) throw new Error('HTTP endpoint is required.')
        const endpoint = new URL(sanitizedBaseUrl)
        const hostKey = endpoint.port ? `${endpoint.hostname.toLowerCase()}:${endpoint.port}` : endpoint.hostname.toLowerCase()
        if (!options.allowedHosts.includes(hostKey)) throw new Error('HTTP endpoint host is not in MCP_ALLOWED_HOSTS.')
        if (options.environment === 'production' && endpoint.protocol !== 'https:') throw new Error('HTTP MCP endpoints must use HTTPS in production.')
      } catch (error) {
        throw new Error(`Server ${id}: ${error instanceof Error ? error.message : 'invalid baseUrl'}`, { cause: error })
      }
    } else {
      if (typeof command !== 'string' || command.includes('\0') || !isAllowedCommand(command, options.allowedCommands)) {
        throw new Error(`Server ${id} command must be an absolute executable path in MCP_ALLOWED_COMMANDS.`)
      }
      sanitizedCommand = resolve(command)
      sanitizedArgs = validateArguments(args, id)
      envReferences = validateEnvironmentReferences(env, id, options.envValues ?? process.env)
    }
    const validatedConnectionTimeout = validateTimeout(connectionTimeoutMs, 'connectionTimeoutMs', id, 10_000)
    const validatedRequestTimeout = validateTimeout(requestTimeoutMs, 'requestTimeoutMs', id, 30_000)
    return {
      id,
      name: name.trim(),
      description,
      transport: transport as MCPTransportType,
      capabilities: [...new Set(capabilities as string[])],
      enabled,
      ...(sanitizedBaseUrl ? { baseUrl: sanitizedBaseUrl } : {}),
      ...(sanitizedCommand ? { command: sanitizedCommand } : {}),
      ...(sanitizedArgs ? { args: sanitizedArgs } : {}),
      ...(envReferences ? { env: envReferences } : {}),
      connectionTimeoutMs: validatedConnectionTimeout,
      requestTimeoutMs: validatedRequestTimeout,
    }
  })

  if (new Set(servers.map((server) => server.id)).size !== servers.length) {
    throw new BackendError(500, 'INVALID_SERVER_CONFIGURATION', 'MCP server IDs must be unique.')
  }
  return servers
}

export const loadServerConfigurations = (raw: string, options?: ServerConfigurationValidationOptions): MCPServerConfiguration[] => {
  try {
    return validateServerConfigurations(raw, options)
  } catch (error) {
    if (error instanceof BackendError) throw error
    throw new BackendError(500, 'INVALID_SERVER_CONFIGURATION', error instanceof Error ? error.message : 'Invalid server configuration.')
  }
}