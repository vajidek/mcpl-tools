import type { MCPServer } from '../types/mcp.types'

export class ServerRegistry {
  private servers = new Map<string, MCPServer>()

  register(server: MCPServer) {
    this.servers.set(server.id, server)
  }

  unregister(serverId: string) {
    this.servers.delete(serverId)
  }

  getById(serverId: string) {
    return this.servers.get(serverId)
  }

  list() {
    return [...this.servers.values()]
  }

  update(serverId: string, patch: Partial<MCPServer>) {
    const current = this.servers.get(serverId)
    if (!current) {
      return
    }

    this.servers.set(serverId, { ...current, ...patch })
  }
}
