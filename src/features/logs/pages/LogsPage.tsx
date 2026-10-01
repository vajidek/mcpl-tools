import { useCallback, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import type { LogEntry, LogLevel } from '../../../services/logging/logTypes'
import { useAsync } from '../../../hooks/useAsync'

const levels: Array<'ALL' | LogLevel> = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR']

export function LogsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [level, setLevel] = useState<'ALL' | LogLevel>('ALL')
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [actionError, setActionError] = useState('')

  const loadLogs = useCallback(() => mcpServiceProvider.listLogs(level, search, source), [level, search, source, refreshKey])
  const { data: loadedLogs, loading, error: asyncError } = useAsync(loadLogs)
  const logs: LogEntry[] = loadedLogs ?? []
  const error = asyncError?.message ?? actionError

  const refreshLogs = () => {
    setActionError('')
    setRefreshKey((current) => current + 1)
  }

  const sources = useMemo(
    () => ['all', ...new Set(logs.map((entry) => entry.module ?? (mcpServiceProvider.mode === 'demo' ? 'demo seed' : 'backend')))],
    [logs],
  )

  const clearLogs = async () => {
    if (!window.confirm('Clear all log entries? This cannot be undone.')) return
    try {
      await mcpServiceProvider.clearLogs()
      refreshLogs()
    } catch (clearError) {
      setActionError(clearError instanceof Error ? clearError.message : 'Unable to clear logs.')
    }
  }

  const toneFor = (logLevel: LogLevel) =>
    logLevel === 'ERROR' ? 'error' : logLevel === 'WARN' ? 'warning' : logLevel === 'INFO' ? 'success' : 'info'

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Logs</p>
          <h2>Operations log</h2>
        </div>
        <div className="inline-actions">
          <Button type="button" variant="secondary" onClick={refreshLogs}>
            Refresh
          </Button>
          <Button type="button" variant="secondary" onClick={() => void clearLogs()} disabled={logs.length === 0}>
            Clear logs
          </Button>
        </div>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error}</div> : null}

      <Card className="panel">
        <div className="page-controls split">
          <select className="text-input" aria-label="Filter logs by level" value={level} onChange={(event) => setLevel(event.target.value as 'ALL' | LogLevel)}>
            {levels.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All levels' : item}</option>)}
          </select>
          <select className="text-input" aria-label="Filter logs by source" value={source} onChange={(event) => setSource(event.target.value)}>
            {sources.map((item) => <option key={item} value={item}>{item === 'all' ? 'All sources' : item}</option>)}
          </select>
          <input className="text-input" type="search" aria-label="Search logs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages, operations, modules" />
        </div>
      </Card>

      <Card className="panel">
        <div className="section-header">
          <h3>{logs.length} log entries</h3>
          <span className="tool-description">{mcpServiceProvider.mode === 'demo' ? 'Local demo log stream' : 'Backend log stream'}</span>
        </div>
        {loading && logs.length === 0 ? <p role="status">Loading logs…</p> : logs.length === 0 ? (
          <div className="empty-state compact">
            <h2>No log entries</h2>
            <p>No events match the current filters.</p>
          </div>
        ) : (
          <ul className="tool-list">
            {logs.map((entry) => (
              <li key={entry.id}>
                <div>
                  <div className="inline-actions">
                    <Badge tone={toneFor(entry.level)}>{entry.level}</Badge>
                    <strong>{entry.module ?? (mcpServiceProvider.mode === 'demo' ? 'demo seed' : 'backend')}</strong>
                  </div>
                  <small>{entry.message}</small>
                  {entry.operation ? <small>{entry.operation}</small> : null}
                </div>
                <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
