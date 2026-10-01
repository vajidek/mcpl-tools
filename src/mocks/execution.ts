import type { MCPExecutionResult } from '../mcp/types/mcp.types'
import type { LogEntry } from '../services/logging/logTypes'

export const mockExecutions: MCPExecutionResult[] = [
  {
    id: 'exec-01',
    requestId: 'req-01',
    toolName: 'discover_tools',
    serverId: 'server-local',
    status: 'success',
    startedAt: '2026-09-28T10:30:00.000Z',
    finishedAt: '2026-09-28T10:30:00.430Z',
    durationMs: 430,
  },
  {
    id: 'exec-02',
    requestId: 'req-02',
    toolName: 'execute_tool',
    serverId: 'server-local',
    status: 'error',
    startedAt: '2026-09-28T11:16:00.000Z',
    finishedAt: '2026-09-28T11:16:00.254Z',
    durationMs: 254,
  },
  {
    id: 'exec-03',
    requestId: 'req-03',
    toolName: 'fetch_resource',
    serverId: 'server-gateway',
    status: 'success',
    startedAt: '2026-09-28T12:02:00.000Z',
    finishedAt: '2026-09-28T12:02:00.593Z',
    durationMs: 593,
  },
]

export const mockLogs: LogEntry[] = [
  { id: 'log-01', level: 'INFO', message: 'Connected to local workspace server', timestamp: '2026-09-28T10:30:00.000Z' },
  { id: 'log-02', level: 'WARN', message: 'Gateway connection retry queued', timestamp: '2026-09-28T11:05:00.000Z' },
  { id: 'log-03', level: 'ERROR', message: 'Invalid tool payload for execute_tool', timestamp: '2026-09-28T11:16:00.000Z' },
  { id: 'log-04', level: 'DEBUG', message: 'Tool schema validated for discover_tools', timestamp: '2026-09-28T12:01:00.000Z' },
]
