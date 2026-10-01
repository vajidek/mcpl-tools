import { BackendError } from '../errors/BackendError.js'
import type { MCPGateway, MCPServer } from '../types/contracts.js'

const unavailable = (): never => {
  throw new BackendError(
    501,
    'MCP_TRANSPORT_NOT_CONFIGURED',
    'No MCP transport adapter is configured. This API does not establish or simulate server connections.',
  )
}

export class UnconfiguredMCPGateway implements MCPGateway {
  readonly supportedTransports: Array<'stdio' | 'http'> = []

  async close(): Promise<void> {}

  async connect(): Promise<MCPServer> { return unavailable() }
  async disconnect(): Promise<MCPServer> { return unavailable() }
  async testConnection(): Promise<{ success: boolean; message: string }> { return unavailable() }
  async listTools(): ReturnType<MCPGateway['listTools']> { return unavailable() }
  async listResources(): ReturnType<MCPGateway['listResources']> { return unavailable() }
  async listPrompts(): ReturnType<MCPGateway['listPrompts']> { return unavailable() }
  async callTool(): ReturnType<MCPGateway['callTool']> { return unavailable() }
  async readResource(): ReturnType<MCPGateway['readResource']> { return unavailable() }
  async executePrompt(): ReturnType<MCPGateway['executePrompt']> { return unavailable() }
}