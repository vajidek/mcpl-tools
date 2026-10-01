# mcpl-tools

React + TypeScript + Vite frontend for MCP discovery and execution workflows, with an optional Node HTTP API and official MCP TypeScript SDK gateway. The frontend defaults to isolated mock mode; API mode is opt-in.

## Run demo mode

```powershell
npm install
npm run dev
```

## Run the API foundation

In one terminal, build and start the backend:

```powershell
npm run backend:dev
```

In another terminal, start Vite with its `/api` proxy:

```powershell
npm run dev
```

Copy the root `.env.example` to `.env.local` and set `VITE_MCP_PROVIDER=api` to select the backend provider. `mock` (or `demo`) keeps using local mock data. Copy `backend/.env.example` to `backend/.env` for backend-only configuration. The backend listens on `127.0.0.1:8787` by default; health is available at `/api/health` through Vite or `/health` directly.

## Real MCP development test

The backend currently supports stdio and MCP Streamable HTTP through the official SDK. Run a complete local protocol test (it starts and cleans up the backend and fixture processes itself):

```powershell
npm run backend:test-mcp
```

This verifies initialize/capability negotiation, discovery, tool execution, resource reads, prompt retrieval, timeout/error paths, disconnect, and reconnect against SDK-based local fixtures. The real API provider uses the gateway for configured servers; it does not fall back to mock data after a failure.

## Validation

```powershell
npm run lint
npm run build
npm run backend:check
npm run backend:build
npm run backend:test-mcp
```

## Architecture and security

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/MCP.md](docs/MCP.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), and [docs/SECURITY.md](docs/SECURITY.md). Backend runtime history/log repositories are in-memory only. No database or credential storage is configured.
