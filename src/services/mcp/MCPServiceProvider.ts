import type { MCPExecutionRequest, MCPExecutionResult, MCPPrompt, MCPResource, MCPResourceContent, MCPServer, MCPTool } from '../../mcp/types/mcp.types'
import { apiClient } from '../api/apiClient'
import { ApiError } from '../api/apiErrors'
import type { ApiResponse } from '../../types/api'
import type { LogEntry } from '../logging/logTypes'
import type { MCPServiceProvider } from './MCPServiceProvider.types'
import { mockMcpService } from './mockMcpService'
import { getRuntimeConnectionSettings } from './runtimeConfig'

const encode = (value: string) => encodeURIComponent(value)

const readApi = async <T>(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown): Promise<T> => {
  const response: ApiResponse<T> = await apiClient<T>(path, { method, body })
  return response.data
}

const readOptionalApi = async <T>(path: string): Promise<T | undefined> => {
  try {
    return await readApi<T>(path)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
}

const demoProvider: MCPServiceProvider = {
  mode: 'demo',
  initialServers: mockMcpService.getServers(),
  initialTools: mockMcpService.getTools(),
  initialExecutions: mockMcpService.getExecutionHistory(),
  initialPrompts: mockMcpService.getPrompts(),
  initialResources: mockMcpService.getResources(),
  health: async () => ({ status: 'ok', mode: 'demo', transportConfigured: false, message: 'Demo provider is active; no external MCP server is contacted.' }),
  listServers: async () => mockMcpService.getServers(),
  getServer: async (id) => mockMcpService.getServerById(id),
  connectServer: mockMcpService.connectServer,
  disconnectServer: mockMcpService.disconnectServer,
  testServerConnection: mockMcpService.testServerConnection,
  listTools: mockMcpService.discoverTools,
  getTool: async (id) => mockMcpService.getToolById(id),
  listResources: mockMcpService.discoverResources,
  getResource: async (id) => mockMcpService.getResourceById(id),
  readResource: mockMcpService.readResource,
  listPrompts: mockMcpService.discoverPrompts,
  getPrompt: async (id) => mockMcpService.getPromptById(id),
  executeTool: mockMcpService.executeTool,
  executePrompt: mockMcpService.executePrompt,
  listExecutions: async () => mockMcpService.getExecutionHistory(),
  getExecution: async (id) => mockMcpService.getExecutionById(id),
  clearExecutions: async () => mockMcpService.clearExecutionHistory(),
  listLogs: async (level, search, source) => mockMcpService.getLogs(level, search, source),
  clearLogs: async () => mockMcpService.clearLogs(),
  resetDemoState: async () => mockMcpService.resetDemoState(),
}

const apiProvider: MCPServiceProvider = {
  mode: 'api',
  initialServers: [],
  initialTools: [],
  initialExecutions: [],
  initialPrompts: [],
  initialResources: [],
  health: async () => {
    try {
      const health = await readApi<{ status: 'ok'; mcp: { configuredServers: number; readyServers: number; transportConfigured: boolean; supportedTransports: string[] } }>('/health')
      const transports = health.mcp.supportedTransports.join(', ')
      return {
        status: health.status,
        mode: 'api',
        transportConfigured: health.mcp.transportConfigured,
        message: health.mcp.transportConfigured ? `Backend API reachable; ${health.mcp.readyServers}/${health.mcp.configuredServers} MCP servers ready; transports: ${transports}.` : 'Backend API reachable; MCP transports are not configured.',
      }
    } catch (error) {
      return { status: 'unavailable', mode: 'api', transportConfigured: false, message: error instanceof Error ? error.message : 'Backend API unavailable.' }
    }
  },
  listServers: () => readApi('/servers'),
  getServer: (id) => readOptionalApi<MCPServer>(`/servers/${encode(id)}`),
  connectServer: (id) => readApi(`/servers/${encode(id)}/connect`, 'POST'),
  disconnectServer: (id) => readApi(`/servers/${encode(id)}/disconnect`, 'POST'),
  testServerConnection: (id) => readApi(`/servers/${encode(id)}/test`, 'POST'),
  listTools: (serverId) => readApi<MCPTool[]>(`/tools${serverId ? `?serverId=${encode(serverId)}` : ''}`),
  getTool: (id) => readOptionalApi<MCPTool>(`/tools/${encode(id)}`),
  listResources: (serverId) => readApi<MCPResource[]>(`/resources${serverId ? `?serverId=${encode(serverId)}` : ''}`),
  getResource: (id) => readOptionalApi<MCPResource>(`/resources/${encode(id)}`),
  readResource: (id) => readApi<MCPResourceContent>(`/resources/${encode(id)}/read`, 'POST', {}),
  listPrompts: (serverId) => readApi<MCPPrompt[]>(`/prompts${serverId ? `?serverId=${encode(serverId)}` : ''}`),
  getPrompt: (id) => readOptionalApi<MCPPrompt>(`/prompts/${encode(id)}`),
  executeTool: (request: MCPExecutionRequest) => {
    if (!request.toolId) throw new Error('Tool ID is required.')
    return readApi<MCPExecutionResult>(`/tools/${encode(request.toolId)}/execute`, 'POST', request)
  },
  executePrompt: (request: MCPExecutionRequest) => {
    if (!request.promptId) throw new Error('Prompt ID is required.')
    return readApi<MCPExecutionResult>(`/prompts/${encode(request.promptId)}/execute`, 'POST', request)
  },
  listExecutions: () => readApi<MCPExecutionResult[]>('/executions'),
  getExecution: (id) => readOptionalApi<MCPExecutionResult>(`/executions/${encode(id)}`),
  clearExecutions: async () => { await readApi<{ cleared: boolean }>('/executions', 'DELETE') },
  listLogs: (level, search, source) => {
    const query = new URLSearchParams()
    if (level) query.set('level', level)
    if (search) query.set('search', search)
    if (source) query.set('source', source)
    return readApi<LogEntry[]>(`/logs${query.size ? `?${query.toString()}` : ''}`)
  },
  clearLogs: async () => { await readApi<{ cleared: boolean }>('/logs', 'DELETE') },
  resetDemoState: async () => { throw new Error('Local demo reset is not available in API mode.') },
}

const activeProvider = (): MCPServiceProvider => {
  const runtime = getRuntimeConnectionSettings()
  return runtime.mode === 'api' && runtime.apiBaseUrl ? apiProvider : demoProvider
}

export const mcpServiceProvider: MCPServiceProvider = {
  get mode() { return activeProvider().mode },
  get initialServers() { return activeProvider().initialServers },
  get initialTools() { return activeProvider().initialTools },
  get initialExecutions() { return activeProvider().initialExecutions },
  get initialPrompts() { return activeProvider().initialPrompts },
  get initialResources() { return activeProvider().initialResources },
  health: () => activeProvider().health(),
  listServers: () => activeProvider().listServers(),
  getServer: (id) => activeProvider().getServer(id),
  connectServer: (id) => activeProvider().connectServer(id),
  disconnectServer: (id) => activeProvider().disconnectServer(id),
  testServerConnection: (id) => activeProvider().testServerConnection(id),
  listTools: (serverId) => activeProvider().listTools(serverId),
  getTool: (id) => activeProvider().getTool(id),
  listResources: (serverId) => activeProvider().listResources(serverId),
  getResource: (id) => activeProvider().getResource(id),
  readResource: (id) => activeProvider().readResource(id),
  listPrompts: (serverId) => activeProvider().listPrompts(serverId),
  getPrompt: (id) => activeProvider().getPrompt(id),
  executeTool: (request) => activeProvider().executeTool(request),
  executePrompt: (request) => activeProvider().executePrompt(request),
  listExecutions: () => activeProvider().listExecutions(),
  getExecution: (id) => activeProvider().getExecution(id),
  clearExecutions: () => activeProvider().clearExecutions(),
  listLogs: (level, search, source) => activeProvider().listLogs(level, search, source),
  clearLogs: () => activeProvider().clearLogs(),
  resetDemoState: () => activeProvider().resetDemoState(),
}
