# Project structure

- src/app: app bootstrap, providers, config
- src/components: shared UI and layout components
- src/features: feature-oriented screens and domain logic
- src/mcp: protocol abstraction and registries
- src/services: API, storage, logging, notifications, telemetry
- src/services/mcp: provider contract, mock adapter, and backend API adapter
- src/store: state contracts and app state boundaries
- src/hooks: reusable React hooks
- src/lib: pure utilities
- src/mocks: isolated development data
- src/pages: route-level screens
- src/router: routing definitions
- docs: architecture and project guidance
- backend/src: Node HTTP configuration, validation, controllers, repositories, official-SDK MCP gateway and transports
- backend/dev: deterministic official-SDK stdio/Streamable HTTP fixtures and E2E gateway runner
