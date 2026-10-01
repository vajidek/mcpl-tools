import { useSyncExternalStore } from 'react'
import type { MCPExecutionRequest, MCPExecutionResult } from '../mcp/types/mcp.types'
import { mcpServiceProvider } from '../services/mcp/MCPServiceProvider'

export type ExecutionStoreState = {
  currentRequest: MCPExecutionRequest | null
  history: MCPExecutionResult[]
  isRunning: boolean
  error: string | null
}

let state: ExecutionStoreState = {
  currentRequest: null,
  history: mcpServiceProvider.initialExecutions,
  isRunning: false,
  error: null,
}
const listeners = new Set<() => void>()

const publish = (next: ExecutionStoreState) => {
  state = next
  listeners.forEach((listener) => listener())
}

const run = async (request: MCPExecutionRequest, execute: (request: MCPExecutionRequest) => Promise<MCPExecutionResult>) => {
  publish({ ...state, currentRequest: request, isRunning: true, error: null })
  try {
    const result = await execute(request)
    publish({ ...state, history: await mcpServiceProvider.listExecutions(), isRunning: false, error: result.error ?? null })
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Execution failed.'
    publish({ ...state, isRunning: false, error: message })
    throw new Error(message, { cause: error })
  }
}

export const executionStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  refresh: async () => {
    try {
      const history = await mcpServiceProvider.listExecutions()
      publish({ ...state, history, error: null })
    } catch (error) {
      publish({ ...state, error: error instanceof Error ? error.message : 'Unable to load execution history.' })
    }
  },
  runTool: (request: MCPExecutionRequest) => run(request, mcpServiceProvider.executeTool),
  runPrompt: (request: MCPExecutionRequest) => run(request, mcpServiceProvider.executePrompt),
  clear: async (): Promise<boolean> => {
    try {
      await mcpServiceProvider.clearExecutions()
      publish({ ...state, currentRequest: null, history: [], error: null })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to clear execution history.'
      publish({ ...state, error: message })
      return false
    }
  },
}

export const useExecutionStore = () => useSyncExternalStore(executionStore.subscribe, executionStore.getSnapshot, executionStore.getSnapshot)

export const initialExecutionState: ExecutionStoreState = {
  currentRequest: null,
  history: [],
  isRunning: false,
  error: null,
}
