import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { MCPPrompt } from '../../../mcp/types/mcp.types'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { executionStore, useExecutionStore } from '../../../store/executionStore'

export function PromptDetailPage() {
  const { promptId = '' } = useParams()
  const [prompt, setPrompt] = useState<MCPPrompt | undefined>()
  const [argumentsMap, setArgumentsMap] = useState<Record<string, string>>({})
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const { isRunning } = useExecutionStore()

  useEffect(() => {
    let active = true
    mcpServiceProvider.getPrompt(promptId).then((item) => {
      if (active) setPrompt(item)
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load prompt.')
    })
    return () => { active = false }
  }, [promptId])

  const promptArguments = useMemo(() => prompt?.arguments ?? [], [prompt])

  if (!prompt && !error) return <p role="status">Loading prompt…</p>
  if (!prompt) {
    return (
      <section className="empty-state">
        <h2>Prompt not found</h2>
        <p>The requested prompt is not available in the current catalog.</p>
        <Link to={ROUTE_PATHS.prompts}>Return to prompts</Link>
      </section>
    )
  }

  const handleFieldChange = (name: string, value: string) => {
    setArgumentsMap((current) => ({ ...current, [name]: value }))
  }

  const handleRender = async () => {
    setError('')
    setResult('')

    try {
      const execution = await executionStore.runPrompt({
        id: `prompt-${prompt.id}-${Date.now()}`,
        kind: 'prompt',
        promptId: prompt.id,
        input: argumentsMap,
        createdAt: new Date().toISOString(),
      })
      if (execution.status === 'error') setError(execution.error ?? 'Prompt rendering failed.')
      else setResult(typeof execution.output === 'object' && execution.output && 'text' in execution.output ? String(execution.output.text) : JSON.stringify(execution.output, null, 2))
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : 'Unable to render prompt.')
    }
  }

  const reset = () => {
    setArgumentsMap({})
    setResult('')
    setError('')
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Prompt</p>
          <h2>{prompt.name}</h2>
        </div>
      </header>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header">
            <h3>Definition</h3>
          </div>
          <p className="tool-description">{prompt.description}</p>

          {promptArguments.length === 0 ? (
            <p className="tool-description">This prompt does not require any arguments.</p>
          ) : (
            <div className="field-list">
              {promptArguments.map((argument) => (
                <label key={argument.name} className="field-group">
                  <span>{argument.name} <small>{argument.required ? 'required' : 'optional'}</small></span>
                  <input
                    className="text-input"
                    value={argumentsMap[argument.name] ?? ''}
                    onChange={(event) => handleFieldChange(argument.name, event.target.value)}
                    placeholder={argument.description ?? argument.name}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="inline-actions">
            <Button type="button" onClick={handleRender} disabled={isRunning}>
              {isRunning ? 'Using prompt…' : 'Use prompt'}
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={isRunning}>Reset</Button>
            <Link to={ROUTE_PATHS.executions}>Execution history</Link>
          </div>
        </Card>

        <Card className="panel">
          <div className="section-header">
            <h3>Output</h3>
          </div>
          {error ? <div className="result-banner result-banner-error">{error}</div> : null}
          {result ? <><div className="result-banner result-banner-success" role="status">Prompt rendered and saved to execution history.</div><pre className="json-block">{result}</pre></> : <p className="tool-description">No rendered output yet.</p>}
        </Card>
      </div>
    </div>
  )
}
