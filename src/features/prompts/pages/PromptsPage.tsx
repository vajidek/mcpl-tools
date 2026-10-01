import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { ROUTE_PATHS } from '../../../app/config/constants'
import type { MCPPrompt } from '../../../mcp/types/mcp.types'
import { useAppStore } from '../../../store/appStore'

export function PromptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [allPrompts, setPrompts] = useState<MCPPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { preferences } = useAppStore()
  const refresh = async () => {
    setIsLoading(true)
    setError('')
    try {
      setPrompts(await mcpServiceProvider.listPrompts())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to discover prompts.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!preferences.autoRefresh) return
    let isCurrent = true
    mcpServiceProvider.listPrompts().then((items) => {
      if (isCurrent) setPrompts(items)
    }).catch((loadError: unknown) => {
      if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Unable to discover prompts.')
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })
    return () => { isCurrent = false }
  }, [preferences.autoRefresh])

  const filteredPrompts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    return allPrompts.filter((prompt) => {
      return !normalized || `${prompt.name} ${prompt.description} ${(prompt.arguments ?? []).map((argument) => `${argument.name} ${argument.description ?? ''}`).join(' ')}`.toLowerCase().includes(normalized)
    })
  }, [allPrompts, searchTerm])
  const isDiscovering = isLoading || (preferences.autoRefresh && allPrompts.length === 0 && !error)

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Prompts</p>
          <h2>Prompt catalog</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={isLoading}>{isLoading ? 'Discovering…' : 'Discover prompts'}</Button>
      </header>

      {error ? <div className="result-banner result-banner-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry</button></div> : null}

      <div className="page-controls">
        <input
          className="text-input"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search prompts"
          placeholder="Search prompts by name or argument"
        />
      </div>

      <section className="tool-grid">
        {isDiscovering ? <p role="status">Discovering prompts…</p> : filteredPrompts.length === 0 ? (
          <div className="empty-state compact">No prompts match the current filter.</div>
        ) : (
          filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="tool-card">
              <div className="tool-card-header">
                <div>
                  <p className="eyebrow">Prompt</p>
                  <h3>{prompt.name}</h3>
                </div>
              </div>
              <p className="tool-description">{prompt.description}</p>
              <div className="tool-meta">
                <span>{prompt.arguments?.length ?? 0} args</span>
                <Link to={ROUTE_PATHS.promptDetail.replace(':promptId', prompt.id)}>Use prompt</Link>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
