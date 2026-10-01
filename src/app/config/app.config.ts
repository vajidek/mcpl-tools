export const appConfig = {
  appName: 'mcpl-tools',
  version: '0.1.0',
  defaultTheme: 'dark' as const,
  maxExecutionHistory: 100,
  defaultRoute: '/dashboard',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  mcpProvider: import.meta.env.VITE_MCP_PROVIDER === 'api' ? 'api' as const : 'demo' as const,
  environment: import.meta.env.MODE,
} as const
