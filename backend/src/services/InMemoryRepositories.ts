import { randomUUID } from 'node:crypto'
import type { LogEntry, LogLevel } from '../../../src/services/logging/logTypes.js'
import type { MCPExecutionResult, MCPServer } from '../types/contracts.js'

export interface ServerRepository {
  listServers(): MCPServer[]
  getServer(serverId: string): MCPServer | undefined
  setConnectionStatus(serverId: string, status: MCPServer['connectionStatus'], metadata?: Record<string, unknown>, capabilities?: string[]): void
}

export interface ExecutionRepository {
  listExecutions(): MCPExecutionResult[]
  getExecution(executionId: string): MCPExecutionResult | undefined
  addExecution(result: MCPExecutionResult): void
  clearExecutions(): void
}

export interface LogRepository {
  listLogs(level?: string, search?: string, source?: string): LogEntry[]
  addLog(level: LogLevel, message: string, metadata?: Pick<LogEntry, 'operation' | 'executionId' | 'serverId' | 'toolId'>): void
  clearLogs(): void
}

export class InMemoryRuntimeRepositories implements ServerRepository, ExecutionRepository, LogRepository {
  private readonly executions: MCPExecutionResult[] = []
  private readonly logs: LogEntry[] = []
  private readonly statuses = new Map<string, MCPServer['connectionStatus']>()
  private readonly serverMetadata = new Map<string, Record<string, unknown>>()
  private readonly serverCapabilities = new Map<string, string[]>()

  constructor(private readonly configuredServers: MCPServer[]) {}

  listServers(): MCPServer[] {
    return this.configuredServers.map((server) => ({
      ...server,
      capabilities: [...(this.serverCapabilities.get(server.id) ?? server.capabilities)],
      connectionStatus: this.statuses.get(server.id) ?? 'disconnected',
      metadata: this.serverMetadata.get(server.id),
    }))
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.listServers().find((server) => server.id === serverId)
  }

  setConnectionStatus(serverId: string, status: MCPServer['connectionStatus'], metadata?: Record<string, unknown>, capabilities?: string[]): void {
    this.statuses.set(serverId, status)
    if (metadata) this.serverMetadata.set(serverId, metadata)
    if (capabilities) this.serverCapabilities.set(serverId, capabilities)
  }

  listExecutions(): MCPExecutionResult[] {
    return [...this.executions]
  }

  listLogs(level?: string, search?: string, source?: string): LogEntry[] {
    const normalizedLevel = level?.toUpperCase()
    const normalizedSearch = search?.trim().toLowerCase()
    const normalizedSource = source?.trim().toLowerCase()
    return this.logs.filter((entry) => {
      const matchesLevel = !normalizedLevel || normalizedLevel === 'ALL' || normalizedLevel === entry.level
      const matchesSearch = !normalizedSearch || `${entry.message} ${entry.operation ?? ''}`.toLowerCase().includes(normalizedSearch)
      const matchesSource = !normalizedSource || normalizedSource === 'all' || (entry.module ?? 'backend') === normalizedSource
      return matchesLevel && matchesSearch && matchesSource
    })
  }

  getExecution(executionId: string): MCPExecutionResult | undefined {
    return this.executions.find((entry) => entry.id === executionId)
  }

  addExecution(result: MCPExecutionResult): void {
    this.executions.unshift(result)
  }

  clearExecutions(): void {
    this.executions.length = 0
  }

  addLog(level: LogLevel, message: string, metadata: Pick<LogEntry, 'operation' | 'executionId' | 'serverId' | 'toolId'> = {}): void {
    this.logs.unshift({ id: randomUUID(), level, message: redactSecrets(message), timestamp: new Date().toISOString(), module: 'backend', ...metadata })
  }

  clearLogs(): void {
    this.logs.length = 0
  }
}

const redactSecrets = (message: string) => message.replace(/(password|token|api[_-]?key|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')