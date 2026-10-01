export type BackendEnvironment = {
  host: string
  port: number
  allowedOrigins: string[]
  mcpServers: string
  allowedCommands: string[]
  allowedMcpHosts: string[]
  environment: string
}

const parsePort = (value: string | undefined): number => {
  if (!value) return 8787
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.')
  return port
}

export const getBackendEnvironment = (env: NodeJS.ProcessEnv = process.env): BackendEnvironment => ({
  host: env.HOST?.trim() || '127.0.0.1',
  port: parsePort(env.PORT),
  allowedOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mcpServers: env.MCP_SERVERS_JSON ?? '[]',
  allowedCommands: (env.MCP_ALLOWED_COMMANDS ?? '').split(',').map((entry) => entry.trim()).filter(Boolean),
  allowedMcpHosts: (env.MCP_ALLOWED_HOSTS ?? '').split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean),
  environment: env.NODE_ENV ?? 'development',
})

export const validateBackendEnvironment = (environment: BackendEnvironment, env: NodeJS.ProcessEnv = process.env) => {
  if (environment.environment === 'production' && !env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS must be configured explicitly in production.')
  }
  return environment
}