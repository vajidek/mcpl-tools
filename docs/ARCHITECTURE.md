# Architecture

The React + TypeScript + Vite UI depends on an asynchronous `MCPServiceProvider` contract. `VITE_MCP_PROVIDER=demo` selects the existing mock service adapter; `api` selects the HTTP adapter. Pages and stores use the same contract and do not select transports or handle credentials.

## Request flow

UI → feature/store → `MCPServiceProvider` → mock adapter or API client → `/api` → backend controller → repositories and `MCPGatewayService` → official MCP SDK → stdio or Streamable HTTP server.

The backend is native Node HTTP with strict JSON validation, exact-origin CORS, request size/rate limits, safe error envelopes, and security headers. Backend types import the current MCP domain types as type-only contracts rather than declaring a second set of MCP entities.

## Runtime boundaries

- `VITE_MCP_PROVIDER=mock` (also `demo`) retains isolated fixtures and simulated frontend interactions.
- API mode reaches the backend and reports API health. Configured server metadata is loaded from backend-only `MCP_SERVERS_JSON`.
- The backend owns SDK client sessions. It performs protocol initialization and capability negotiation before marking a server `ready`, then maps discovered items into the shared frontend domain types.
- Implemented transports are stdio and MCP Streamable HTTP. Legacy SSE and WebSocket transports are not implemented.
- Server definitions come from environment configuration. Execution history and logs use in-memory repository interfaces and are lost on process restart. No database or auth system is included.
- Stdio executable paths and HTTP authorities must be allowlisted. Server API DTOs do not expose command, arguments, or environment references. Stdio environment values use backend-only `${VARIABLE}` references.
- HTTP DNS answers are screened and pinned to the socket lookup; redirects, credentials, unallowlisted authorities, and private/reserved addresses are rejected, except explicitly allowlisted loopback in development.
