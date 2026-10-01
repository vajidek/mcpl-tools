import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import type { MCPExecutionResult } from '../../../mcp/types/mcp.types'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'

export function ExecutionDetailPage() {
  const { executionId = '' } = useParams()
  const [execution, setExecution] = useState<MCPExecutionResult | undefined>()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    mcpServiceProvider.getExecution(executionId).then((item) => {
      if (active) setExecution(item)
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load execution.')
    })
    return () => { active = false }
  }, [executionId])

  if (!execution && !error) return <p role="status">Loading execution…</p>

  if (!execution) {
    return <section className="empty-state" role="status">
      <h2>Execution not found</h2>
      <p>{error || 'This execution may have been cleared or is not available from the selected provider.'}</p>
      <Link to={ROUTE_PATHS.executions}>Return to execution history</Link>
    </section>
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Execution detail</p>
          <h2>{execution.toolName ?? execution.toolId ?? execution.promptId ?? 'Execution'}</h2>
        </div>
        <Badge tone={execution.status === 'success' ? 'success' : execution.status === 'error' ? 'error' : 'info'}>{execution.status}</Badge>
      </header>

      <Card className="panel">
        <div className="meta-list">
          <div><span className="meta-label">Execution ID</span><strong>{execution.id}</strong></div>
          <div><span className="meta-label">Kind</span><strong>{execution.kind ?? 'tool'}</strong></div>
          <div><span className="meta-label">Server</span><strong>{execution.serverId ?? 'Not applicable'}</strong></div>
          <div><span className="meta-label">Started</span><strong>{new Date(execution.startedAt).toLocaleString()}</strong></div>
          <div><span className="meta-label">Finished</span><strong>{execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : 'Not recorded'}</strong></div>
          <div><span className="meta-label">Duration</span><strong>{execution.durationMs === undefined ? 'Not recorded' : `${execution.durationMs} ms`}</strong></div>
        </div>
      </Card>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header"><h3>Request</h3></div>
          <pre className="json-block">{JSON.stringify(execution.request ?? { input: execution.input }, null, 2)}</pre>
        </Card>
        <Card className="panel">
          <div className="section-header"><h3>{execution.status === 'error' ? 'Error' : 'Response'}</h3></div>
          {execution.error ? <div className="result-banner result-banner-error" role="alert">{execution.error}</div> : <pre className="json-block">{JSON.stringify(execution.output ?? { summary: 'No response payload was captured for this seeded demo record.' }, null, 2)}</pre>}
        </Card>
      </div>
      <Link to={ROUTE_PATHS.executions}>Back to execution history</Link>
    </div>
  )
}