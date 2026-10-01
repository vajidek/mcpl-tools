# Roadmap

## Phase 1: foundation

- app shell
- routing
- types
- MCP abstraction
- shared infrastructure
- mock data and documentation

## Phase 2: product features

- server detail views
- tool execution console
- resource and prompt explorers
- history and logs panels
- environment-aware configuration

## Phase 4: backend and gateway foundation

- [x] Provider-neutral async frontend service boundary with explicit demo/API selection
- [x] Native Node HTTP API, typed routes, safe validation, health, CORS/security middleware
- [x] Backend `MCPGateway` contract and official-SDK implementation
- [x] Implement official-SDK stdio and Streamable HTTP clients with lifecycle, discovery, operations, and cleanup
- [x] Verify stdio and Streamable HTTP end-to-end against local SDK fixtures
- [ ] Add persistent repositories/database migrations for server definitions, executions, and logs
- [x] Add stdio executable and HTTP authority allowlists, DNS pinning, and server-side environment references
- [ ] Add authentication, authorization, managed secrets, durable history, and audit controls before production deployment

## Phase 5: hardening and production operations

- [ ] Add durable repositories and multi-user authorization before production use
- [ ] Add managed secret storage instead of process-environment references
- [ ] Add MCP protocol conformance suite, live session monitoring, and operational metrics
- [ ] Consider legacy SSE only if an MCP server requires it; WebSocket is not part of current MCP transport support
