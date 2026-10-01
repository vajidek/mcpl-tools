import type { MCPToolInputSchema } from '../types/mcp.types'

export function validateToolInput(value: Record<string, unknown>, schema?: MCPToolInputSchema): { valid: boolean; errors: string[] } {
  if (!schema) {
    return { valid: true, errors: [] }
  }

  const required = schema.required ?? []
  const errors: string[] = []

  for (const key of required) {
    if (!(key in value)) {
      errors.push(`Missing required field: ${key}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
