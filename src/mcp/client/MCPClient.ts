import type { MCPExecutionRequest, MCPExecutionResult, MCPPrompt, MCPResource, MCPServer, MCPTool } from '../types/mcp.types'

export interface MCPClient {
  connect(server: MCPServer): Promise<void>
  disconnect(serverId: string): Promise<void>
  getServerInfo(serverId: string): Promise<MCPServer | undefined>
  listTools(serverId: string): Promise<MCPTool[]>
  listResources(serverId: string): Promise<MCPResource[]>
  listPrompts(serverId: string): Promise<MCPPrompt[]>
  callTool(request: MCPExecutionRequest): Promise<MCPExecutionResult>
  readResource(resourceId: string): Promise<MCPResource | undefined>
  getPrompt(promptId: string): Promise<MCPPrompt | undefined>
}

export class DefaultMCPClient implements MCPClient {
  private servers = new Map<string, MCPServer>()

  async connect(server: MCPServer): Promise<void> {
    this.servers.set(server.id, { ...server, connectionStatus: 'connected', enabled: true })
  }

  async disconnect(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (server) {
      this.servers.set(serverId, { ...server, connectionStatus: 'disconnected' })
    }
  }

  async getServerInfo(serverId: string): Promise<MCPServer | undefined> {
    return this.servers.get(serverId)
  }

  async listTools(serverId: string): Promise<MCPTool[]> {
    void serverId
    const tools: MCPTool[] = []
    return tools.filter((tool) => tool.serverId === serverId)
  }

  async listResources(serverId: string): Promise<MCPResource[]> {
    void serverId
    return []
  }

  async listPrompts(serverId: string): Promise<MCPPrompt[]> {
    void serverId
    return []
  }

  async callTool(request: MCPExecutionRequest): Promise<MCPExecutionResult> {
    return {
      id: `${request.id}-result`,
      requestId: request.id,
      status: 'success',
      output: { ok: true, values: request.input },
      startedAt: request.createdAt,
      finishedAt: new Date().toISOString(),
    }
  }

  async readResource(resourceId: string): Promise<MCPResource | undefined> {
    void resourceId
    return undefined
  }

  async getPrompt(promptId: string): Promise<MCPPrompt | undefined> {
    void promptId
    return undefined
  }
}
