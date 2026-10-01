import type { MCPPrompt, MCPResource, MCPServer, MCPTool } from '../types/mcp.types'

export type RegistryItem<T> = {
  items: T[]
  total: number
}

export type ToolRegistryState = RegistryItem<MCPTool>
export type ServerRegistryState = RegistryItem<MCPServer>
export type ResourceRegistryState = RegistryItem<MCPResource>
export type PromptRegistryState = RegistryItem<MCPPrompt>
