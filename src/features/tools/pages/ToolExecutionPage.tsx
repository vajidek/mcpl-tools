import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { useClipboard } from '../../../hooks/useClipboard'
import { validateToolInput } from '../../../mcp/execution/validateToolInput'
import type { MCPExecutionRequest } from '../../../mcp/types/mcp.types'
import { executionStore, useExecutionStore } from '../../../store/executionStore'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import type { MCPTool } from '../../../mcp/types/mcp.types'

export function ToolExecutionPage() {
  const { toolId = '' } = useParams()
  const [tool, setTool] = useState<MCPTool | undefined>()
  const [loadError, setLoadError] = useState('')
  const [jsonInput, setJsonInput] = useState('{}')
  const [values, setValues] = useState<Record<string, string>>({})
  const [execution, setExecution] = useState<Awaited<ReturnType<typeof executionStore.runTool>> | null>(null)
  const [validationError, setValidationError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const { isRunning, history } = useExecutionStore()
  const copyText = useClipboard()

  useEffect(() => {
    let active = true
    mcpServiceProvider.getTool(toolId).then((item) => {
      if (active) setTool(item)
    }).catch((loadFailure: unknown) => {
      if (active) setLoadError(loadFailure instanceof Error ? loadFailure.message : 'Unable to load tool.')
    })
    return () => { active = false }
  }, [toolId])

  const schemaFields = useMemo(() => {
    if (!tool?.inputSchema?.properties) {
      return [] as Array<{ key: string; required: boolean; type: string }>
    }

    return Object.entries(tool.inputSchema.properties).map(([key, value]) => ({
      key,
      required: tool.inputSchema?.required?.includes(key) ?? false,
      type: typeof value === 'object' && value && 'type' in value ? String((value as { type?: string }).type) : 'string',
    }))
  }, [tool])

  if (!tool && !loadError) return <p role="status">Loading tool…</p>
  if (!tool) {
    return (
      <section className="empty-state">
        <h2>Tool not found</h2>
        <p>{loadError || 'The tool requested for execution is not available from the selected provider.'}</p>
        <Link to={ROUTE_PATHS.tools}>Return to tools</Link>
      </section>
    )
  }

  const coerceField = (type: string, value: string): unknown => {
    if (value === '') return undefined
    if (type === 'number' || type === 'integer') return Number(value)
    if (type === 'boolean') return value === 'true'
    if (type === 'object' || type === 'array') return JSON.parse(value) as unknown
    return value
  }

  const handleFieldChange = (key: string, type: string, value: string) => {
    const nextValues = { ...values, [key]: value }
    setValues(nextValues)
    try {
      const nextInput = Object.fromEntries(Object.entries(nextValues).flatMap(([field, fieldValue]) => {
        const fieldType = field === key ? type : schemaFields.find((item) => item.key === field)?.type ?? 'string'
        const parsed = coerceField(fieldType, fieldValue)
        return parsed === undefined ? [] : [[field, parsed]]
      }))
      setJsonInput(JSON.stringify(nextInput, null, 2))
      setValidationError('')
    } catch {
      setValidationError('Enter valid JSON for object or array fields.')
    }
  }

  const handleExecute = async () => {
    try {
      const parsed: unknown = JSON.parse(jsonInput)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setValidationError('Input must be a JSON object.')
        return
      }
      const parsedInput = parsed as Record<string, unknown>
      const validation = validateToolInput(parsedInput, tool.inputSchema)
      if (!validation.valid) {
        setValidationError(validation.errors.join(' '))
        return
      }
      setValidationError('')
      const request: MCPExecutionRequest = {
        id: `${tool.id}-${Date.now()}`,
        kind: 'tool',
        toolId: tool.id,
        serverId: tool.serverId,
        input: parsedInput,
        createdAt: new Date().toISOString(),
      }
      setExecution(await executionStore.runTool(request))
    } catch (error) {
      setValidationError(error instanceof SyntaxError ? 'The JSON input is malformed.' : error instanceof Error ? error.message : 'Execution failed.')
    }
  }

  const reset = () => {
    setValues({})
    setJsonInput('{}')
    setExecution(null)
    setValidationError('')
    setCopyMessage('')
  }

  const copyResult = async () => {
    const copied = await copyText(JSON.stringify(execution?.output ?? execution, null, 2))
    setCopyMessage(copied ? 'Copied result to clipboard.' : 'Clipboard access is unavailable.')
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Execution</p>
          <h2>{tool.name}</h2>
        </div>
      </header>

      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header">
            <h3>Input</h3>
          </div>

          {schemaFields.length > 0 ? (
            <div className="field-list">
              {schemaFields.map((field) => (
                <label key={field.key} className="field-group">
                  <span>
                    {field.key}
                    {field.required ? ' *' : ''}
                  </span>
                  <input
                    className="text-input"
                    value={values[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field.key, field.type, event.target.value)}
                    placeholder={field.type}
                    type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
                    aria-required={field.required}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <label className="field-group">
            <span>Raw JSON payload</span>
            <textarea
              className="text-area"
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              rows={12}
              aria-label="Tool input JSON"
            />
          </label>

          <div className="inline-actions">
            <Button type="button" onClick={handleExecute} disabled={isRunning}>
              {isRunning ? 'Running…' : 'Execute'}
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={isRunning}>
              Reset
            </Button>
          </div>
          {validationError ? <div className="result-banner result-banner-error" role="alert">{validationError}</div> : null}
        </Card>

        <Card className="panel">
          <div className="section-header">
            <h3>Result</h3>
          </div>
          {execution?.status === 'error' ? <div className="result-banner result-banner-error" role="alert">{execution.error}</div> : null}
          {execution?.status === 'success' ? <div className="result-banner result-banner-success" role="status">Execution completed in {execution.durationMs ?? 0} ms.</div> : null}
          {execution ? <>
            <div className="meta-list">
              <div><span className="meta-label">Execution ID</span><strong>{execution.id}</strong></div>
              <div><span className="meta-label">Started</span><strong>{new Date(execution.startedAt).toLocaleString()}</strong></div>
            </div>
            <h4>Request</h4><pre className="json-block">{JSON.stringify(execution.request, null, 2)}</pre>
            {execution.output !== undefined ? <><h4>Response</h4><pre className="json-block">{JSON.stringify(execution.output, null, 2)}</pre><Button type="button" variant="secondary" onClick={() => void copyResult()}>Copy result</Button></> : null}
            {copyMessage ? <p role="status">{copyMessage}</p> : null}
          </> : <p className="tool-description">No execution result yet.</p>}
        </Card>
      </div>
      <Card className="panel">
        <div className="section-header"><h3>Recent executions for this tool</h3><Link to={ROUTE_PATHS.executions}>Full history</Link></div>
        <ul className="tool-list">
          {history.filter((item) => item.toolId === tool.id).slice(0, 4).map((item) => (
            <li key={item.id}><div><strong>{item.status}</strong><small>{new Date(item.startedAt).toLocaleString()}</small></div><span>{item.durationMs ?? 'n/a'} ms</span></li>
          ))}
          {history.every((item) => item.toolId !== tool.id) ? <li><div><strong>No history yet</strong><small>Successful and failed runs will appear here.</small></div></li> : null}
        </ul>
      </Card>
    </div>
  )
}
