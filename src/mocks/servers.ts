import type { MCPPrompt, MCPResource, MCPServer, MCPTool } from '../mcp/types/mcp.types'

const serverId = 'server-core'

const property = (type: string, description: string) => ({ type, description })

export const mockServers: MCPServer[] = [
  {
    id: serverId,
    name: 'MCPL Core Tools',
    description: 'Built-in utility tools for everyday JSON, text, encoding, hashing, URL, regex, and timestamp tasks.',
    transport: 'stdio',
    capabilities: ['tools', 'resources', 'prompts'],
    enabled: true,
    connectionStatus: 'connected',
  },
]

export const mockResources: MCPResource[] = [
  {
    id: 'resource-core-catalog',
    serverId,
    name: 'Core tools catalog',
    uri: 'mcpl://core-tools/catalog',
    mimeType: 'application/json',
    description: 'Catalog of built-in utility tools available in this workspace.',
  },
]

export const mockPrompts: MCPPrompt[] = [
  {
    id: 'prompt-developer-review',
    serverId,
    name: 'Developer input review',
    description: 'Turn a technical request into a cleaner, more structured instruction.',
    arguments: [{ name: 'input', description: 'Technical request to review', required: true }],
  },
]

export const mockTools: MCPTool[] = [
  {
    id: 'tool-uuid',
    name: 'uuid_generate',
    description: 'Generate a UUID for IDs, test data, or request correlation.',
    category: 'Utility',
    serverId,
    available: true,
    tags: ['uuid', 'id', 'utility'],
    inputSchema: { type: 'object', properties: {} },
  },
  {
    id: 'tool-json-format',
    name: 'json_format',
    description: 'Validate JSON and return a readable formatted version.',
    category: 'JSON',
    serverId,
    available: true,
    tags: ['json', 'format', 'validate'],
    inputSchema: { type: 'object', properties: { json: property('string', 'JSON text') }, required: ['json'] },
  },
  {
    id: 'tool-json-minify',
    name: 'json_minify',
    description: 'Validate JSON and return compact JSON without extra whitespace.',
    category: 'JSON',
    serverId,
    available: true,
    tags: ['json', 'minify', 'compact'],
    inputSchema: { type: 'object', properties: { json: property('string', 'JSON text') }, required: ['json'] },
  },
  {
    id: 'tool-base64-encode',
    name: 'base64_encode',
    description: 'Encode UTF-8 text into Base64.',
    category: 'Encoding',
    serverId,
    available: true,
    tags: ['base64', 'encode', 'text'],
    inputSchema: { type: 'object', properties: { text: property('string', 'Text to encode') }, required: ['text'] },
  },
  {
    id: 'tool-base64-decode',
    name: 'base64_decode',
    description: 'Decode Base64 back into UTF-8 text.',
    category: 'Encoding',
    serverId,
    available: true,
    tags: ['base64', 'decode', 'text'],
    inputSchema: { type: 'object', properties: { value: property('string', 'Base64 value') }, required: ['value'] },
  },
  {
    id: 'tool-url-encode',
    name: 'url_encode',
    description: 'Percent-encode a URL component safely.',
    category: 'URL',
    serverId,
    available: true,
    tags: ['url', 'encode', 'uri'],
    inputSchema: { type: 'object', properties: { text: property('string', 'Text to encode') }, required: ['text'] },
  },
  {
    id: 'tool-url-decode',
    name: 'url_decode',
    description: 'Decode a percent-encoded URL component.',
    category: 'URL',
    serverId,
    available: true,
    tags: ['url', 'decode', 'uri'],
    inputSchema: { type: 'object', properties: { value: property('string', 'Encoded value') }, required: ['value'] },
  },
  {
    id: 'tool-sha256',
    name: 'sha256',
    description: 'Calculate a SHA-256 hex digest for text.',
    category: 'Hash',
    serverId,
    available: true,
    tags: ['sha256', 'hash', 'checksum'],
    inputSchema: { type: 'object', properties: { text: property('string', 'Text to hash') }, required: ['text'] },
  },
  {
    id: 'tool-text-stats',
    name: 'text_stats',
    description: 'Count characters, bytes, words, lines, and non-whitespace characters.',
    category: 'Text',
    serverId,
    available: true,
    tags: ['text', 'count', 'stats'],
    inputSchema: { type: 'object', properties: { text: property('string', 'Text to analyze') }, required: ['text'] },
  },
  {
    id: 'tool-regex-test',
    name: 'regex_test',
    description: 'Test a regular expression against text and return match details.',
    category: 'Regex',
    serverId,
    available: true,
    tags: ['regex', 'pattern', 'validate'],
    inputSchema: {
      type: 'object',
      properties: {
        pattern: property('string', 'Regular expression pattern'),
        text: property('string', 'Text to test'),
        flags: property('string', 'Optional regex flags such as i or gm'),
      },
      required: ['pattern', 'text'],
    },
  },
  {
    id: 'tool-timestamp',
    name: 'timestamp_parse',
    description: 'Parse an ISO date or Unix timestamp into common date formats.',
    category: 'Date & Time',
    serverId,
    available: true,
    tags: ['date', 'time', 'timestamp'],
    inputSchema: { type: 'object', properties: { value: property('string', 'ISO date, Unix seconds, or Unix milliseconds') }, required: ['value'] },
  },
]

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const base64ToText = (value: string) => {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

export const executeMockCoreTool = async (toolName: string, input: Record<string, unknown>) => {
  switch (toolName) {
    case 'uuid_generate':
      return { uuid: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}` }
    case 'json_format': {
      const parsed = JSON.parse(String(input.json))
      return { formatted: JSON.stringify(parsed, null, 2) }
    }
    case 'json_minify': {
      const parsed = JSON.parse(String(input.json))
      return { minified: JSON.stringify(parsed) }
    }
    case 'base64_encode':
      return { base64: bytesToBase64(new TextEncoder().encode(String(input.text))) }
    case 'base64_decode':
      return { text: base64ToText(String(input.value)) }
    case 'url_encode':
      return { encoded: encodeURIComponent(String(input.text)) }
    case 'url_decode':
      return { text: decodeURIComponent(String(input.value)) }
    case 'sha256': {
      if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is not available in this browser.')
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(input.text)))
      return { sha256: bytesToHex(new Uint8Array(digest)) }
    }
    case 'text_stats': {
      const text = String(input.text)
      const words = text.trim() ? text.trim().split(/\s+/u).length : 0
      const lines = text ? text.split(/\r?\n/u).length : 0
      const chars = text.length
      const bytes = new TextEncoder().encode(text).length
      const nonWhitespace = text.replace(/\s/gu, '').length
      return { chars, bytes, words, lines, nonWhitespace }
    }
    case 'regex_test': {
      const pattern = String(input.pattern)
      const text = String(input.text)
      const flags = String(input.flags ?? '')
      const regex = new RegExp(pattern, flags)
      const matches = [...text.matchAll(new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`))].map((match) => match[0])
      return { matches, matched: regex.test(text), count: matches.length }
    }
    case 'timestamp_parse': {
      const raw = String(input.value).trim()
      const numeric = /^-?\d+(?:\.\d+)?$/u.test(raw)
      const date = numeric
        ? new Date(Math.abs(Number(raw)) < 1e11 ? Number(raw) * 1000 : Number(raw))
        : new Date(raw)
      if (Number.isNaN(date.getTime())) throw new Error('Invalid date or timestamp.')
      return {
        iso: date.toISOString(),
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMilliseconds: date.getTime(),
        local: date.toString(),
      }
    }
    default:
      throw new Error(`Unknown core tool: ${toolName}`)
  }
}
