import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { MCPTool } from '../../../mcp/types/mcp.types'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { ROUTE_PATHS } from '../../../app/config/constants'

export function ToolDetailPage() {
  const { toolId = '' } = useParams()
  const [tool, setTool] = useState<MCPTool | undefined>()
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    mcpServiceProvider.getTool(toolId).then((item) => {
      if (active) setTool(item)
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load tool.')
    })
    return () => { active = false }
  }, [toolId])

  const schemaSummary = useMemo(() => {
    if (!tool?.inputSchema?.properties) {
      return []
    }

    return Object.entries(tool.inputSchema.properties).map(([key, value]) => ({
      key,
      required: tool.inputSchema?.required?.includes(key) ?? false,
      type: typeof value === 'object' && value && 'type' in value ? String((value as { type?: string }).type) : 'string',
      description: typeof value === 'object' && value && 'description' in value ? String((value as { description?: string }).description ?? '') : '',
    }))
  }, [tool])

  if (!tool && !loadError) return <p role="status">Loading tool…</p>
  if (!tool) {
    return (
      <section className="empty-state">
        <h2>Tool not found</h2>
        <p>{loadError || 'The requested tool is not available from the selected provider.'}</p>
        <Link to={ROUTE_PATHS.tools}>Return to tool catalog</Link>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tool</p>
          <h2>{tool.name}</h2>
        </div>
        <Link to={ROUTE_PATHS.toolExecute.replace(':toolId', tool.id)} className="button-link">
          <Button type="button">Execute tool</Button>
        </Link>
      </header>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header">
            <h3>Metadata</h3>
            <Badge tone={tool.available ? 'success' : 'warning'}>{tool.available ? 'available' : 'offline'}</Badge>
          </div>

          <p className="tool-description">{tool.description}</p>

          <div className="meta-list">
            <div>
              <span className="meta-label">Category</span>
              <strong>{tool.category}</strong>
            </div>
            <div>
              <span className="meta-label">Server</span>
              <strong>{tool.serverId}</strong>
            </div>
          </div>

          <div className="tag-list">
            {tool.tags.map((tag) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        </Card>

        <Card className="panel">
          <div className="section-header">
            <h3>Input schema</h3>
          </div>
          {schemaSummary.length === 0 ? (
            <p className="tool-description">This tool does not declare a structured input schema.</p>
          ) : (
            <div className="field-list compact">
              {schemaSummary.map((field) => (
                <div key={field.key} className="field-row">
                  <span>{field.key}</span>
                  <small>{field.type}</small>
                  <em>{field.required ? 'required' : 'optional'}</em>
                  {field.description ? <small>{field.description}</small> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
