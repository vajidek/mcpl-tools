import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { isMCPServerConnected } from '../../../mcp/types/mcp.types'
import { executionStore, useExecutionStore } from '../../../store/executionStore'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { toolStore, useToolStore } from '../../../store/toolStore'

export function DashboardPage() {
  const { servers } = useServerStore()
  const { tools } = useToolStore()
  const { history } = useExecutionStore()
  const [resourceCount, setResourceCount] = useState(mcpServiceProvider.initialResources.length)

  useEffect(() => {
    let active = true
    void serverStore.refresh()
    void toolStore.refresh()
    void executionStore.refresh()

    void Promise.all([
      mcpServiceProvider.listResources(),
      mcpServiceProvider.health(),
    ]).then(([resources]) => {
      if (active) setResourceCount(resources.length)
    }).catch(() => {
      // The server and tool stores still provide the main dashboard view.
    })

    return () => { active = false }
  }, [])

  const connectedCount = servers.filter((server) => isMCPServerConnected(server.connectionStatus)).length
  const successfulCount = history.filter((item) => item.status === 'success').length
  const failedCount = history.filter((item) => item.status === 'error').length

  const metrics = [
    { label: 'Servers', value: String(servers.length) },
    { label: 'Tools ready', value: String(tools.filter((tool) => tool.available).length) },
    { label: 'Executions', value: String(history.length) },
    { label: 'Errors', value: String(failedCount) },
  ]

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Simple MCP workspace</h2>
        </div>
        <Badge tone={connectedCount > 0 ? 'success' : 'warning'}>
          {connectedCount > 0 ? `${connectedCount} server connected` : 'No server connected'}
        </Badge>
      </header>

      <Card className="panel">
        <div className="section-header">
          <div>
            <h3>Ready to use</h3>
            <p className="tool-description">Use the built-in utilities now, or connect your own MCP server later from Settings.</p>
          </div>
          <span className="tool-description">{resourceCount} resource{resourceCount === 1 ? '' : 's'}</span>
        </div>
        <div className="action-list">
          <Link to={ROUTE_PATHS.tools} className="action-card">
            <span>Open Tools</span>
            <small>Format JSON, encode text, hash strings, test regex, and more.</small>
          </Link>
          <Link to={ROUTE_PATHS.servers} className="action-card">
            <span>Manage Servers</span>
            <small>Connect and check the MCP servers used by this workspace.</small>
          </Link>
          <Link to={ROUTE_PATHS.executions} className="action-card">
            <span>View Executions</span>
            <small>Review previous tool runs and their results.</small>
          </Link>
        </div>
      </Card>

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
                  <small>{server.description}</small>
                </div>
                <Badge tone={isMCPServerConnected(server.connectionStatus) ? 'success' : server.connectionStatus === 'error' ? 'error' : 'warning'}>
                  {isMCPServerConnected(server.connectionStatus) ? 'Connected' : server.connectionStatus}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="panel">
          <div className="panel-header">
            <h3>Recent executions</h3>
          </div>
          <ul className="tool-list">
            {history.slice(0, 5).map((execution) => (
              <li key={execution.id}>
                <div>
                  <strong>{execution.toolName ?? execution.toolId ?? 'Execution'}</strong>
                  <small>{new Date(execution.startedAt).toLocaleString()}</small>
                </div>
                <Badge tone={execution.status === 'success' ? 'success' : 'error'}>
                  {execution.status}
                </Badge>
              </li>
            ))}
            {history.length === 0 ? (
              <li>
                <div>
                  <strong>No executions yet</strong>
                  <small>Choose a tool to run your first operation.</small>
                </div>
              </li>
            ) : null}
          </ul>
          {history.length > 0 ? <p className="tool-description">{successfulCount} successful, {failedCount} failed</p> : null}
        </Card>
      </section>
    </div>
  )
}
