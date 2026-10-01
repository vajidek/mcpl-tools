import type { MCPPrompt, MCPResource, MCPServer, MCPTool } from '../mcp/types/mcp.types'

export const mockServers: MCPServer[] = [
  {
    id: 'server-local',
    name: 'Local Workspace Server',
    description: 'Local MCP server for planning and workspace operations.',
    transport: 'stdio',
    capabilities: ['tools', 'resources', 'prompts'],
    enabled: true,
    connectionStatus: 'connected',
  },
  {
    id: 'server-gateway',
    name: 'Remote Gateway',
    description: 'HTTP-based gateway for remote inspections and orchestration.',
    transport: 'http',
    capabilities: ['tools', 'resources'],
    enabled: true,
    connectionStatus: 'connecting',
    baseUrl: 'https://gateway.example.internal',
  },
]

export const mockResources: MCPResource[] = [
  {
    id: 'resource-docs',
    name: 'Project Documents',
    uri: 'resource://workspace/docs',
    mimeType: 'application/json',
    description: 'Documentation and architecture overview',
  },
  {
    id: 'resource-config',
    name: 'Configuration',
    uri: 'resource://workspace/config',
    mimeType: 'application/json',
    description: 'Environment and app configuration data',
  },
]

export const mockPrompts: MCPPrompt[] = [
  {
    id: 'prompt-summary',
    name: 'Summarize context',
    description: 'Generate a concise summary from project context and logs.',
    arguments: [{ name: 'context', description: 'Context to summarize', required: true }],
  },
  {
    id: 'prompt-review',
    name: 'Review architecture',
    description: 'Provide a structured review of a tool or integration setup.',
  },
]

export const mockTools: MCPTool[] = [
  {
    id: 'tool-discover',
    name: 'discover_tools',
    description: 'Discover installed tools and capabilities from a connected MCP server.',
    category: 'Discovery',
    serverId: 'server-local',
    available: true,
    tags: ['search', 'catalog'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to match tool names or metadata' },
        serverId: { type: 'string', description: 'Optional server to scope tool discovery against' },
      },
      required: ['query'],
    },
  },
  {
    id: 'tool-execute',
    name: 'execute_tool',
    description: 'Run a tool request against a server with structured validation and result capture.',
    category: 'Execution',
    serverId: 'server-local',
    available: true,
    tags: ['execute', 'validation'],
    inputSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string', description: 'The target tool to execute' },
        arguments: { type: 'object', description: 'Key/value arguments passed to the tool' },
      },
      required: ['toolName'],
    },
  },
  {
    id: 'tool-fetch',
    name: 'fetch_resource',
    description: 'Retrieve a resource payload and normalize the response for display.',
    category: 'Resources',
    serverId: 'server-gateway',
    available: true,
    tags: ['resource', 'read'],
    inputSchema: {
      type: 'object',
      properties: {
        resourceId: { type: 'string', description: 'The resource identifier to fetch' },
      },
      required: ['resourceId'],
    },
  },
]
