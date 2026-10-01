export type BackendEnvironment = {
  host: string
  port: number
  allowedOrigins: string[]
  mcpServers: string
  allowedCommands: string[]
  allowedMcpHosts: string[]
  environment: string
  apiAccessToken?: string
  enableBuiltinTools: boolean
}

const parsePort = (value: string | undefined): number => {
  if (!value) return 8787
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.')
  return port
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback
  return value.trim().toLowerCase() === 'true'
}

export const getBackendEnvironment = (env: NodeJS.ProcessEnv = process.env): BackendEnvironment => ({
  host: env.HOST?.trim() || (env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  port: parsePort(env.PORT),
  allowedOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  mcpServers: env.MCP_SERVERS_JSON ?? '[]',
  allowedCommands: (env.MCP_ALLOWED_COMMANDS ?? '').split(',').map((entry) => entry.trim()).filter(Boolean),
  allowedMcpHosts: (env.MCP_ALLOWED_HOSTS ?? '').split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean),
  environment: env.NODE_ENV ?? 'development',
  apiAccessToken: env.API_ACCESS_TOKEN?.trim() || undefined,
  enableBuiltinTools: parseBoolean(env.MCP_BUILTIN_TOOLS, true),
})

export const validateBackendEnvironment = (environment: BackendEnvironment): BackendEnvironment => {
  if (environment.environment === 'production') {
    if (!environment.allowedOrigins.length) throw new Error('CORS_ORIGINS must be configured explicitly in production.')
    if (!environment.apiAccessToken || environment.apiAccessToken.length < 32) {
      throw new Error('API_ACCESS_TOKEN must be configured with at least 32 characters in production.')
    }
  }
  return environment
}
