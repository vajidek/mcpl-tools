import type {
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPPrompt,
  MCPResource,
  MCPResourceContent,
  MCPServer,
  MCPTool,
} from '../../mcp/types/mcp.types'
import type { LogEntry } from '../logging/logTypes'

export type ConnectionTestResult = { success: boolean; message: string }
export type ProviderHealth = {
  status: 'ok' | 'unavailable'
  mode: 'demo' | 'api'
  transportConfigured: boolean
  message: string
}

export interface MCPServiceProvider {
  readonly mode: 'demo' | 'api'
  readonly initialServers: MCPServer[]
  readonly initialTools: MCPTool[]
  readonly initialExecutions: MCPExecutionResult[]
  readonly initialPrompts: MCPPrompt[]
  readonly initialResources: MCPResource[]
  health(): Promise<ProviderHealth>
  listServers(): Promise<MCPServer[]>
  getServer(serverId: string): Promise<MCPServer | undefined>
  connectServer(serverId: string): Promise<MCPServer>
  disconnectServer(serverId: string): Promise<MCPServer>
  testServerConnection(serverId: string): Promise<ConnectionTestResult>
  listTools(serverId?: string): Promise<MCPTool[]>
  getTool(toolId: string): Promise<MCPTool | undefined>
  listResources(serverId?: string): Promise<MCPResource[]>
  getResource(resourceId: string): Promise<MCPResource | undefined>
  readResource(resourceId: string): Promise<MCPResourceContent>
  listPrompts(serverId?: string): Promise<MCPPrompt[]>
  getPrompt(promptId: string): Promise<MCPPrompt | undefined>
  executeTool(request: MCPExecutionRequest): Promise<MCPExecutionResult>
  executePrompt(request: MCPExecutionRequest): Promise<MCPExecutionResult>
  listExecutions(): Promise<MCPExecutionResult[]>
  getExecution(executionId: string): Promise<MCPExecutionResult | undefined>
  clearExecutions(): Promise<void>
  listLogs(level?: string, search?: string, source?: string): Promise<LogEntry[]>
  clearLogs(): Promise<void>
  resetDemoState(): Promise<void>
}