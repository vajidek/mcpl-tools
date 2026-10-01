import type { MCPTool } from '../types/mcp.types'

export function discoverTools(serverId: string, source: MCPTool[]): MCPTool[] {
  return source.filter((tool) => tool.serverId === serverId)
}
