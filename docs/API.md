# MCPL Tools API

The Node gateway exposes a JSON API for the React workspace.

## Health

GET /health is intentionally unauthenticated so platform health checks can verify the service.

## Authentication

All non-health endpoints require:

    Authorization: Bearer <API_ACCESS_TOKEN>

The token is configured only on the backend. The browser stores a user-entered token in session storage and sends it as a Bearer token.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /servers | List configured MCP servers |
| GET | /servers/:id | Inspect a server |
| POST | /servers/:id/connect | Connect and initialize |
| POST | /servers/:id/disconnect | Close a connection |
| POST | /servers/:id/test | Ping the MCP server |
| GET | /servers/:id/tools | Discover tools |
| GET | /servers/:id/resources | Discover resources |
| GET | /servers/:id/prompts | Discover prompts |
| GET | /tools | Aggregate discovered tools |
| POST | /tools/:id/execute | Execute a tool |
| GET | /resources | Aggregate discovered resources |
| POST | /resources/:id/read | Read a resource |
| GET | /prompts | Aggregate discovered prompts |
| POST | /prompts/:id/execute | Retrieve a prompt |
| GET | /executions | List runtime execution history |
| DELETE | /executions | Clear runtime execution history |
| GET | /logs | List runtime logs |
| DELETE | /logs | Clear runtime logs |

## Production notes

Runtime history and logs are in-memory. Free container hosts may restart or sleep, so this data is not durable. Configure explicit CORS origins, a strong API token, and allowlists for every external MCP HTTP host and stdio command you enable.