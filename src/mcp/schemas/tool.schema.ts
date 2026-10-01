import type { MCPToolInputSchema } from '../types/mcp.types'

export const defaultToolInputSchema: MCPToolInputSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Identifier or query to send to the tool',
    },
  },
  required: ['query'],
  additionalProperties: true,
}
