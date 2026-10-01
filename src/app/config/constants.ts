export const ROUTE_PATHS = {
  home: '/',
  dashboard: '/dashboard',
  servers: '/servers',
  serverDetail: '/servers/:serverId',
  tools: '/tools',
  toolDetail: '/tools/:toolId',
  toolExecute: '/tools/:toolId/execute',
  executionConsole: '/execute',
  resources: '/resources',
  resourceDetail: '/resources/:resourceId',
  prompts: '/prompts',
  promptDetail: '/prompts/:promptId',
  executions: '/executions',
  executionDetail: '/executions/:executionId',
  logs: '/logs',
  integrations: '/integrations',
  settings: '/settings',
  settingsGeneral: '/settings/general',
  settingsSecurity: '/settings/security',
  settingsAppearance: '/settings/appearance',
} as const

export const STORAGE_KEYS = {
  theme: 'mcpl-tools.theme',
  appSettings: 'mcpl-tools.settings',
  recentExecutions: 'mcpl-tools.recent-executions',
} as const
