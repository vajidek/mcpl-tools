# Development

## Install

npm install

## Run

npm run dev

For the API foundation, use another terminal:

```powershell
npm run backend:dev
```

Vite proxies `/api` to `BACKEND_URL` (default `http://127.0.0.1:8787`). To select API mode, set `VITE_MCP_PROVIDER=api` in the frontend environment. `VITE_MCP_PROVIDER=mock` is the default and requires no backend.

## Build

npm run build

## Lint

npm run lint

## Backend commands

```powershell
npm run backend:check
npm run backend:build
npm run backend:start
npm run backend:test-mcp
```

`backend:test-mcp` builds and runs a self-contained local integration scenario using SDK fixtures over stdio and Streamable HTTP. It selects an absolute Node executable and exact fixture host allowlist, then cleans up test processes on exit.

## Conventions

- Prefer TypeScript types instead of any.
- Keep modules focused and technology-specific.
- Keep mock data outside production services.
- Centralize app configuration in src/app/config.
- Keep secret handling out of frontend source.
- Do not add credentials to `MCP_SERVERS_JSON`; unknown configuration keys are rejected.
- Supported real transports are stdio and MCP Streamable HTTP through `@modelcontextprotocol/sdk`; SSE and WebSocket are not currently implemented.
- Backend operations never fall back to mock data in API mode.
- Backend server definitions are process-start configuration; history and logs currently use volatile in-memory repositories.
