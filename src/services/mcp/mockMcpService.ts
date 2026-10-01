import { mockExecutions, mockLogs } from '../../mocks/execution'
import { mockPrompts, mockResources, mockServers, mockTools } from '../../mocks/servers'
import type {
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPPrompt,
  MCPResource,
  MCPResourceContent,
  MCPServer,
  MCPTool,
} from '../../mcp/types/mcp.types'
import { readStorage, writeStorage } from '../storage/localStorage'
import { STORAGE_KEYS } from '../../app/config/constants'
import { logger } from '../logging/logger'
import type { LogEntry } from '../logging/logTypes'

let serversState = [...mockServers]
let executionsState = readStorage<MCPExecutionResult[]>(STORAGE_KEYS.recentExecutions, [...mockExecutions])
let logsState: LogEntry[] = [...mockLogs]

const appendLog = (level: LogEntry['level'], message: string, meta: Partial<LogEntry> = {}) => {
  const entry = logger.createLog(level, message, meta)
  logsState = [entry, ...logsState]
  return entry
}

const saveExecutions = () => writeStorage(STORAGE_KEYS.recentExecutions, executionsState)

const saveExecution = (result: MCPExecutionResult) => {
  executionsState = [result, ...executionsState.filter((entry) => entry.id !== result.id)]
  saveExecutions()
  appendLog(result.status === 'error' ? 'ERROR' : 'INFO', `${result.kind ?? 'tool'} execution ${result.status}`, {
    executionId: result.id,
    serverId: result.serverId,
    toolId: result.toolId,
  })
  return result
}

export const mockMcpService = {
  getServers: (): MCPServer[] => [...serversState],

  getServerById: (serverId: string): MCPServer | undefined =>
    serversState.find((server) => server.id === serverId),

  refreshServers: async (): Promise<MCPServer[]> => {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return mockMcpService.getServers()
  },

  connectServer: async (serverId: string): Promise<MCPServer> => {
    const server = mockMcpService.getServerById(serverId)
    if (!server) throw new Error('Server not found.')
    if (!server.enabled) throw new Error('Enable this server before connecting.')
    serversState = serversState.map((item) => item.id === serverId ? { ...item, connectionStatus: 'connecting' } : item)
    await new Promise((resolve) => setTimeout(resolve, 350))
    serversState = serversState.map((item) => item.id === serverId ? { ...item, connectionStatus: 'connected' } : item)
    appendLog('INFO', `Demo connection established for ${server.name}`, { serverId, module: 'mock-mcp' })
    return mockMcpService.getServerById(serverId)!
  },

  disconnectServer: async (serverId: string): Promise<MCPServer> => {
    const server = mockMcpService.getServerById(serverId)
    if (!server) throw new Error('Server not found.')
    await new Promise((resolve) => setTimeout(resolve, 200))
    serversState = serversState.map((item) => item.id === serverId ? { ...item, connectionStatus: 'disconnected' } : item)
    appendLog('WARN', `Demo connection closed for ${server.name}`, { serverId, module: 'mock-mcp' })
    return mockMcpService.getServerById(serverId)!
  },

  getTools: (serverId?: string): MCPTool[] => {
    const tools = [...mockTools]
    return serverId ? tools.filter((tool) => tool.serverId === serverId) : tools
  },

  discoverTools: async (serverId?: string): Promise<MCPTool[]> => {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return mockMcpService.getTools(serverId)
  },

  getToolById: (toolId: string): MCPTool | undefined =>
    mockTools.find((tool) => tool.id === toolId),

  searchTools: (term: string, serverId?: string): MCPTool[] => {
    const normalized = term.trim().toLowerCase()

    return mockMcpService.getTools(serverId).filter((tool) => {
      if (!normalized) {
        return true
      }

      return (
        tool.name.toLowerCase().includes(normalized) ||
        tool.description.toLowerCase().includes(normalized) ||
        tool.category.toLowerCase().includes(normalized) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(normalized))
      )
    })
  },

  getResources: (): MCPResource[] => [...mockResources],

  discoverResources: async (): Promise<MCPResource[]> => {
    await new Promise((resolve) => setTimeout(resolve, 140))
    return mockMcpService.getResources()
  },

  getResourceById: (resourceId: string): MCPResource | undefined =>
    mockResources.find((resource) => resource.id === resourceId),

  getPrompts: (): MCPPrompt[] => [...mockPrompts],

  discoverPrompts: async (): Promise<MCPPrompt[]> => {
    await new Promise((resolve) => setTimeout(resolve, 140))
    return mockMcpService.getPrompts()
  },

  getPromptById: (promptId: string): MCPPrompt | undefined =>
    mockPrompts.find((prompt) => prompt.id === promptId),

  getExecutionHistory: (): MCPExecutionResult[] => [...executionsState],

  getExecutionById: (executionId: string): MCPExecutionResult | undefined =>
    executionsState.find((execution) => execution.id === executionId),

  clearExecutionHistory: () => {
    executionsState = []
    saveExecutions()
  },

  getLogs: (level?: string, search = '', source?: string): LogEntry[] => {
    const normalizedLevel = level?.toUpperCase()
    const normalizedSearch = search.trim().toLowerCase()
    const normalizedSource = source?.trim().toLowerCase()

    return logsState.filter((entry) => {
      const matchesLevel = !normalizedLevel || normalizedLevel === 'ALL' || entry.level === normalizedLevel
      const matchesSearch = !normalizedSearch || `${entry.message} ${entry.level} ${entry.module ?? ''} ${entry.operation ?? ''}`.toLowerCase().includes(normalizedSearch)
      const entrySource = (entry.module ?? 'demo seed').toLowerCase()
      const matchesSource = !normalizedSource || normalizedSource === 'all' || entrySource === normalizedSource
      return matchesLevel && matchesSearch && matchesSource
    })
  },

  clearLogs: () => {
    logsState = []
  },

  resetDemoState: () => {
    serversState = [...mockServers]
    executionsState = [...mockExecutions]
    logsState = [...mockLogs]
    saveExecutions()
  },

  testServerConnection: async (serverId: string): Promise<{ success: boolean; message: string }> => {
    const server = mockMcpService.getServerById(serverId)

    if (!server) {
      return {
        success: false,
        message: 'Server not found.',
      }
    }

    if (!server.enabled) {
      return { success: false, message: 'Server is disabled.' }
    }
    await new Promise((resolve) => setTimeout(resolve, 400))

    const result = {
      success: true,
      message: `Demo connection check passed for ${server.name}. No external MCP server was contacted.`,
    }
    appendLog('INFO', `Demo connection test passed for ${server.name}`, { serverId, module: 'mock-mcp', operation: 'test-connection' })
    return result
  },

  executeTool: async (request: MCPExecutionRequest): Promise<MCPExecutionResult> => {
    const startedAt = request.createdAt
    const started = Date.now()
    const tool = request.toolId ? mockMcpService.getToolById(request.toolId) : undefined
    const failed = (message: string) => saveExecution({
      id: request.id,
      requestId: request.id,
      kind: 'tool',
      toolId: request.toolId,
      serverId: request.serverId,
      toolName: tool?.name ?? request.toolId ?? 'Unknown tool',
      input: request.input,
      request,
      status: 'error',
      error: message,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
    })

    if (!tool) {
      return failed('Tool not available in the current workspace.')
    }

    if (!tool.available) {
      return failed(`Tool ${tool.name} is currently unavailable.`)
    }

    const schema = tool.inputSchema?.properties ?? {}
    const missing = Object.keys(schema).filter((key) => {
      const isRequired = tool.inputSchema?.required?.includes(key) ?? false
      const value = request.input[key]
      return isRequired && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))
    })

    if (missing.length > 0) {
      return failed(`Missing required field(s): ${missing.join(', ')}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 550))

    return saveExecution({
      id: request.id,
      requestId: request.id,
      kind: 'tool',
      toolId: tool.id,
      serverId: tool.serverId,
      toolName: tool.name,
      input: request.input,
      request,
      status: 'success',
      output: {
        tool: tool.name,
        serverId: request.serverId,
        input: request.input,
        response: {
          ok: true,
          message: `${tool.name} executed successfully.`,
          timestamp: new Date().toISOString(),
        },
      },
      startedAt: request.createdAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
    })
  },

  readResource: async (resourceId: string): Promise<MCPResourceContent> => {
    const resource = mockMcpService.getResourceById(resourceId)

    if (!resource) {
      throw new Error('Resource not found.')
    }

    await new Promise((resolve) => setTimeout(resolve, 250))

    return {
      uri: resource.uri,
      mimeType: resource.mimeType,
      text: `Resource payload for ${resource.name}\n\nURI: ${resource.uri}\nDescription: ${resource.description ?? 'No description provided.'}`,
    }
  },

  renderPrompt: async (promptId: string, argumentsMap: Record<string, string>): Promise<{ text: string }> => {
    const prompt = mockMcpService.getPromptById(promptId)

    if (!prompt) {
      throw new Error('Prompt not found.')
    }

    const promptArgs = prompt.arguments ?? []
    const missingRequired = promptArgs
      .filter((argument) => argument.required && !argumentsMap[argument.name]?.trim())
      .map((argument) => argument.name)

    if (missingRequired.length > 0) {
      throw new Error(`Missing required prompt argument(s): ${missingRequired.join(', ')}`)
    }

    const rendered = promptArgs.length
      ? promptArgs
          .map((argument) => `${argument.name}: ${argumentsMap[argument.name] ?? ''}`)
          .join('\n')
      : 'No arguments required.'

    return {
      text: `Prompt: ${prompt.name}\n\n${prompt.description}\n\n${rendered}`,
    }
  },

  executePrompt: async (request: MCPExecutionRequest): Promise<MCPExecutionResult> => {
    const prompt = request.promptId ? mockMcpService.getPromptById(request.promptId) : undefined
    const started = Date.now()
    try {
      if (!prompt) throw new Error('Prompt not found.')
      const rendered = await mockMcpService.renderPrompt(prompt.id, Object.fromEntries(
        Object.entries(request.input).map(([key, value]) => [key, String(value)]),
      ))
      return saveExecution({
        id: request.id,
        requestId: request.id,
        kind: 'prompt',
        promptId: prompt.id,
        toolName: prompt.name,
        input: request.input,
        request,
        status: 'success',
        output: rendered,
        startedAt: request.createdAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      })
    } catch (error) {
      return saveExecution({
        id: request.id,
        requestId: request.id,
        kind: 'prompt',
        promptId: request.promptId,
        toolName: prompt?.name ?? 'Unknown prompt',
        input: request.input,
        request,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to render prompt.',
        startedAt: request.createdAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      })
    }
  },
}

export const getServerMetrics = () => {
  const servers = mockMcpService.getServers()
  const tools = mockMcpService.getTools()
  const resources = mockMcpService.getResources()
  const prompts = mockMcpService.getPrompts()
  const executions = mockMcpService.getExecutionHistory()

  return {
    connectedServers: servers.filter((server) => server.connectionStatus === 'connected').length,
    totalTools: tools.length,
    totalResources: resources.length,
    totalPrompts: prompts.length,
    totalServers: servers.length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter((execution) => execution.status === 'success').length,
    recentExecutions: executions.length,
    failedExecutions: executions.filter((execution) => execution.status === 'error').length,
  }
}
