export type MCPServerStatus = 'connected' | 'disconnected' | 'connecting' | 'initializing' | 'ready' | 'error'
export type MCPConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'initializing' | 'ready' | 'error'
export type MCPTransportType = 'stdio' | 'http' | 'sse' | 'websocket'

export type MCPServer = {
  id: string
  name: string
  description: string
  transport: MCPTransportType
  capabilities: string[]
  enabled: boolean
  connectionStatus: MCPServerStatus
  baseUrl?: string
  metadata?: Record<string, unknown>
}

export type MCPConnection = {
  id: string
  serverId: string
  status: MCPConnectionStatus
  transport: MCPTransportType
  connectedAt?: string
  config?: Record<string, unknown>
}

export type MCPToolInputSchema = {
  type: 'object'
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export type MCPTool = {
  id: string
  name: string
  description: string
  category: string
  serverId: string
  inputSchema?: MCPToolInputSchema
  available: boolean
  tags: string[]
}

export type MCPResource = {
  id: string
  serverId?: string
  name: string
  uri: string
  mimeType: string
  description?: string
}

export type MCPResourceContent = {
  uri: string
  mimeType: string
  text?: string
  blob?: string
}

export type MCPPromptArgument = {
  name: string
  description?: string
  required?: boolean
}

export type MCPPrompt = {
  id: string
  serverId?: string
  name: string
  description: string
  arguments?: MCPPromptArgument[]
}

export type MCPExecutionRequest = {
  id: string
  kind?: 'tool' | 'prompt'
  toolId?: string
  promptId?: string
  serverId?: string
  input: Record<string, unknown>
  createdAt: string
}

export type MCPExecutionResult = {
  id: string
  requestId: string
  status: 'success' | 'error' | 'loading'
  kind?: 'tool' | 'prompt'
  serverId?: string
  toolId?: string
  promptId?: string
  toolName?: string
  durationMs?: number
  input?: Record<string, unknown>
  request?: MCPExecutionRequest
  output?: unknown
  error?: string
  startedAt: string
  finishedAt?: string
}

export type MCPExecutionError = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type MCPTransport = {
  type: MCPTransportType
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: () => boolean
}
