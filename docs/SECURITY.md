# Security

- Do not commit secrets or tokens.
- Keep credentials out of frontend source.
- Never log private credentials or tokens.
- Validate inputs before execution.
- Use centralized config access through environment helpers.
- Browser-only React cannot securely store privileged local MCP secrets.

## Backend foundation

- The HTTP service binds to loopback (`127.0.0.1`) by default. Production requires explicit `CORS_ORIGINS`.
- CORS is an exact origin allowlist without credentialed browser requests. Security headers, request timeouts, a per-IP in-memory rate limit, a 256 KiB JSON body limit, and JSON shape/depth/key validation are enabled.
- API errors return a stable code/message/status envelope; internal exception details and stack traces are not returned.
- Server configuration rejects unknown fields, embedded URL credentials, URL query parameters, and fragments. Server credentials are never sent in API DTOs. Stdio environment values may only refer to backend process variables with `${VARIABLE}` references.
- Frontend fetches omit credentials and reject redirects. Do not put backend secrets in `VITE_*` variables.
- API-mode logs contain operation identifiers, not request payloads. Log message secret patterns are redacted.
- Runtime repositories are in-memory development implementations. They are not durable, multi-user, or suitable for production.

Real MCP transports use the official SDK: stdio via absolute executable + argument arrays (no shell), and Streamable HTTP via a custom fetch/Undici dispatcher that pins validated DNS addresses. `MCP_ALLOWED_COMMANDS` and `MCP_ALLOWED_HOSTS` are mandatory trust boundaries; allowlisting loopback is intended only for local development. The backend does not permit browser-supplied transport configuration. Use a dedicated server-side secret manager for credentials; process environment references are a development boundary, not a complete production secret-management system.

The SDK child-process transport is closed on disconnect, connection failure, timeout, and backend shutdown. The local integration fixture is development-only.
