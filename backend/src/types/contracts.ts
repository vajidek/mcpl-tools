import type {
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPPrompt,
  MCPResource,
  MCPResourceContent,
  MCPServer,
  MCPTool,
} from '../../../src/mcp/types/mcp.types.js'

export type { MCPExecutionRequest, MCPExecutionResult, MCPPrompt, MCPResource, MCPResourceContent, MCPServer, MCPTool }

export type MCPServerConfiguration = Pick<MCPServer, 'id' | 'name' | 'description' | 'transport' | 'capabilities' | 'enabled' | 'baseUrl'> & {
  command?: string
  args?: string[]
  env?: Record<string, string>
  connectionTimeoutMs?: number
  requestTimeoutMs?: number
}

export type ApiEnvelope<T> = { success: true; data: T; message?: string }
export type ApiErrorEnvelope = { success: false; error: { code: string; message: string; status: number } }
export type HealthStatus = {
  status: 'ok'
  service: 'mcpl-tools-api'
  environment: string
  mcp: { configuredServers: number; transportConfigured: boolean; supportedTransports: Array<'stdio' | 'http'> }
  uptimeSeconds: number
}

export type ExecutionSubmission = MCPExecutionRequest & {
  id: string
  createdAt: string
  input: Record<string, unknown>
}

export type MCPGateway = {
  readonly supportedTransports: Array<'stdio' | 'http'>
  close(): Promise<void>
  connect(server: MCPServer): Promise<MCPServer>
  disconnect(serverId: string): Promise<MCPServer>
  testConnection(serverId: string): Promise<{ success: boolean; message: string }>
  listTools(serverId: string): Promise<MCPTool[]>
  listResources(serverId: string): Promise<MCPResource[]>
  listPrompts(serverId: string): Promise<MCPPrompt[]>
  callTool(request: ExecutionSubmission): Promise<MCPExecutionResult>
  readResource(resourceId: string): Promise<MCPResourceContent>
  executePrompt(request: ExecutionSubmission): Promise<MCPExecutionResult>
}