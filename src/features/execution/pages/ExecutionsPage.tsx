import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { executionStore, useExecutionStore } from '../../../store/executionStore'
import { serverStore, useServerStore } from '../../../store/serverStore'

export function ExecutionsPage() {
  const { history, error } = useExecutionStore()
  const { servers } = useServerStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('all')
  const [server, setServer] = useState('all')
  const [kind, setKind] = useState('all')
  useEffect(() => {
    void executionStore.refresh()
    void serverStore.refresh()
  }, [])
  const executions = history.filter((execution) => {
    const query = searchTerm.trim().toLowerCase()
    const matchesQuery = !query || `${execution.id} ${execution.requestId} ${execution.toolName ?? ''} ${execution.toolId ?? ''} ${execution.promptId ?? ''} ${execution.error ?? ''}`.toLowerCase().includes(query)
    return matchesQuery && (status === 'all' || execution.status === status) && (server === 'all' || execution.serverId === server) && (kind === 'all' || (execution.kind ?? 'tool') === kind)
  })

  const clearHistory = async () => {
    if (window.confirm('Clear all execution history? This cannot be undone.')) await executionStore.clear()
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Executions</p>
          <h2>Execution history</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void clearHistory()} disabled={history.length === 0}>Clear history</Button>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error} <Button type="button" variant="ghost" onClick={() => void executionStore.refresh()}>Retry</Button></div> : null}

      <div className="page-controls split">
        <select aria-label="Filter executions by status" className="text-input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option><option value="success">Success</option><option value="error">Error</option>
        </select>
        <select aria-label="Filter executions by server" className="text-input" value={server} onChange={(event) => setServer(event.target.value)}>
          <option value="all">All servers</option>{servers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select aria-label="Filter executions by tool or prompt" className="text-input" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">Tools and prompts</option><option value="tool">Tools</option><option value="prompt">Prompts</option>
        </select>
        <input className="text-input" type="search" aria-label="Search execution history" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search tool, prompt, ID, or error" />
      </div>

      <section className="tool-grid">
        {executions.length === 0 ? <div className="empty-state compact">No executions match these filters.</div> : executions.map((execution) => (
          <Card key={execution.id} className="tool-card">
            <div className="tool-card-header">
              <div>
                <p className="eyebrow">{execution.serverId ?? (execution.kind === 'prompt' ? 'Prompt' : 'No server')}</p>
                <h3>{execution.toolName ?? execution.toolId ?? execution.promptId ?? 'Execution'}</h3>
              </div>
              <Badge tone={execution.status === 'success' ? 'success' : execution.status === 'error' ? 'error' : 'info'}>
                {execution.status}
              </Badge>
            </div>
            <p className="tool-description">{new Date(execution.startedAt).toLocaleString()}</p>
            <p className="tool-description">{execution.durationMs === undefined ? 'Duration unavailable' : `${execution.durationMs} ms`}</p>
            <p className="tool-description">{execution.error ?? (execution.output === undefined ? 'No response captured' : 'Result captured')}</p>
            <Link to={ROUTE_PATHS.executionDetail.replace(':executionId', execution.id)}>View execution</Link>
          </Card>
        ))}
      </section>
    </div>
  )
}
