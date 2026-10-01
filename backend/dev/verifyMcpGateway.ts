type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string; status: number } }

const baseUrl = process.env.MCP_API_URL ?? 'http://127.0.0.1:8787/api'
const stdioServerId = process.env.MCP_TEST_STDIO_SERVER_ID ?? 'local-stdio-test'
const httpServerId = process.env.MCP_TEST_HTTP_SERVER_ID ?? 'local-http-test'
const toolsOnlyServerId = process.env.MCP_TEST_TOOLS_ONLY_SERVER_ID ?? 'local-tools-only-test'
const failedServerId = process.env.MCP_TEST_FAIL_SERVER_ID ?? 'local-fail-test'
const hangingServerId = process.env.MCP_TEST_HANG_SERVER_ID ?? 'local-hang-test'

const request = async <T>(path: string, method = 'GET', body?: unknown): Promise<{ status: number; payload: Envelope<T> }> => {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })
    return { status: response.status, payload: await response.json() as Envelope<T> }
  } catch (error) {
    throw new Error(`${method} ${path} request failed: ${error instanceof Error ? error.message : 'fetch failed'}`, { cause: error })
  }
}

const data = <T>(result: { status: number; payload: Envelope<T> }): T => {
  if (!result.payload.success) throw new Error(`${result.status} ${result.payload.error.code}: ${result.payload.error.message}`)
  return result.payload.data
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const stage = (message: string) => process.stdout.write(`[smoke] ${message}\n`)

const main = async () => {
  stage('health')
  const health = data(await request<{ status: string; mcp: { transportConfigured: boolean; supportedTransports: string[] } }>('/health'))
  assert(health.status === 'ok' && health.mcp.transportConfigured, 'Backend health must report active MCP transport adapters.')

  const stdio = data(await request<{ id: string; connectionStatus: string; metadata?: Record<string, unknown> }>(`/servers/${stdioServerId}/connect`, 'POST'))
  assert(stdio.connectionStatus === 'ready', 'stdio server must initialize and reach ready state.')
  assert(stdio.metadata?.mcpServerName === 'mcpl-tools-local-test-server', 'Server identity should come from MCP initialize response.')

  stage('stdio connect and discovery')
  const tools = data(await request<Array<{ id: string; name: string; inputSchema?: { required?: string[] } }>>(`/servers/${stdioServerId}/tools`))
  assert(tools.some((tool) => tool.name === 'greet'), 'Tool discovery must find greet.')
  const greet = tools.find((tool) => tool.name === 'greet')
  if (!greet) throw new Error('Tool discovery must find greet.')
  assert(greet.inputSchema?.required?.includes('name'), 'Discovered tool schema must retain required input fields.')

  stage('stdio tool execute and input validation')
  const now = new Date().toISOString()
  const execution = data(await request<{ status: string; output?: { content?: Array<{ text?: string }> }; durationMs?: number }>(`/tools/${encodeURIComponent(greet.id)}/execute`, 'POST', {
    id: `smoke-greet-${Date.now()}`,
    kind: 'tool',
    toolId: greet.id,
    serverId: stdioServerId,
    input: { name: 'MCP' },
    createdAt: now,
  }))
  assert(execution.status === 'success' && execution.output?.content?.[0]?.text === 'Hello, MCP!', 'Tool execution should return the real fixture response.')

  stage('stdio resource and prompt capabilities')
  const malformed = await request(`/tools/${encodeURIComponent(greet.id)}/execute`, 'POST', {
    id: `smoke-invalid-${Date.now()}`, toolId: greet.id, serverId: stdioServerId, input: {}, createdAt: new Date().toISOString(),
  })
  assert(malformed.status === 400 && !malformed.payload.success, 'Malformed required tool input should be rejected by the gateway.')

  const resources = data(await request<Array<{ id: string; uri: string }>>(`/servers/${stdioServerId}/resources`))
  assert(resources.length === 1, 'Resource discovery should return the fixture resource.')
  const resourceContent = data(await request<{ text?: string }>(`/resources/${encodeURIComponent(resources[0].id)}/read`, 'POST', {}))
  assert(resourceContent.text === 'MCP fixture is ready.', 'Resource read should return the actual fixture content.')

  stage('timeout normalization')
  const prompts = data(await request<Array<{ id: string; name: string }>>(`/servers/${stdioServerId}/prompts`))
  assert(prompts.some((prompt) => prompt.name === 'greeting_prompt'), 'Prompt discovery should find greeting_prompt.')
  const prompt = prompts.find((item) => item.name === 'greeting_prompt')!
  const promptResult = data(await request<{ status: string; output?: { messages?: unknown[] } }>(`/prompts/${encodeURIComponent(prompt.id)}/execute`, 'POST', {
    id: `smoke-prompt-${Date.now()}`, kind: 'prompt', promptId: prompt.id, input: { name: 'MCP' }, createdAt: new Date().toISOString(),
  }))
  assert(promptResult.status === 'success' && promptResult.output?.messages?.length === 1, 'Prompt retrieval should return the server-produced prompt message.')

  stage('unsupported prompt capability')
  const slow = tools.find((tool) => tool.name === 'slow_echo')!
  const timeoutResult = data(await request<{ status: string; error?: string }>(`/tools/${encodeURIComponent(slow.id)}/execute`, 'POST', {
    id: `smoke-timeout-${Date.now()}`, kind: 'tool', toolId: slow.id, serverId: stdioServerId,
    input: { milliseconds: 3000, message: 'late' }, createdAt: new Date().toISOString(),
  }))
  assert(timeoutResult.status === 'error' && timeoutResult.error?.includes('timed out'), 'Slow tool execution should be normalized as a timeout.')

  stage('startup failure')
  const toolsOnly = data(await request<{ connectionStatus: string }>(`/servers/${toolsOnlyServerId}/connect`, 'POST'))
  assert(toolsOnly.connectionStatus === 'ready', 'Tools-only server should initialize successfully.')
  assert(data(await request<unknown[]>(`/servers/${toolsOnlyServerId}/prompts`)).length === 0, 'Unsupported prompt capability should be represented as an empty catalog.')
  const unsupportedPrompt = await request(`/prompts/${encodeURIComponent(`${toolsOnlyServerId}:prompt:missing`)}/execute`, 'POST', {
    id: `smoke-unsupported-${Date.now()}`, kind: 'prompt', promptId: `${toolsOnlyServerId}:prompt:missing`, input: {}, createdAt: new Date().toISOString(),
  })
  assert(unsupportedPrompt.status === 409 && !unsupportedPrompt.payload.success, 'Unsupported prompt execution should return a clear capability error.')

  stage('streamable HTTP')
  const failedConnection = await request(`/servers/${failedServerId}/connect`, 'POST')
  assert(failedConnection.status === 502 && !failedConnection.payload.success, 'Failed child process startup should become a safe backend error.')

  const http = data(await request<{ connectionStatus: string }>(`/servers/${httpServerId}/connect`, 'POST'))
  assert(http.connectionStatus === 'ready', 'Streamable HTTP MCP server should initialize successfully.')
  const httpTools = data(await request<Array<{ id: string; name: string }>>(`/servers/${httpServerId}/tools`))
  assert(httpTools.some((tool) => tool.name === 'greet'), 'Streamable HTTP discovery should return fixture tools.')
  const httpGreet = httpTools.find((tool) => tool.name === 'greet')!
  const httpExecution = data(await request<{ status: string; output?: { content?: Array<{ text?: string }> } }>(`/tools/${encodeURIComponent(httpGreet.id)}/execute`, 'POST', {
    id: `smoke-http-greet-${Date.now()}`, kind: 'tool', toolId: httpGreet.id, serverId: httpServerId, input: { name: 'HTTP MCP' }, createdAt: new Date().toISOString(),
  }))
  assert(httpExecution.status === 'success' && httpExecution.output?.content?.[0]?.text === 'Hello, HTTP MCP!', 'Streamable HTTP tool calls must reach the MCP server.')
  const httpResources = data(await request<Array<{ id: string }>>(`/servers/${httpServerId}/resources`))
  assert(data(await request<{ text?: string }>(`/resources/${encodeURIComponent(httpResources[0].id)}/read`, 'POST', {})).text === 'MCP fixture is ready.', 'Streamable HTTP resource reads must reach the MCP server.')
  const httpPrompts = data(await request<Array<{ id: string; name: string }>>(`/servers/${httpServerId}/prompts`))
  const httpPrompt = httpPrompts.find((item) => item.name === 'greeting_prompt')
  assert(httpPrompt, 'Streamable HTTP prompt discovery should find greeting_prompt.')
  const httpPromptResult = data(await request<{ status: string }>(`/prompts/${encodeURIComponent(httpPrompt.id)}/execute`, 'POST', {
    id: `smoke-http-prompt-${Date.now()}`, kind: 'prompt', promptId: httpPrompt.id, input: { name: 'HTTP MCP' }, createdAt: new Date().toISOString(),
  }))
  assert(httpPromptResult.status === 'success', 'Streamable HTTP prompt retrieval must reach the MCP server.')

  stage('connection timeout')
  const connectionTimeout = await request(`/servers/${hangingServerId}/connect`, 'POST')
  assert(connectionTimeout.status === 504 && !connectionTimeout.payload.success, `A silent stdio child must be stopped by the connection timeout (got ${connectionTimeout.status}: ${JSON.stringify(connectionTimeout.payload)}).`)

  stage('disconnect and reconnect')
  for (const id of [stdioServerId, toolsOnlyServerId, httpServerId]) {
    stage(`disconnect ${id}`)
    const disconnected = data(await request<{ connectionStatus: string }>(`/servers/${id}/disconnect`, 'POST'))
    assert(disconnected.connectionStatus === 'disconnected', `Disconnect should clean up session ${id}.`)
  }
  stage('reconnect stdio')
  const reconnected = data(await request<{ connectionStatus: string }>(`/servers/${stdioServerId}/connect`, 'POST'))
  assert(reconnected.connectionStatus === 'ready', 'A disconnected stdio MCP server should reconnect cleanly.')
  stage('final disconnect stdio')
  await request(`/servers/${stdioServerId}/disconnect`, 'POST')

  process.stdout.write('MCP gateway smoke test passed: stdio + Streamable HTTP initialize, discovery, tool execution, resource read, prompt retrieval, validation, operation and connection timeout, startup failure, disconnect, and reconnect.\n')
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'MCP gateway smoke test failed.'}\n`)
  process.exitCode = 1
})