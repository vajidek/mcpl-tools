import type { MCPServer } from '../types/mcp.types'

export const defaultServerTemplate: MCPServer = {
  id: 'demo-server',
  name: 'Demo MCP Server',
  description: 'Local MCP server designed for development and testing',
  transport: 'stdio',
  capabilities: ['tools', 'resources', 'prompts'],
  enabled: true,
  connectionStatus: 'connected',
}
