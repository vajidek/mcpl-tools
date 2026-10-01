import type { MCPConnection, MCPConnectionStatus, MCPTransportType } from '../types/mcp.types'

export class MCPConnectionImpl implements MCPConnection {
  id: string
  serverId: string
  status: MCPConnectionStatus
  transport: MCPTransportType
  config?: Record<string, unknown>
  connectedAt?: string

  constructor(serverId: string, transport: MCPTransportType, config?: Record<string, unknown>) {
    this.id = `${serverId}-${Date.now()}`
    this.serverId = serverId
    this.transport = transport
    this.status = 'disconnected'
    this.config = config
  }

  connect() {
    this.status = 'connected'
    this.connectedAt = new Date().toISOString()
  }

  disconnect() {
    this.status = 'disconnected'
    this.connectedAt = undefined
  }
}
