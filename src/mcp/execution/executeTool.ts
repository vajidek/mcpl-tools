import type { MCPExecutionRequest, MCPExecutionResult } from '../types/mcp.types'

export async function executeTool(request: MCPExecutionRequest): Promise<MCPExecutionResult> {
  const startedAt = request.createdAt

  return {
    id: `${request.id}-execution`,
    requestId: request.id,
    status: 'success',
    output: { ok: true, result: request.input },
    startedAt,
    finishedAt: new Date().toISOString(),
  }
}
