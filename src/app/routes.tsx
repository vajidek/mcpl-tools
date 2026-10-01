import { Navigate } from 'react-router-dom'
import { ROUTE_PATHS } from './config/constants'

export const appRoutes = [
  { path: ROUTE_PATHS.home, element: <Navigate to={ROUTE_PATHS.dashboard} replace /> },
  { path: ROUTE_PATHS.dashboard, element: 'Dashboard' },
  { path: ROUTE_PATHS.servers, element: 'Servers' },
  { path: ROUTE_PATHS.tools, element: 'Tools' },
  { path: ROUTE_PATHS.resources, element: 'Resources' },
  { path: ROUTE_PATHS.prompts, element: 'Prompts' },
  { path: ROUTE_PATHS.executions, element: 'Executions' },
  { path: ROUTE_PATHS.logs, element: 'Logs' },
  { path: ROUTE_PATHS.integrations, element: 'Integrations' },
  { path: ROUTE_PATHS.settings, element: 'Settings' },
]
