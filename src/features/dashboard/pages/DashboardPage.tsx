import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import type { LogEntry } from '../../../services/logging/logTypes'
import { executionStore, useExecutionStore } from '../../../store/executionStore'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { toolStore, useToolStore } from '../../../store/toolStore'

export function DashboardPage() {
  const { servers } = useServerStore()
  const { tools } = useToolStore()
  const { history } = useExecutionStore()
  const [resourceCount, setResourceCount] = useState(mcpServiceProvider.initialResources.length)
  const [promptCount, setPromptCount] = useState(mcpServiceProvider.initialPrompts.length)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [recentErrors, setRecentErrors] = useState<LogEntry[]>([])
  const [providerError, setProviderError] = useState('')

  useEffect(() => {
    let active = true
    void serverStore.refresh()
    void toolStore.refresh()
    void executionStore.refresh()
    const loadActivity = async () => {
      const [resources, prompts, allLogs, errors] = await Promise.allSettled([
        mcpServiceProvider.listResources(),
        mcpServiceProvider.listPrompts(),
        mcpServiceProvider.listLogs('ALL'),
        mcpServiceProvider.listLogs('ERROR'),
      ])
      if (!active) return
      if (resources.status === 'fulfilled') setResourceCount(resources.value.length)
      if (prompts.status === 'fulfilled') setPromptCount(prompts.value.length)
      if (allLogs.status === 'fulfilled') setLogs(allLogs.value.slice(0, 4))
      if (errors.status === 'fulfilled') setRecentErrors(errors.value.slice(0, 3))
      const failures = [resources, prompts, allLogs, errors].filter((outcome) => outcome.status === 'rejected')
      if (failures.length) setProviderError('Some dashboard data is unavailable from the selected provider.')
    }
    void loadActivity()
    return () => { active = false }
  }, [])

  const metrics = [
    { label: 'Total servers', value: String(servers.length) },
    { label: 'Connected servers', value: String(servers.filter((server) => server.connectionStatus === 'connected').length) },
    { label: 'Available tools', value: String(tools.filter((tool) => tool.available).length) },
    { label: 'Available resources', value: String(resourceCount) },
    { label: 'Available prompts', value: String(promptCount) },
    { label: 'Total executions', value: String(history.length) },
    { label: 'Successful executions', value: String(history.filter((item) => item.status === 'success').length) },
    { label: 'Failed executions', value: String(history.filter((item) => item.status === 'error').length) },
  ]

  const recentExecutions = history.slice(0, 4)
  const recentEvents = logs

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Operations overview</h2>
        </div>
      </header>
      {providerError ? <div className="result-banner result-banner-error" role="status">{providerError}</div> : null}

      <section className="stats-grid">
        {metrics.map((metric) => (
          <Card key={metric.label} className="stat-card">
            <p className="stat-label">{metric.label}</p>
            <h3>{metric.value}</h3>
          </Card>
        ))}
      </section>

      <section className="content-grid">
        <Card className="panel">
          <div className="panel-header">
            <h3>Server status</h3>
          </div>
          <ul className="tool-list">
            {servers.map((server) => (
              <li key={server.id}>
                <div>
                  <strong>{server.name}</strong>
                  <small>{server.transport}</small>
                </div>
                <Badge tone={server.connectionStatus === 'connected' ? 'success' : server.connectionStatus === 'error' ? 'error' : 'warning'}>
                  {server.connectionStatus}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="panel">
          <div className="panel-header">
            <h3>Recent activity</h3>
          </div>
          <ul className="tool-list">
            {recentExecutions.length ? recentExecutions.map((execution) => (
              <li key={execution.id}>
                <div>
                  <strong>{execution.toolName ?? execution.toolId ?? execution.promptId ?? execution.requestId}</strong>
                  <small>{new Date(execution.startedAt).toLocaleString()}</small>
                </div>
                <Badge tone={execution.status === 'success' ? 'success' : execution.status === 'error' ? 'error' : 'info'}>
                  {execution.status}
                </Badge>
              </li>
            )) : <li><div><strong>No executions yet</strong><small>Run a tool or prompt to populate activity.</small></div></li>}
          </ul>
        </Card>
      </section>

      <section className="content-grid">
        <Card className="panel">
          <div className="panel-header">
            <h3>Quick links</h3>
          </div>
          <div className="action-list">
            <Link to={ROUTE_PATHS.executionConsole} className="action-card">
              <span>Open execution console</span>
              <small>Select a server, tool, or prompt and inspect the result.</small>
            </Link>
            <Link to={ROUTE_PATHS.servers} className="action-card">
              <span>Manage servers</span>
              <small>Review connection health and configuration.</small>
            </Link>
            <Link to={ROUTE_PATHS.tools} className="action-card">
              <span>Explore tools</span>
              <small>Inspect tool metadata and run validation checks.</small>
            </Link>
            <Link to={ROUTE_PATHS.logs} className="action-card">
              <span>Review logs</span>
              <small>Monitor execution events and workspace incidents.</small>
            </Link>
          </div>
        </Card>

        <Card className="panel">
          <div className="panel-header">
            <h3>Recent errors</h3>
          </div>
          <ul className="tool-list">
            {recentErrors.length > 0 ? (
              recentErrors.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.level}</strong>
                    <small>{entry.message}</small>
                  </div>
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </li>
              ))
            ) : (
              <li>
                <div>
                  <strong>No errors</strong>
                  <small>No recent error records were captured.</small>
                </div>
              </li>
            )}
          </ul>
        </Card>
      </section>
      <Card className="panel">
        <div className="panel-header"><h3>Recent logs and events</h3></div>
        <ul className="tool-list">
          {recentEvents.length ? recentEvents.map((entry) => <li key={entry.id}><div><strong>{entry.level} · {entry.module ?? 'demo seed'}</strong><small>{entry.message}</small></div><span>{new Date(entry.timestamp).toLocaleTimeString()}</span></li>) : <li><div><strong>No log events</strong><small>Actions in demo mode will be recorded here.</small></div></li>}
        </ul>
      </Card>
    </div>
  )
}
