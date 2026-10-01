import { ROUTE_PATHS } from '../app/config/constants'

export const routeConfig = [
  { path: ROUTE_PATHS.dashboard, label: 'Dashboard' },
  { path: ROUTE_PATHS.servers, label: 'Servers' },
  { path: ROUTE_PATHS.tools, label: 'Tools' },
  { path: ROUTE_PATHS.resources, label: 'Resources' },
  { path: ROUTE_PATHS.prompts, label: 'Prompts' },
  { path: ROUTE_PATHS.executions, label: 'Executions' },
  { path: ROUTE_PATHS.logs, label: 'Logs' },
  { path: ROUTE_PATHS.integrations, label: 'Integrations' },
  { path: ROUTE_PATHS.settings, label: 'Settings' },
] as const
