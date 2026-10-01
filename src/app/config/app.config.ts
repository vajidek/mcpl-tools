const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const configuredMcpProvider = import.meta.env.VITE_MCP_PROVIDER?.trim().toLowerCase()

export const appConfig = {
  appName: 'mcpl-tools',
  version: '0.2.0',
  defaultTheme: 'dark' as const,
  maxExecutionHistory: 100,
  defaultRoute: '/dashboard',
  apiBaseUrl: configuredApiBaseUrl,
  mcpProvider: configuredMcpProvider === 'api' && configuredApiBaseUrl !== '/api' ? 'api' as const : 'demo' as const,
  environment: import.meta.env.MODE,
} as const