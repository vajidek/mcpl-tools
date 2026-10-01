import { createHash, randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const MAX_TEXT = 200_000
const boundedText = (name: string) => z.string().max(MAX_TEXT, name + ' exceeds the maximum size.')

const textResult = (value: unknown) => ({
  content: [{ type: 'text' as const, text: typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? String(value)) }],
})

const server = new McpServer(
  { name: 'mcpl-core-tools', version: '1.0.0' },
  { capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } } },
)

server.registerTool('uuid_generate', {
  title: 'Generate UUID',
  description: 'Generate a cryptographically random UUID v4.',
}, async () => textResult(randomUUID()))

server.registerTool('json_format', {
  title: 'Format JSON',
  description: 'Validate and pretty-print JSON.',
  inputSchema: { json: boundedText('json'), indent: z.number().int().min(0).max(8).default(2) },
}, async ({ json, indent }) => {
  try {
    const parsed = JSON.parse(json) as unknown
    return textResult(JSON.stringify(parsed, null, indent))
  } catch {
    return { content: [{ type: 'text', text: 'Invalid JSON.' }], isError: true }
  }
})

server.registerTool('json_minify', {
  title: 'Minify JSON',
  description: 'Validate and compact JSON onto one line.',
  inputSchema: { json: boundedText('json') },
}, async ({ json }) => {
  try {
    const parsed = JSON.parse(json) as unknown
    return textResult(JSON.stringify(parsed))
  } catch {
    return { content: [{ type: 'text', text: 'Invalid JSON.' }], isError: true }
  }
})

server.registerTool('base64_encode', {
  title: 'Base64 Encode',
  description: 'Encode UTF-8 text as standard Base64.',
  inputSchema: { text: boundedText('text') },
}, async ({ text }) => textResult(Buffer.from(text, 'utf8').toString('base64')))

server.registerTool('base64_decode', {
  title: 'Base64 Decode',
  description: 'Decode standard Base64 to UTF-8 text.',
  inputSchema: { base64: z.string().max(MAX_TEXT) },
}, async ({ base64 }) => {
  try {
    const normalized = base64.replace(/\s+/g, '')
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) throw new Error('Invalid Base64')
    return textResult(Buffer.from(normalized, 'base64').toString('utf8'))
  } catch {
    return { content: [{ type: 'text', text: 'Invalid Base64.' }], isError: true }
  }
})

server.registerTool('url_encode', {
  title: 'URL Encode',
  description: 'Percent-encode a string for URL query/path usage.',
  inputSchema: { value: boundedText('value') },
}, async ({ value }) => textResult(encodeURIComponent(value)))

server.registerTool('url_decode', {
  title: 'URL Decode',
  description: 'Decode a percent-encoded URL component.',
  inputSchema: { value: boundedText('value') },
}, async ({ value }) => {
  try { return textResult(decodeURIComponent(value)) } catch {
    return { content: [{ type: 'text', text: 'Invalid URL encoding.' }], isError: true }
  }
})

server.registerTool('sha256', {
  title: 'SHA-256 Hash',
  description: 'Calculate the SHA-256 hex digest of UTF-8 text.',
  inputSchema: { text: boundedText('text') },
}, async ({ text }) => textResult(createHash('sha256').update(text, 'utf8').digest('hex')))

server.registerTool('text_stats', {
  title: 'Text Statistics',
  description: 'Return character, byte, line, word, and non-whitespace counts for text.',
  inputSchema: { text: boundedText('text') },
}, async ({ text }) => {
  const stats = {
    characters: [...text].length,
    utf8Bytes: Buffer.byteLength(text, 'utf8'),
    lines: text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    nonWhitespace: [...text].filter((character) => !/\s/u.test(character)).length,
  }
  return textResult(stats)
})

server.registerTool('regex_test', {
  title: 'Regex Test',
  description: 'Test a regular expression against text and return bounded match details.',
  inputSchema: { pattern: z.string().max(4000), text: boundedText('text'), flags: z.string().regex(/^[dgimsuvy]*$/).max(10).default('') },
}, async ({ pattern, text, flags }) => {
  try {
    const expression = new RegExp(pattern, flags)
    const matches = [...text.matchAll(expression)].slice(0, 100).map((match) => ({ match: match[0], index: match.index ?? -1, groups: match.groups ?? {} }))
    const result = { matched: matches.length > 0, count: matches.length, matches }
    return textResult(result, result)
  } catch {
    return { content: [{ type: 'text', text: 'Invalid regular expression or flags.' }], isError: true }
  }
})

server.registerTool('timestamp_parse', {
  title: 'Parse Timestamp',
  description: 'Convert an ISO-8601 date/time or Unix timestamp into normalized representations.',
  inputSchema: { value: z.union([z.string().max(128), z.number().finite()]) },
}, async ({ value }) => {
  const milliseconds = typeof value === 'number' ? (Math.abs(value) < 10_000_000_000 ? value * 1000 : value) : Date.parse(value)
  if (!Number.isFinite(milliseconds)) return { content: [{ type: 'text', text: 'Invalid timestamp.' }], isError: true }
  const date = new Date(milliseconds)
  const result = { iso: date.toISOString(), unixSeconds: Math.floor(milliseconds / 1000), unixMilliseconds: milliseconds }
  return textResult(result, result)
})

server.registerResource('core-tools-catalog', 'mcpl://core-tools/catalog', {
  title: 'Core tool catalog',
  description: 'Catalog of the bundled utility tools available through MCPL Tools.',
  mimeType: 'application/json',
}, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({
  server: 'mcpl-core-tools',
  tools: ['uuid_generate', 'json_format', 'json_minify', 'base64_encode', 'base64_decode', 'url_encode', 'url_decode', 'sha256', 'text_stats', 'regex_test', 'timestamp_parse'],
}, null, 2) }] }))

server.registerPrompt('developer-input-review', {
  title: 'Developer input review',
  description: 'Create a structured review prompt for validating arbitrary developer input.',
  argsSchema: { input: z.string().max(MAX_TEXT), concern: z.string().max(500).default('correctness, edge cases, and security') },
}, async ({ input, concern }) => ({
  messages: [{ role: 'user', content: { type: 'text', text: 'Review the following developer input for ' + concern + '. Identify concrete issues and propose corrected output without exposing secrets.\n\n' + input } }],
}))

const transport = new StdioServerTransport()
await server.connect(transport)
const shutdown = () => { void server.close() }
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)