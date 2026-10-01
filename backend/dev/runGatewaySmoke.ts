import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const fixturePath = resolve(scriptDirectory, 'mcpTestServer.js')
const apiPath = resolve(scriptDirectory, '../src/server.js')
const verifierPath = resolve(scriptDirectory, 'verifyMcpGateway.js')
const rootPath = resolve(scriptDirectory, '../../../..')

const getFreePort = async (): Promise<number> => new Promise((resolvePort, reject) => {
  const probe = createServer()
  probe.once('error', reject)
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address()
    if (!address || typeof address === 'string') {
      probe.close()
      reject(new Error('Unable to allocate a local test port.'))
      return
    }
    const { port } = address
    probe.close((error) => error ? reject(error) : resolvePort(port))
  })
})

const start = (file: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess => {
  const child = spawn(process.execPath, [file, ...args], { cwd: rootPath, env, stdio: ['ignore', 'pipe', 'pipe'] })
  let diagnostics = ''
  child.stdout?.on('data', (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8000) })
  child.stderr?.on('data', (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8000) })
  child.on('error', (error) => { diagnostics = `${diagnostics}\n${error.message}`.slice(-8000) })
  Object.assign(child, { diagnostics: () => diagnostics })
  return child
}

const diagnosticsOf = (child: ChildProcess) => (child as ChildProcess & { diagnostics?: () => string }).diagnostics?.() ?? ''

const waitFor = async (predicate: () => Promise<boolean>, label: string, child: ChildProcess, timeoutMs = 12_000) => {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} exited early (${child.exitCode}). ${diagnosticsOf(child)}`)
    try {
      if (await predicate()) return
    } catch (error) {
      lastError = error
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  throw new Error(`${label} did not become ready. ${lastError instanceof Error ? lastError.message : ''}\n${diagnosticsOf(child)}`)
}

const stop = async (child: ChildProcess | undefined) => {
  if (!child || child.exitCode !== null || child.killed) return
  child.kill('SIGTERM')
  await Promise.race([
    new Promise<void>((resolveExit) => child.once('exit', () => resolveExit())),
    new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 2500)),
  ])
  if (child.exitCode === null) child.kill('SIGKILL')
}

const main = async () => {
  const httpPort = await getFreePort()
  const apiPort = await getFreePort()
  const command = process.execPath
  const fixtureUrl = `${rootPath.replace(/\\/g, '/')}/backend/dist/backend/dev/mcpTestServer.js`
  const server = (id: string, name: string, args: string[], connectionTimeoutMs = 5000, requestTimeoutMs = 4000) => ({
    id,
    name,
    description: 'Deterministic local MCP integration fixture.',
    transport: 'stdio',
    command,
    args: [fixtureUrl, ...args],
    capabilities: [],
    enabled: true,
    connectionTimeoutMs,
    requestTimeoutMs,
  })

  const servers = [
    server('local-stdio-test', 'Local SDK MCP Test', [], 5000, 1500),
    {
      id: 'local-http-test',
      name: 'Local HTTP MCP Test',
      description: 'Deterministic local Streamable HTTP fixture.',
      transport: 'http',
      baseUrl: `http://127.0.0.1:${httpPort}/mcp`,
      capabilities: [],
      enabled: true,
      connectionTimeoutMs: 5000,
      requestTimeoutMs: 5000,
    },
    server('local-tools-only-test', 'Local Tools Only Test', ['--tools-only'], 5000, 3000),
    server('local-fail-test', 'Startup Failure Fixture', ['--fail-start'], 3000, 3000),
    {
      id: 'local-hang-test',
      name: 'Initialization Timeout Fixture',
      description: 'A silent allowlisted stdio child for timeout cleanup testing.',
      transport: 'stdio',
      command,
      args: ['-e', 'process.stdin.resume(); setInterval(() => undefined, 60000)'],
      capabilities: [],
      enabled: true,
      connectionTimeoutMs: 2500,
      requestTimeoutMs: 2500,
    },
  ]

  const commonEnv = { ...process.env, MCP_TEST_HTTP_PORT: String(httpPort) }
  let fixture: ChildProcess | undefined
  let api: ChildProcess | undefined
  try {
    fixture = start(fixturePath, ['--http'], commonEnv)
    await waitFor(async () => {
      try {
        await fetch(`http://127.0.0.1:${httpPort}/mcp`, { signal: AbortSignal.timeout(300) })
        return true
      } catch {
        return false
      }
    }, 'HTTP MCP fixture', fixture)

    const allowedHosts = `127.0.0.1:${httpPort}`
    const apiEnv: NodeJS.ProcessEnv = {
      ...commonEnv,
      HOST: '127.0.0.1',
      PORT: String(apiPort),
      MCP_SERVERS_JSON: JSON.stringify(servers),
      MCP_ALLOWED_COMMANDS: command,
      MCP_ALLOWED_HOSTS: allowedHosts,
      MCP_TEST_STDIO_SERVER_ID: 'local-stdio-test',
      MCP_TEST_HTTP_SERVER_ID: 'local-http-test',
      MCP_TEST_TOOLS_ONLY_SERVER_ID: 'local-tools-only-test',
      MCP_TEST_FAIL_SERVER_ID: 'local-fail-test',
      MCP_TEST_HANG_SERVER_ID: 'local-hang-test',
    }
    api = start(apiPath, [], apiEnv)
    const baseUrl = `http://127.0.0.1:${apiPort}/api`
    await waitFor(async () => {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(500) })
      return response.ok
    }, 'MCP gateway API', api)

    const verifier = spawn(process.execPath, [verifierPath], {
      cwd: rootPath,
      env: { ...apiEnv, MCP_API_URL: baseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let verifierOutput = ''
    verifier.stdout?.on('data', (chunk: Buffer) => { verifierOutput += chunk.toString() })
    verifier.stderr?.on('data', (chunk: Buffer) => { verifierOutput += chunk.toString() })
    const exitCode = await new Promise<number>((resolveExit, reject) => {
      verifier.once('error', reject)
      verifier.once('exit', (code) => resolveExit(code ?? 1))
    })
    process.stdout.write(verifierOutput)
    if (exitCode !== 0) throw new Error(`MCP gateway protocol smoke test failed with exit code ${exitCode}.\n${diagnosticsOf(api)}`)
  } finally {
    await stop(api)
    await stop(fixture)
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'MCP gateway smoke runner failed.'}\n`)
  process.exitCode = 1
})