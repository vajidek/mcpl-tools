import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useClipboard } from '../../../hooks/useClipboard'
import { validateToolInput } from '../../../mcp/execution/validateToolInput'
import type { MCPExecutionRequest, MCPPrompt, MCPTool } from '../../../mcp/types/mcp.types'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { executionStore, useExecutionStore } from '../../../store/executionStore'
import { serverStore, useServerStore } from '../../../store/serverStore'
import { toolStore, useToolStore } from '../../../store/toolStore'

type InputField = { name: string; type: string; description: string; required: boolean }

const getToolFields = (tool?: MCPTool): InputField[] => Object.entries(tool?.inputSchema?.properties ?? {}).map(([name, definition]) => {
  const schema = typeof definition === 'object' && definition !== null ? definition as Record<string, unknown> : {}
  return {
    name,
    type: typeof schema.type === 'string' ? schema.type : 'string',
    description: typeof schema.description === 'string' ? schema.description : '',
    required: tool?.inputSchema?.required?.includes(name) ?? false,
  }
})

const getPromptFields = (prompt?: MCPPrompt): InputField[] => (prompt?.arguments ?? []).map((argument) => ({
  name: argument.name,
  type: 'string',
  description: argument.description ?? '',
  required: argument.required ?? false,
}))

export function ExecutionConsolePage() {
  const { servers } = useServerStore()
  const { tools } = useToolStore()
  const [prompts, setPrompts] = useState<MCPPrompt[]>(mcpServiceProvider.initialPrompts)
  const [catalogError, setCatalogError] = useState('')
  const [kind, setKind] = useState<'tool' | 'prompt'>('tool')
  const [serverId, setServerId] = useState(mcpServiceProvider.initialServers[0]?.id ?? '')
  const [toolId, setToolId] = useState(mcpServiceProvider.initialTools[0]?.id ?? '')
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? '')
  const [values, setValues] = useState<Record<string, string>>({})
  const [jsonInput, setJsonInput] = useState('{}')
  const [validationError, setValidationError] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof executionStore.runTool>> | null>(null)
  const [copyFeedback, setCopyFeedback] = useState('')
  const { isRunning } = useExecutionStore()
  const copy = useClipboard()
  const selectedTool = tools.find((tool) => tool.id === toolId && tool.serverId === serverId)
  const selectedPrompt = prompts.find((prompt) => prompt.id === promptId)
  const fields = kind === 'tool' ? getToolFields(selectedTool) : getPromptFields(selectedPrompt)
  const availableTools = tools.filter((tool) => tool.serverId === serverId)

  useEffect(() => {
    let active = true
    Promise.all([serverStore.refresh(), toolStore.refresh(), mcpServiceProvider.listPrompts()]).then(([loadedServers, loadedTools, loadedPrompts]) => {
      if (!active) return
      setServerId((current) => current || loadedServers[0]?.id || '')
      setToolId((current) => current || loadedTools[0]?.id || '')
      setPrompts(loadedPrompts)
      setCatalogError('')
    }).catch((error: unknown) => {
      if (active) setCatalogError(error instanceof Error ? error.message : 'Unable to load execution catalogs.')
    })
    return () => { active = false }
  }, [])

  const selectServer = (nextServerId: string) => {
    setServerId(nextServerId)
    setToolId(tools.find((tool) => tool.serverId === nextServerId)?.id ?? '')
    reset()
  }

  const reset = () => {
    setValues({})
    setJsonInput('{}')
    setResult(null)
    setValidationError('')
    setCopyFeedback('')
  }

  const handleFieldChange = (field: InputField, value: string) => {
    const next = { ...values, [field.name]: value }
    setValues(next)
    try {
      const input = Object.fromEntries(Object.entries(next).flatMap(([name, raw]) => {
        const type = fields.find((item) => item.name === name)?.type ?? 'string'
        if (raw === '') return []
        if (type === 'number' || type === 'integer') return [[name, Number(raw)]]
        if (type === 'boolean') return [[name, raw === 'true']]
        if (type === 'object' || type === 'array') return [[name, JSON.parse(raw) as unknown]]
        return [[name, raw]]
      }))
      setJsonInput(JSON.stringify(input, null, 2))
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
      const input = parsed as Record<string, unknown>
      if (kind === 'tool') {
        if (!selectedTool) {
          setValidationError('Select a tool belonging to the selected server.')
          return
        }
        const validation = validateToolInput(input, selectedTool.inputSchema)
        if (!validation.valid) {
          setValidationError(validation.errors.join(' '))
          return
        }
      } else {
        if (!selectedPrompt) {
          setValidationError('Select a prompt to use.')
          return
        }
        const missing = (selectedPrompt.arguments ?? []).filter((argument) => argument.required && (input[argument.name] === undefined || String(input[argument.name]).trim() === '')).map((argument) => argument.name)
        if (missing.length) {
          setValidationError(`Missing required field(s): ${missing.join(', ')}`)
          return
        }
      }
      setValidationError('')
      const createdAt = new Date().toISOString()
      const request: MCPExecutionRequest = {
        id: `${kind}-${createdAt}`,
        kind,
        ...(kind === 'tool' ? { toolId: selectedTool?.id, serverId, input } : { promptId: selectedPrompt?.id, input }),
        createdAt,
      }
      setResult(kind === 'tool' ? await executionStore.runTool(request) : await executionStore.runPrompt(request))
    } catch (error) {
      setValidationError(error instanceof SyntaxError ? 'The JSON input is malformed.' : error instanceof Error ? error.message : 'Execution failed.')
    }
  }

  const copyResult = async () => {
    const copied = await copy(JSON.stringify(result?.output ?? result, null, 2))
    setCopyFeedback(copied ? 'Copied result.' : 'Clipboard access is unavailable.')
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">Execution</p><h2>Execution console</h2></div>
        <Link to={ROUTE_PATHS.executions}>Execution history</Link>
      </header>
      <p className="demo-note">{mcpServiceProvider.mode === 'demo' ? 'Demo mode: requests are evaluated by local fixtures.' : 'API mode: requests are sent to the backend. MCP transport must be configured server-side.'}</p>
      {catalogError ? <div className="result-banner result-banner-error" role="alert">{catalogError}</div> : null}
      <div className="detail-grid">
        <Card className="panel">
          <div className="section-header"><h3>Request</h3></div>
          <div className="field-list">
            <label className="field-group"><span>Operation</span>
              <select className="text-input" value={kind} onChange={(event) => { setKind(event.target.value as 'tool' | 'prompt'); reset() }}><option value="tool">Tool</option><option value="prompt">Prompt</option></select>
            </label>
            {kind === 'tool' ? <>
              <label className="field-group"><span>Server</span>
                <select className="text-input" value={serverId} onChange={(event) => selectServer(event.target.value)}>{servers.map((server) => <option key={server.id} value={server.id}>{server.name} ({server.connectionStatus})</option>)}</select>
              </label>
              <label className="field-group"><span>Tool</span>
                <select className="text-input" value={toolId} onChange={(event) => { setToolId(event.target.value); reset() }}>{availableTools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name}</option>)}</select>
              </label>
              {selectedTool ? <p className="tool-description">{selectedTool.description}</p> : <p className="tool-description">No tools are available for this server.</p>}
            </> : <>
              <label className="field-group"><span>Prompt</span>
                <select className="text-input" value={promptId} onChange={(event) => { setPromptId(event.target.value); reset() }}>{prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.name}</option>)}</select>
              </label>
              {selectedPrompt ? <p className="tool-description">{selectedPrompt.description}</p> : <p className="tool-description">No prompts are available.</p>}
              <p className="tool-description">Prompts in this demo are not associated with a specific server.</p>
            </>}
            {fields.map((field) => <label className="field-group" key={field.name}>
              <span>{field.name} {field.required ? '(required)' : '(optional)'}</span>
              {field.type === 'boolean' ? <select className="text-input" value={values[field.name] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)}><option value="">Choose…</option><option value="true">True</option><option value="false">False</option></select> : <input className="text-input" type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'} aria-required={field.required} value={values[field.name] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)} placeholder={field.description || field.type} />}
            </label>)}
            <label className="field-group"><span>Raw JSON input</span><textarea className="text-area" aria-label="Execution input JSON" rows={10} value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} /></label>
            {validationError ? <div className="result-banner result-banner-error" role="alert">{validationError}</div> : null}
            <div className="inline-actions"><Button type="button" onClick={handleExecute} disabled={isRunning || (kind === 'tool' ? !selectedTool : !selectedPrompt)}>{isRunning ? 'Running…' : kind === 'tool' ? 'Execute tool' : 'Use prompt'}</Button><Button type="button" variant="secondary" onClick={reset} disabled={isRunning}>Reset</Button></div>
          </div>
        </Card>
        <Card className="panel">
          <div className="section-header"><h3>Result</h3></div>
          {!result ? <p className="tool-description">No request has been executed yet.</p> : <>
            {result.status === 'error' ? <div className="result-banner result-banner-error" role="alert">{result.error}</div> : <div className="result-banner result-banner-success" role="status">Completed in {result.durationMs ?? 0} ms.</div>}
            <div className="meta-list"><div><span className="meta-label">Execution ID</span><strong>{result.id}</strong></div><div><span className="meta-label">Timestamp</span><strong>{new Date(result.startedAt).toLocaleString()}</strong></div><div><span className="meta-label">Duration</span><strong>{result.durationMs ?? 'n/a'} ms</strong></div></div>
            <h4>Request</h4><pre className="json-block">{JSON.stringify(result.request, null, 2)}</pre>
            {result.output !== undefined ? <><h4>Response</h4><pre className="json-block">{JSON.stringify(result.output, null, 2)}</pre><Button type="button" variant="secondary" onClick={() => void copyResult()}>Copy result</Button></> : null}
            {copyFeedback ? <p role="status">{copyFeedback}</p> : null}
          </>}
        </Card>
      </div>
    </div>
  )
}