import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import type { MCPTool } from '../../../mcp/types/mcp.types'

export function ServerDetailPage() {
  const { serverId = '' } = useParams()
  const { servers, isLoading, error: storeError } = useServerStore()
  const server = servers.find((item) => item.id === serverId)
  const [tools, setTools] = useState<MCPTool[]>([])
  const [toolsError, setToolsError] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!server) void serverStore.refresh()
  }, [server])

  useEffect(() => {
    let active = true
    mcpServiceProvider.listTools(serverId).then((items) => {
      if (active) setTools(items)
    }).catch((loadError: unknown) => {
      if (active) setToolsError(loadError instanceof Error ? loadError.message : 'Unable to discover server tools.')
    })
    return () => { active = false }
  }, [serverId])

  if (!server && isLoading) return <p role="status">Loading server…</p>
  if (!server) {
    return (
      <section className="empty-state">
        <h2>Server not found</h2>
        <p>The requested server could not be located.</p>
        <Link to={ROUTE_PATHS.servers}>Return to server list</Link>
      </section>
    )
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setActionError('')
    try {
      const result = await serverStore.testConnection(server.id)
      if (result.success) setConnectionMessage(result.message)
      else setActionError(result.message)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Connection test failed.')
    } finally {
      setIsTesting(false)
    }
  }

  const handleConnectionChange = async () => {
    setActionError('')
    setConnectionMessage('')
    try {
      const updated = server.connectionStatus === 'connected'
        ? await serverStore.disconnect(server.id)
        : await serverStore.connect(server.id)
      setConnectionMessage(mcpServiceProvider.mode === 'demo'
        ? `Demo server is now ${updated.connectionStatus}. No external MCP server was contacted.`
        : `Backend reports server status: ${updated.connectionStatus}.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update server connection.')
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Server</p>
          <h2>{server.name}</h2>
        </div>
        <div className="inline-actions">
          <Button type="button" onClick={() => void handleConnectionChange()} disabled={server.connectionStatus === 'connecting'}>
            {server.connectionStatus === 'connected' ? 'Disconnect' : server.connectionStatus === 'connecting' ? 'Connecting…' : 'Connect'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? 'Testing…' : 'Test connection'}
          </Button>
        </div>
      </header>

      {connectionMessage ? <div className="result-banner result-banner-success" role="status">{connectionMessage}</div> : null}
      {actionError || storeError ? <div className="result-banner result-banner-error" role="alert">{actionError || storeError}</div> : null}
      <p className="demo-note">{mcpServiceProvider.mode === 'demo' ? 'Demo mode: connection actions update local simulated state only.' : 'API mode: connection actions are delegated to the backend MCP gateway.'}</p>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header">
            <h3>Overview</h3>
            <Badge tone={server.connectionStatus === 'connected' ? 'success' : server.connectionStatus === 'error' ? 'error' : 'warning'}>
              {server.connectionStatus}
            </Badge>
          </div>

          <p className="tool-description">{server.description}</p>

          <div className="meta-list">
            <div>
              <span className="meta-label">Transport</span>
              <strong>{server.transport}</strong>
            </div>
            <div>
              <span className="meta-label">Enabled</span>
              <strong>{server.enabled ? 'Active' : 'Disabled'}</strong>
            </div>
            <div>
              <span className="meta-label">Base URL</span>
              <strong>{server.baseUrl ?? 'local runtime'}</strong>
            </div>
          </div>

          <div className="tag-list">
            {server.capabilities.map((capability) => (
              <span key={capability} className="tag-pill">{capability}</span>
            ))}
          </div>
        </Card>

        <Card className="panel">
          <div className="section-header">
            <h3>Configuration</h3>
          </div>
          <dl className="config-list">
            <div>
              <dt>Server ID</dt>
              <dd>{server.id}</dd>
            </div>
            <div>
              <dt>Connection state</dt>
              <dd>{server.connectionStatus}</dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd>{server.capabilities.join(', ')}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="panel">
        <div className="section-header">
          <h3>Discovered tools</h3>
        </div>
        <ul className="tool-list">
          {toolsError ? <li role="alert">{toolsError}</li> : null}
          {tools.length ? tools.map((tool) => (
            <li key={tool.id}>
              <div>
                <strong>{tool.name}</strong>
                <small>{tool.description}</small>
              </div>
              <Link to={ROUTE_PATHS.toolDetail.replace(':toolId', tool.id)}>Open</Link>
            </li>
          )) : <li><div><strong>No tools discovered</strong><small>No tools are currently available from the selected provider.</small></div></li>}
        </ul>
      </Card>
      <Card className="panel">
        <div className="section-header"><h3>Available catalogs</h3></div>
        <div className="inline-actions">
          <Link to={ROUTE_PATHS.resources}>Browse resources</Link>
          <Link to={ROUTE_PATHS.prompts}>Browse prompts</Link>
        </div>
        <p className="tool-description">The demo fixture does not associate resources or prompts with individual servers.</p>
      </Card>
    </div>
  )
}
