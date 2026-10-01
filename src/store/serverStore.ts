import { useSyncExternalStore } from 'react'
import type { MCPServer } from '../mcp/types/mcp.types'
import { mcpServiceProvider } from '../services/mcp/MCPServiceProvider'

export type ServerStoreState = {
  servers: MCPServer[]
  isLoading: boolean
  error: string | null
}

let state: ServerStoreState = { servers: mcpServiceProvider.initialServers, isLoading: false, error: null }
const listeners = new Set<() => void>()

const publish = (next: ServerStoreState) => {
  state = next
  listeners.forEach((listener) => listener())
}

const updateServer = (server: MCPServer) => {
  publish({ ...state, servers: state.servers.map((item) => item.id === server.id ? server : item), error: null })
  return server
}

export const serverStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  refresh: async () => {
    publish({ ...state, isLoading: true, error: null })
    try {
      const servers = await mcpServiceProvider.listServers()
      publish({ servers, isLoading: false, error: null })
      return servers
    } catch (error) {
      publish({ ...state, isLoading: false, error: error instanceof Error ? error.message : 'Unable to refresh servers.' })
      return []
    }
  },
  connect: async (serverId: string) => {
    const connecting = state.servers.find((server) => server.id === serverId)
    if (connecting) updateServer({ ...connecting, connectionStatus: 'connecting' })
    try {
      return updateServer(await mcpServiceProvider.connectServer(serverId))
    } catch (error) {
      const failed = state.servers.find((server) => server.id === serverId)
      if (failed) updateServer({ ...failed, connectionStatus: 'error' })
      const message = error instanceof Error ? error.message : 'Unable to connect to server.'
      publish({ ...state, error: message })
      throw new Error(message, { cause: error })
    }
  },
  disconnect: async (serverId: string) => updateServer(await mcpServiceProvider.disconnectServer(serverId)),
  testConnection: (serverId: string) => mcpServiceProvider.testServerConnection(serverId),
}

export const useServerStore = () => useSyncExternalStore(serverStore.subscribe, serverStore.getSnapshot, serverStore.getSnapshot)

export const initialServerState: ServerStoreState = {
  servers: [],
  isLoading: false,
  error: null,
}