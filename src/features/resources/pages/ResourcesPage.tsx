import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { ROUTE_PATHS } from '../../../app/config/constants'
import type { MCPResource } from '../../../mcp/types/mcp.types'
import { useAppStore } from '../../../store/appStore'

export function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [mimeType, setMimeType] = useState('all')
  const [resources, setResources] = useState<MCPResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { preferences } = useAppStore()
  const refresh = async () => {
    setIsLoading(true)
    setError('')
    try {
      setResources(await mcpServiceProvider.listResources())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to discover resources.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!preferences.autoRefresh) return
    let isCurrent = true
    mcpServiceProvider.listResources().then((items) => {
      if (isCurrent) setResources(items)
    }).catch((loadError: unknown) => {
      if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Unable to discover resources.')
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })
    return () => { isCurrent = false }
  }, [preferences.autoRefresh])

  const filteredResources = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return resources.filter((resource) => {
      const matchesQuery = !normalized || `${resource.name} ${resource.uri} ${resource.description ?? ''}`.toLowerCase().includes(normalized)
      return matchesQuery && (mimeType === 'all' || resource.mimeType === mimeType)
    })
  }, [resources, searchTerm, mimeType])
  const mimeTypes = [...new Set(resources.map((resource) => resource.mimeType))]
  const isDiscovering = isLoading || (preferences.autoRefresh && resources.length === 0 && !error)

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Resources</p>
          <h2>Available resources</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={isLoading}>{isLoading ? 'Refreshing…' : 'Refresh'}</Button>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry</button></div> : null}

      <div className="page-controls split">
        <select aria-label="Filter resources by media type" className="text-input" value={mimeType} onChange={(event) => setMimeType(event.target.value)}>
          <option value="all">All media types</option>
          {mimeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input
          className="text-input"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search resources"
          placeholder="Search resources by name or URI"
        />
      </div>

      <section className="tool-grid">
        {isDiscovering ? <p role="status">Discovering resources…</p> : filteredResources.length === 0 ? (
          <div className="empty-state compact">No resources match the current filter.</div>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="tool-card">
              <div className="tool-card-header">
                <div>
                  <p className="eyebrow">{resource.mimeType}</p>
                  <h3>{resource.name}</h3>
                </div>
              </div>
              <p className="tool-description">{resource.uri}</p>
              <div className="tool-meta">
                <span>{resource.description ?? 'No description'}</span>
                <Link to={ROUTE_PATHS.resourceDetail.replace(':resourceId', resource.id)}>Open</Link>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
