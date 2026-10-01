import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'

const argumentsList = process.argv.slice(2)
if (argumentsList.includes('--fail-start')) {
  process.stderr.write('Intentional MCP fixture startup failure.\n')
  process.exit(2)
}

const toolsOnly = argumentsList.includes('--tools-only')
const server = new McpServer(
  { name: 'mcpl-tools-local-test-server', version: '1.0.0' },
  {
    capabilities: {
      tools: { listChanged: true },
      ...(!toolsOnly ? { resources: { listChanged: true }, prompts: { listChanged: true } } : {}),
    },
  },
)

server.registerTool('greet', {
  title: 'Greeting tool',
  description: 'Return a greeting for the supplied name.',
  inputSchema: { name: z.string().min(1) },
}, async ({ name }) => ({ content: [{ type: 'text', text: `Hello, ${name}!` }] }))

server.registerTool('slow_echo', {
  title: 'Slow echo tool',
  description: 'Wait for a bounded duration, then return a message.',
  inputSchema: { milliseconds: z.number().int().min(0).max(15_000), message: z.string() },
}, async ({ milliseconds, message }) => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
  return { content: [{ type: 'text', text: message }] }
})

if (!toolsOnly) {
  server.registerResource('fixture-status', 'test://mcpl-tools/status', {
    title: 'Test status resource',
    description: 'Deterministic local MCP resource fixture.',
    mimeType: 'text/plain',
  }, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'MCP fixture is ready.' }] }))

  server.registerPrompt('greeting_prompt', {
    title: 'Greeting prompt',
    description: 'Build a greeting prompt for a supplied name.',
    argsSchema: { name: z.string().min(1) },
  }, async ({ name }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Write a friendly greeting for ${name}.` } }] }))
}

const runHttp = async () => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() })
  await server.connect(transport)
  const port = Number(process.env.MCP_TEST_HTTP_PORT ?? 8890)
  const httpServer = createServer((request, response) => {
    void transport.handleRequest(request, response).catch(() => {
      if (!response.headersSent) {
        response.statusCode = 500
        response.end()
      } else response.destroy()
    })
  })
  httpServer.listen(port, '127.0.0.1')
  const close = () => {
    httpServer.close()
    void transport.close()
  }
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
}

if (argumentsList.includes('--http')) {
  void runHttp().catch(() => process.exit(1))
} else {
  const transport = new StdioServerTransport()
  server.connect(transport).then(() => {
    const close = () => { void server.close() }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
  }).catch(() => process.exit(1))
}
if (argumentsList.includes('--hang-start')) {
  process.stdin.resume()
  await new Promise<void>(() => { setInterval(() => undefined, 60_000) })
}