export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export type LogEntry = {
  id: string
  level: LogLevel
  message: string
  timestamp: string
  module?: string
  operation?: string
  executionId?: string
  serverId?: string
  toolId?: string
  metadata?: Record<string, unknown>
}
