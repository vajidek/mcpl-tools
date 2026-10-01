import type { MCPTransport, MCPTransportType } from '../types/mcp.types'

export abstract class BaseMCPTransport implements MCPTransport {
  readonly type: MCPTransportType

  constructor(type: MCPTransportType) {
    this.type = type
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract isConnected(): boolean
}
