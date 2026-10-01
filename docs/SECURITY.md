# Security baseline

MCPL Tools separates the browser workspace from backend MCP execution.

## Browser boundary

The browser does not receive configured MCP server credentials. In API mode, the browser sends only the backend URL and a Bearer API token. The API token is held in session storage rather than persisted as application source.

## Backend boundary

Production requires:

- explicit CORS_ORIGINS
- an API_ACCESS_TOKEN with at least 32 characters
- HTTPS-only outbound MCP HTTP endpoints
- explicit MCP HTTP host allowlists
- explicit absolute stdio command allowlists
- bounded request bodies, input nesting, array/object sizes, and execution timeouts
- outbound DNS/IP policy that blocks private and reserved addresses
- security headers including HSTS when running in production

Never commit secrets, access tokens, MCP credentials, or MCP configuration containing literal secret material.

## Bundled tools

The backend includes a small MCPL Core Tools stdio MCP server with deterministic developer utilities. It uses the backend Node executable and does not require external credentials.

## Free hosting caveat

The included Render blueprint is suitable for evaluation, testing, and hobby deployments. A free instance may sleep after inactivity and its local runtime state is ephemeral. Current execution history and logs are intentionally in-memory; durable operational history requires a persistent datastore and a hosting tier that supports it.

## Operational recommendations

Use a strong unique API token, restrict CORS to the exact browser origins you operate, keep MCP allowlists minimal, and rotate tokens when access changes. Put all third-party credentials in the backend hosting provider secret/environment store.