# mcpl-tools

React + TypeScript + Vite frontend for MCP discovery and execution workflows, with an optional Node HTTP API and official MCP TypeScript SDK gateway.

## Included

- Responsive MCP operations workspace
- Server connection and health controls
- Tool, resource, and prompt discovery
- Tool and prompt execution console
- Execution history and filtered logs
- Demo provider for local/offline UI use
- Runtime API connection from GitHub Pages
- Node MCP gateway for stdio and MCP Streamable HTTP
- Security controls for origin, input, command, host, DNS/IP, timeout, and request size
- Bundled MCPL Core Tools utility MCP server
- Docker image and Render Blueprint for the backend
- CI for lint, builds, MCP smoke tests, and Docker build
- GitHub Pages deployment for the frontend

## Demo

Run npm install, then npm run dev.
The frontend defaults to Demo mode and makes no external MCP connection.

## Local real API

Start the backend with npm run backend:dev. Start Vite in another terminal with npm run dev. Backend configuration lives in backend/.env.

## Production deployment

### Frontend

The static workspace is deployed through GitHub Pages at https://vajidek.github.io/mcpl-tools/ .

### Backend

A Docker deployment blueprint is included in render.yaml. Create a Render Web Service from this repository and use the generated service URL as the backend API URL.

Required production variables are NODE_ENV=production, HOST=0.0.0.0, CORS_ORIGINS=https://vajidek.github.io, API_ACCESS_TOKEN with at least 32 random characters, and MCP_BUILTIN_TOOLS=true.

The blueprint starts with an empty external MCP configuration. The bundled MCPL Core Tools server is enabled by default.

For custom MCP servers, configure MCP_SERVERS_JSON plus matching MCP_ALLOWED_COMMANDS and/or MCP_ALLOWED_HOSTS in the backend host secret settings. Do not put secrets directly into repository files.

### Connect the live frontend

Open the live site, go to Settings → Connection, enter the deployed backend URL and the same API_ACCESS_TOKEN, then choose Save and verify API.

The browser switches from Demo to API mode without rebuilding GitHub Pages.

## Bundled utility MCP tools

The bundled server exposes: uuid_generate, json_format, json_minify, base64_encode, base64_decode, url_encode, url_decode, sha256, text_stats, regex_test, and timestamp_parse.

It also exposes a tool catalog resource and a developer-input review prompt.

## MCP integration

The gateway supports local stdio MCP servers, remote MCP Streamable HTTP servers, initialize and capability negotiation, tool discovery and execution, resource discovery and reads, prompt discovery and retrieval, bounded request timeouts, connection and reconnect handling, and cleanup.

Run npm run backend:test-mcp for the end-to-end local protocol smoke test.

## Validation

- npm run lint
- npm run build
- npm run backend:check
- npm run backend:build
- npm run backend:test-mcp
- docker build -t mcpl-tools-api:local .

## Runtime storage

Execution history and logs are currently in memory only. Restarting the backend clears them. Durable long-term audit history requires a persistent datastore.

See docs/ARCHITECTURE.md, docs/API.md, docs/MCP.md, docs/SECURITY.md, and docs/DEVELOPMENT.md.