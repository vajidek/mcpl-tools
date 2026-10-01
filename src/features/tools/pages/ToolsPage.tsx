import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { toolStore, useToolStore } from '../../../store/toolStore'
import { useAppStore } from '../../../store/appStore'

export function ToolsPage() {
  const { tools, isLoading, error } = useToolStore()
  const { servers } = useServerStore()
  const { preferences } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')
  const [serverId, setServerId] = useState('all')
  const categories = [...new Set(tools.map((tool) => tool.category))]
  const filteredTools = useMemo(() => tools.filter((tool) => {
    const query = searchTerm.trim().toLowerCase()
    const matchesQuery = !query || `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`.toLowerCase().includes(query)
    return matchesQuery && (category === 'all' || tool.category === category) && (serverId === 'all' || tool.serverId === serverId)
  }), [tools, searchTerm, category, serverId])

  useEffect(() => {
    if (preferences.autoRefresh) {
      void toolStore.refresh()
      void serverStore.refresh()
    }
  }, [preferences.autoRefresh])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tools</p>
          <h2>Tool explorer</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void toolStore.refresh()} disabled={isLoading}>
          {isLoading ? 'Discovering…' : 'Discover tools'}
        </Button>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error} <button type="button" onClick={() => void toolStore.refresh()}>Retry</button></div> : null}
      <div className="page-controls split">
        <select aria-label="Filter tools by category" className="text-input" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filter tools by server" className="text-input" value={serverId} onChange={(event) => setServerId(event.target.value)}>
          <option value="all">All servers</option>
          {servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}
        </select>
        <input
          className="text-input"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search tools"
          placeholder="Search tools by name, tag, or description"
        />
      </div>

      <section className="tool-grid">
        {isLoading && tools.length === 0 ? <p role="status">Discovering tools…</p> : filteredTools.length === 0 ? (
          <div className="empty-state compact">No tools match the current filters.</div>
        ) : (
          filteredTools.map((tool) => (
            <Card key={tool.id} className="tool-card">
              <div className="tool-card-header">
                <div>
                  <p className="eyebrow">{tool.category}</p>
                  <h3>{tool.name}</h3>
                </div>
                <Badge tone={tool.available ? 'success' : 'warning'}>{tool.available ? 'available' : 'offline'}</Badge>
              </div>
              <p className="tool-description">{tool.description}</p>
              <div className="tag-list">
                {tool.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="tool-meta">
                <span>{tool.serverId}</span>
                <div className="inline-actions">
                  <Link to={ROUTE_PATHS.toolDetail.replace(':toolId', tool.id)}>Details</Link>
                  <Link to={ROUTE_PATHS.toolExecute.replace(':toolId', tool.id)}>Run</Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
