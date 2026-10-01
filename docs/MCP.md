# MCP abstraction

This project defines provider-neutral MCP interfaces while using the official MCP TypeScript SDK for backend transports.

## Current responsibility

- Define core server, tool, resource, and prompt contracts.
- Provide registry patterns for discovered objects.
- Establish execution validation and tool invocation boundaries.
- Backend transports use the official MCP TypeScript SDK.

## Gateway status

The backend exposes these routes:

| Route | Operation |
| --- | --- |
| `GET /health`, `GET /api/health` | Backend health and MCP transport readiness |
| `GET /api/servers`, `GET /api/servers/:id`, `GET /api/servers/:id/status` | Server metadata and status |
| `POST /api/servers/:id/connect`, `/disconnect`, `/test` | Server lifecycle boundary |
| `GET /api/servers/:id/tools`, `/resources`, `/prompts` | Per-server discovery |
| `GET /api/tools`, `GET /api/tools/:id`, `POST /api/tools/:id/execute` | Tool discovery and execution boundary |
| `GET /api/resources`, `GET /api/resources/:id`, `POST /api/resources/:id/read` | Resource discovery and read boundary |
| `GET /api/prompts`, `GET /api/prompts/:id`, `POST /api/prompts/:id/execute` | Prompt discovery and execution boundary |
| `GET /api/executions`, `GET /api/executions/:id`, `DELETE /api/executions` | Runtime execution history |
| `GET /api/logs`, `DELETE /api/logs` | Runtime logs with level/search/source filters |

`MCPGateway` is the backend-owned protocol boundary. `MCPGatewayService` owns SDK `Client` sessions, performs initialization, maps negotiated server information/capabilities, and dispatches requests. Implemented transports are stdio and MCP Streamable HTTP. SSE and WebSocket are not supported.

Backend server definitions are validated from `MCP_SERVERS_JSON`. Example entries:

```json
[
	{
		"id": "local-fixture",
		"name": "Local fixture",
		"description": "Local development MCP server",
		"transport": "stdio",
		"command": "C:/Program Files/nodejs/node.exe",
		"args": ["D:/mcpl-tools/mcpl-tools/backend/dist/backend/dev/mcpTestServer.js"],
		"env": { "SERVICE_TOKEN": "${MCP_FIXTURE_TOKEN}" },
		"capabilities": [],
		"enabled": true,
		"connectionTimeoutMs": 5000,
		"requestTimeoutMs": 30000
	},
	{
		"id": "remote-fixture",
		"name": "Remote fixture",
		"description": "Allowlisted MCP Streamable HTTP server",
		"transport": "http",
		"baseUrl": "https://mcp.example.test/mcp",
		"capabilities": [],
		"enabled": true
	}
]
```

Executable paths must exactly match `MCP_ALLOWED_COMMANDS`; arguments are passed as an array without a shell. Environment mappings must reference backend process variables and are never exposed in server DTOs. HTTP authorities must exactly match `MCP_ALLOWED_HOSTS`. Private/reserved DNS answers are denied except explicitly allowlisted loopback in development; DNS results are pinned at socket connect time. Production HTTP endpoints require HTTPS.

The deterministic end-to-end test is `npm run backend:test-mcp`. It launches SDK-based stdio and Streamable HTTP fixtures and verifies initialization, capability discovery, tool execution, resource reads, prompt retrieval, invalid input, request/connection timeout, process startup failure, disconnect, reconnect, and cleanup.

## Future integration

The frontend uses `MCPServiceProvider`; API mode talks to the backend while mock mode adapts the existing mock service. Before production, replace environment references with a managed secret provider and add durable persistence, authentication/authorization, protocol conformance tests, and operational policy.
