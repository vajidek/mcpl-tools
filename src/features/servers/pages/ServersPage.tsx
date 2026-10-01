import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { useAppStore } from '../../../store/appStore'
import { isMCPServerConnected } from '../../../mcp/types/mcp.types'

export function ServersPage() {
  const { servers, isLoading, error } = useServerStore()
  const { preferences } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const filteredServers = useMemo(() => servers.filter((server) => {
    const query = searchTerm.trim().toLowerCase()
    const matchesQuery = !query || `${server.name} ${server.description} ${server.transport} ${server.capabilities.join(' ')}`.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || server.connectionStatus === statusFilter
    return matchesQuery && matchesStatus
  }), [servers, searchTerm, statusFilter])

  useEffect(() => {
    void serverStore.refresh()
  }, [preferences.autoRefresh])

  if (!isLoading && servers.length === 0) {
    return (
      <section className="empty-state">
        <h2>No servers registered</h2>
        <p>Connect a server to begin managing MCP resources and operations.</p>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Servers</p>
          <h2>Managed MCP servers</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void serverStore.refresh()} disabled={isLoading}>
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error} <button type="button" onClick={() => void serverStore.refresh()}>Retry</button></div> : null}

      <div className="page-controls split">
        <label className="field-group"><span className="sr-only">Filter by status</span>
          <select className="text-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="ready">Ready</option>
            <option value="connected">Connected</option>
            <option value="initializing">Initializing</option>
            <option value="disconnected">Disconnected</option>
            <option value="connecting">Connecting</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label className="field-group"><span className="sr-only">Search servers</span>
          <input className="text-input" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search servers, transports, capabilities" />
        </label>
      </div>

      <section className="tool-grid">
        {filteredServers.length === 0 ? <div className="empty-state compact">No servers match these filters.</div> : filteredServers.map((server) => (
          <Card key={server.id} className="tool-card">
            <div className="tool-card-header">
              <div>
                <p className="eyebrow">{server.transport}</p>
                <h3>{server.name}</h3>
              </div>
              <Badge tone={isMCPServerConnected(server.connectionStatus) ? 'success' : server.connectionStatus === 'error' ? 'error' : 'warning'}>
                {server.connectionStatus}
              </Badge>
            </div>

            <p className="tool-description">{server.description}</p>

            <div className="tag-list">
              {server.capabilities.map((capability) => (
                <span key={capability} className="tag-pill">
                  {capability}
                </span>
              ))}
            </div>

            <div className="tool-meta">
              <span>{server.enabled ? 'Enabled' : 'Disabled'}</span>
              <Link to={ROUTE_PATHS.serverDetail.replace(':serverId', server.id)}>View details</Link>
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
