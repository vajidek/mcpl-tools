import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { ExecutionsPage } from '../features/execution/pages/ExecutionsPage'
import { ExecutionDetailPage } from '../features/execution/pages/ExecutionDetailPage'
import { ExecutionConsolePage } from '../features/execution/pages/ExecutionConsolePage'
import { IntegrationsPage } from '../features/integrations/pages/IntegrationsPage'
import { LogsPage } from '../features/logs/pages/LogsPage'
import { PromptDetailPage } from '../features/prompts/pages/PromptDetailPage'
import { PromptsPage } from '../features/prompts/pages/PromptsPage'
import { ResourceDetailPage } from '../features/resources/pages/ResourceDetailPage'
import { ResourcesPage } from '../features/resources/pages/ResourcesPage'
import { ServerDetailPage } from '../features/servers/pages/ServerDetailPage'
import { ServersPage } from '../features/servers/pages/ServersPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { ToolDetailPage } from '../features/tools/pages/ToolDetailPage'
import { ToolExecutionPage } from '../features/tools/pages/ToolExecutionPage'
import { ToolsPage } from '../features/tools/pages/ToolsPage'
import { UtilityToolPage } from '../features/tools/pages/UtilityToolPage'
import { MTOGeneratorPage } from '../features/mto/pages/MTOGeneratorPage'
import { NotFound } from '../pages/NotFound'
import { ROUTE_PATHS } from '../app/config/constants'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTE_PATHS.dashboard} replace />} />
      <Route path={ROUTE_PATHS.dashboard} element={<DashboardPage />} />
      <Route path={ROUTE_PATHS.servers} element={<ServersPage />} />
      <Route path={ROUTE_PATHS.serverDetail} element={<ServerDetailPage />} />
      <Route path={ROUTE_PATHS.tools} element={<ToolsPage />} />
      <Route path={ROUTE_PATHS.mtoGenerator} element={<MTOGeneratorPage />} />
      <Route path={ROUTE_PATHS.utilityTool} element={<UtilityToolPage />} />
      <Route path={ROUTE_PATHS.toolDetail} element={<ToolDetailPage />} />
      <Route path={ROUTE_PATHS.toolExecute} element={<ToolExecutionPage />} />
      <Route path={ROUTE_PATHS.executionConsole} element={<ExecutionConsolePage />} />
      <Route path={ROUTE_PATHS.resources} element={<ResourcesPage />} />
      <Route path={ROUTE_PATHS.resourceDetail} element={<ResourceDetailPage />} />
      <Route path={ROUTE_PATHS.prompts} element={<PromptsPage />} />
      <Route path={ROUTE_PATHS.promptDetail} element={<PromptDetailPage />} />
      <Route path={ROUTE_PATHS.executions} element={<ExecutionsPage />} />
      <Route path={ROUTE_PATHS.executionDetail} element={<ExecutionDetailPage />} />
      <Route path={ROUTE_PATHS.logs} element={<LogsPage />} />
      <Route path={ROUTE_PATHS.integrations} element={<IntegrationsPage />} />
      <Route path={ROUTE_PATHS.settings} element={<SettingsPage />} />
      <Route path={ROUTE_PATHS.settingsGeneral} element={<SettingsPage />} />
      <Route path={ROUTE_PATHS.settingsConnection} element={<SettingsPage />} />
      <Route path={ROUTE_PATHS.settingsSecurity} element={<SettingsPage />} />
      <Route path={ROUTE_PATHS.settingsAppearance} element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
