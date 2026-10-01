import { useSyncExternalStore } from 'react'
import type { MCPTool } from '../mcp/types/mcp.types'
import { mcpServiceProvider } from '../services/mcp/MCPServiceProvider'

export type ToolStoreState = {
  tools: MCPTool[]
  searchTerm: string
  isLoading: boolean
  error: string | null
}

let state: ToolStoreState = { tools: mcpServiceProvider.initialTools, searchTerm: '', isLoading: false, error: null }
const listeners = new Set<() => void>()

const publish = (next: ToolStoreState) => {
  state = next
  listeners.forEach((listener) => listener())
}

export const toolStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  refresh: async (serverId?: string) => {
    publish({ ...state, isLoading: true, error: null })
    try {
      const tools = await mcpServiceProvider.listTools(serverId)
      publish({ ...state, tools, isLoading: false, error: null })
      return tools
    } catch (error) {
      publish({ ...state, isLoading: false, error: error instanceof Error ? error.message : 'Unable to discover tools.' })
      return []
    }
  },
  setSearchTerm: (searchTerm: string) => publish({ ...state, searchTerm }),
}

export const useToolStore = () => useSyncExternalStore(toolStore.subscribe, toolStore.getSnapshot, toolStore.getSnapshot)

export const initialToolState: ToolStoreState = {
  tools: [],
  searchTerm: '',
  isLoading: false,
  error: null,
}
