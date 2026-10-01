import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { MCPResource } from '../../../mcp/types/mcp.types'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { ROUTE_PATHS } from '../../../app/config/constants'

export function ResourceDetailPage() {
  const { resourceId = '' } = useParams()
  const [resource, setResource] = useState<MCPResource | undefined>()
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    mcpServiceProvider.getResource(resourceId).then((item) => {
      if (active) setResource(item)
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load resource.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [resourceId])

  if (!resource && isLoading) return <p role="status">Loading resource…</p>
  if (!resource) {
    return (
      <section className="empty-state">
        <h2>Resource not found</h2>
        <p>The requested resource is not currently available.</p>
        <Link to={ROUTE_PATHS.resources}>Return to resources</Link>
      </section>
    )
  }

  const handleReadResource = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await mcpServiceProvider.readResource(resource.id)
      setContent(payload.text ?? 'No content available.')
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to read resource.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Resource</p>
          <h2>{resource.name}</h2>
        </div>
        <Button type="button" variant="secondary" onClick={handleReadResource} disabled={isLoading}>
          {isLoading ? 'Reading…' : 'Read resource'}
        </Button>
      </header>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header">
            <h3>Details</h3>
          </div>
          <dl className="config-list">
            <div>
              <dt>URI</dt>
              <dd>{resource.uri}</dd>
            </div>
            <div>
              <dt>Mime type</dt>
              <dd>{resource.mimeType}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{resource.description ?? 'No description provided.'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="panel">
          <div className="section-header">
            <h3>Content</h3>
          </div>
          {error ? <div className="result-banner result-banner-error">{error}</div> : null}
          {content ? <><div className="result-banner result-banner-success" role="status">Resource content loaded from {mcpServiceProvider.mode === 'demo' ? 'the demo provider.' : 'the backend provider.'}</div><pre className="json-block">{content}</pre></> : <p className="tool-description">No content has been loaded yet.</p>}
        </Card>
      </div>
    </div>
  )
}
