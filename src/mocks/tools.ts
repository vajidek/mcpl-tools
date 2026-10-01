export const mockToolCatalog = [
  {
    id: 'tool-discover',
    name: 'discover_tools',
    description: 'Enumerates tools exposed by the connected MCP server.',
    category: 'Discovery',
    tags: ['catalog', 'inspection'],
    available: true,
    serverId: 'server-local',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    id: 'tool-execute',
    name: 'execute_tool',
    description: 'Executes tool calls with validation, metadata, and structured results.',
    category: 'Execution',
    tags: ['run', 'validation'],
    available: true,
    serverId: 'server-local',
    inputSchema: {
      type: 'object',
      properties: {
        toolName: { type: 'string' },
      },
      required: ['toolName'],
    },
  },
  {
    id: 'tool-annotate',
    name: 'annotate_result',
    description: 'Formats output and attaches execution metadata for future inspection.',
    category: 'Formatting',
    tags: ['output', 'metadata'],
    available: true,
    serverId: 'server-gateway',
    inputSchema: {
      type: 'object',
      properties: {
        payload: { type: 'object' },
      },
      required: ['payload'],
    },
  },
]

export const mockTools = mockToolCatalog
