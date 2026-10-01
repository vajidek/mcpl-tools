import type { MCPTool } from '../types/mcp.types'

export class ToolRegistry {
  private tools = new Map<string, MCPTool>()

  register(tool: MCPTool) {
    this.tools.set(tool.id, tool)
  }

  list() {
    return [...this.tools.values()]
  }

  getById(toolId: string) {
    return this.tools.get(toolId)
  }

  search(term: string) {
    const query = term.toLowerCase()
    return [...this.tools.values()].filter((tool) => {
      const haystack = `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase()
      return haystack.includes(query)
    })
  }
}
