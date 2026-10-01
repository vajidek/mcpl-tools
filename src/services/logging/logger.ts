import type { LogEntry, LogLevel } from './logTypes'

const redact = (value: string | undefined) => value ?? '[redacted]'

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    console.debug('[DEBUG]', message, { ...meta, timestamp: new Date().toISOString() }),
  info: (message: string, meta?: Record<string, unknown>) =>
    console.info('[INFO]', message, { ...meta, timestamp: new Date().toISOString() }),
  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn('[WARN]', message, { ...meta, timestamp: new Date().toISOString() }),
  error: (message: string, meta?: Record<string, unknown>) =>
    console.error('[ERROR]', message, { ...meta, timestamp: new Date().toISOString() }),
  createLog: (
    level: LogLevel,
    message: string,
    extra?: Partial<LogEntry>,
  ): LogEntry => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level,
    message: message.replace(/(password|token|api[_-]?key|secret)/gi, redact),
    timestamp: new Date().toISOString(),
    ...extra,
  }),
}
