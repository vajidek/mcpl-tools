import type { MCPExecutionResult } from '../mcp/types/mcp.types'
import type { LogEntry } from '../services/logging/logTypes'

export const mockExecutions: MCPExecutionResult[] = [
  {
    id: 'exec-core-01',
    requestId: 'req-core-01',
    toolName: 'json_format',
    toolId: 'tool-json-format',
    serverId: 'server-core',
    input: { json: '{"project":"MCPL Tools","ready":true}' },
    status: 'success',
    startedAt: '2026-10-01T08:30:00.000Z',
    finishedAt: '2026-10-01T08:30:00.120Z',
    durationMs: 120,
  },
  {
    id: 'exec-core-02',
    requestId: 'req-core-02',
    toolName: 'sha256',
    toolId: 'tool-sha256',
    serverId: 'server-core',
    input: { text: 'MCPL Tools' },
    status: 'success',
    startedAt: '2026-10-01T09:15:00.000Z',
    finishedAt: '2026-10-01T09:15:00.140Z',
    durationMs: 140,
  },
]

export const mockLogs: LogEntry[] = [
  { id: 'log-core-01', level: 'INFO', message: 'MCPL Core Tools loaded', timestamp: '2026-10-01T08:29:00.000Z', module: 'core-tools' },
  { id: 'log-core-02', level: 'INFO', message: 'json_format executed successfully', timestamp: '2026-10-01T08:30:00.120Z', module: 'core-tools' },
  { id: 'log-core-03', level: 'INFO', message: 'sha256 executed successfully', timestamp: '2026-10-01T09:15:00.140Z', module: 'core-tools' },
]
