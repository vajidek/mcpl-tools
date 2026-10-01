You are the lead software architect and senior full-stack engineer for this project.

PROJECT:
mcpl-tools

CURRENT STACK:
- React
- TypeScript
- Vite
- npm
- Existing project is already initialized and `npm install` succeeds.
- Development server currently runs successfully with Vite.
- Do NOT recreate the Vite project.
- Do NOT run `npm create vite`.
- Do NOT unnecessarily reinstall or replace the existing toolchain.

PRIMARY OBJECTIVE:
Transform the current basic Vite/React starter project into a production-ready, scalable foundation for an MCP Tools platform.

IMPORTANT:
This task is FOUNDATION-FIRST.

The most important goal of this run is to establish the complete project architecture, directory structure, core files, interfaces, configuration boundaries, reusable UI foundation, service abstractions, MCP abstractions, error handling, state architecture, routing architecture, documentation, and development conventions.

Do NOT spend the token budget building many individual MCP tools.

Do NOT implement unnecessary advanced features yet.

The foundation must remain buildable and runnable after every major change.

==================================================
1. FIRST: AUDIT THE EXISTING PROJECT
==================================================

Before changing anything:

Inspect:
- package.json
- package-lock.json
- src/
- public/
- index.html
- vite.config.ts
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- eslint.config.js
- README.md
- existing Git state if useful

Understand what already exists.

Preserve useful existing configuration.

Do not blindly overwrite files.

Do not delete existing functionality unless it is clearly only default Vite starter content.

==================================================
2. TARGET PRODUCT
==================================================

mcpl-tools should become a professional web platform for discovering, configuring, connecting to, testing, executing, monitoring, and managing MCP-related tools and integrations.

The architecture must be generic enough to support:

- MCP servers
- MCP tools
- MCP resources
- MCP prompts
- tool discovery
- tool execution
- server connection management
- local and remote MCP servers
- API-based integrations
- credentials/configuration
- execution history
- logs
- tool schemas
- JSON input/output
- validation
- errors
- permissions
- future authentication
- future team/workspace support
- future marketplace/catalog functionality
- future AI-assisted tool usage

Do not hard-code the architecture around one MCP provider.

The system must be provider-neutral and extensible.

==================================================
3. TARGET DIRECTORY ARCHITECTURE
==================================================

Create a clean scalable structure similar to:

src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── providers/
│   │   ├── AppProviders.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── NotificationProvider.tsx
│   └── config/
│       ├── app.config.ts
│       ├── environment.ts
│       └── constants.ts
│
├── assets/
│   ├── icons/
│   ├── images/
│   └── styles/
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Switch.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Dialog.tsx
│   │   ├── Drawer.tsx
│   │   ├── Tabs.tsx
│   │   ├── Table.tsx
│   │   ├── DataTable.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Alert.tsx
│   │   ├── Toast.tsx
│   │   ├── Spinner.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── PageContainer.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── MobileNavigation.tsx
│   │
│   └── common/
│       ├── LoadingBoundary.tsx
│       ├── ErrorBoundary.tsx
│       ├── JsonViewer.tsx
│       ├── CodeBlock.tsx
│       └── StatusIndicator.tsx
│
├── features/
│   ├── dashboard/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── servers/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── validators/
│   │   └── types.ts
│   │
│   ├── tools/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── validators/
│   │   └── types.ts
│   │
│   ├── resources/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── prompts/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── execution/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── history/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── logs/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── settings/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   └── integrations/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── mcp/
│   ├── client/
│   │   ├── MCPClient.ts
│   │   ├── MCPConnection.ts
│   │   └── MCPTransport.ts
│   │
│   ├── adapters/
│   │   ├── MCPAdapter.ts
│   │   └── index.ts
│   │
│   ├── discovery/
│   │   ├── discoverTools.ts
│   │   ├── discoverResources.ts
│   │   └── discoverPrompts.ts
│   │
│   ├── execution/
│   │   ├── executeTool.ts
│   │   └── validateToolInput.ts
│   │
│   ├── schemas/
│   │   ├── tool.schema.ts
│   │   ├── resource.schema.ts
│   │   ├── prompt.schema.ts
│   │   └── server.schema.ts
│   │
│   ├── registry/
│   │   ├── ToolRegistry.ts
│   │   ├── ServerRegistry.ts
│   │   └── types.ts
│   │
│   └── types/
│       ├── mcp.types.ts
│       ├── tool.types.ts
│       ├── resource.types.ts
│       ├── prompt.types.ts
│       └── connection.types.ts
│
├── services/
│   ├── api/
│   │   ├── apiClient.ts
│   │   ├── apiTypes.ts
│   │   └── apiErrors.ts
│   │
│   ├── storage/
│   │   ├── localStorage.ts
│   │   ├── sessionStorage.ts
│   │   └── storageKeys.ts
│   │
│   ├── logging/
│   │   ├── logger.ts
│   │   └── logTypes.ts
│   │
│   ├── notifications/
│   │   └── notificationService.ts
│   │
│   └── telemetry/
│       └── telemetryService.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── useClipboard.ts
│   └── useAsync.ts
│
├── lib/
│   ├── utils.ts
│   ├── validation.ts
│   ├── json.ts
│   ├── errors.ts
│   └── formatters.ts
│
├── store/
│   ├── index.ts
│   ├── appStore.ts
│   ├── serverStore.ts
│   ├── toolStore.ts
│   └── executionStore.ts
│
├── types/
│   ├── common.ts
│   ├── api.ts
│   ├── navigation.ts
│   └── configuration.ts
│
├── pages/
│   ├── NotFound.tsx
│   ├── ErrorPage.tsx
│   └── Unauthorized.tsx
│
├── router/
│   ├── AppRouter.tsx
│   ├── routeConfig.ts
│   └── routeTypes.ts
│
├── mocks/
│   ├── servers.ts
│   ├── tools.ts
│   └── execution.ts
│
└── main.tsx

public/
├── icons/
├── images/
└── manifest.webmanifest

docs/
├── ARCHITECTURE.md
├── DEVELOPMENT.md
├── MCP.md
├── PROJECT_STRUCTURE.md
├── SECURITY.md
└── ROADMAP.md

tests/
├── unit/
├── integration/
└── fixtures/

scripts/
└── README.md

.env.example
.gitignore
README.md

==================================================
4. IMPORTANT ARCHITECTURAL RULE
==================================================

Do NOT create every directory merely for appearance.

Create the directories and files that establish a meaningful architecture.

If a file does not yet require implementation, create a minimal type-safe foundation or TODO-safe abstraction rather than fake functionality.

Avoid empty placeholder files that create confusion.

Every created module must have a clear responsibility.

==================================================
5. APPLICATION ARCHITECTURE
==================================================

Use a layered architecture:

UI
↓
Feature layer
↓
Application hooks/state
↓
Services
↓
MCP abstraction / API abstraction
↓
External systems

Keep business logic out of presentational components.

Keep MCP logic out of UI components.

Keep API/network logic out of pages.

Use feature-based organization for domain functionality.

Use shared components only for genuinely reusable UI.

==================================================
6. MCP CORE ABSTRACTION
==================================================

Create provider-neutral MCP interfaces.

Define strong TypeScript types for:

- MCPServer
- MCPConnection
- MCPTool
- MCPToolInputSchema
- MCPToolOutput
- MCPResource
- MCPResourceContent
- MCPPrompt
- MCPPromptArgument
- MCPExecutionRequest
- MCPExecutionResult
- MCPExecutionError
- MCPTransport
- MCPServerStatus
- MCPConnectionStatus

Create interfaces for:

MCPClient:
- connect()
- disconnect()
- getServerInfo()
- listTools()
- listResources()
- listPrompts()
- callTool()
- readResource()
- getPrompt()

MCPTransport should be abstract.

Do not hard-code one transport implementation.

Prepare architecture for future transports such as:
- stdio
- HTTP
- SSE
- WebSocket
- other compatible transports

Do not implement all transports now.

Create clean interfaces and extension points.

==================================================
7. SERVER REGISTRY
==================================================

Create a ServerRegistry abstraction capable of managing:

- registered servers
- server metadata
- connection state
- enabled/disabled state
- server capabilities
- transport configuration
- environment configuration references

The registry must be independent from UI.

==================================================
8. TOOL REGISTRY
==================================================

Create ToolRegistry abstraction supporting:

- discovered tools
- tool metadata
- tool schema
- source server
- availability
- execution status
- search/filter
- categorization

Do not build a full marketplace yet.

==================================================
9. EXECUTION ARCHITECTURE
==================================================

Create a generic execution pipeline:

User
→ Tool selection
→ Input validation
→ Execution request
→ MCP client
→ MCP server
→ Result
→ Normalization
→ UI

Support:

- loading state
- success state
- error state
- timeout-ready architecture
- cancellation-ready architecture
- execution ID
- timestamps
- input/output capture
- structured error handling

Do not expose secrets in logs.

==================================================
10. STATE MANAGEMENT
==================================================

Establish scalable state architecture.

Separate:

Global application state
Server state
Tool state
Execution state
UI state

Avoid unnecessary global state.

If an external state library is already installed and appropriate, evaluate it before adding another.

Do not add heavy dependencies without justification.

==================================================
11. ROUTING
==================================================

Create application routing foundation.

Prepare routes such as:

/
  Dashboard

/servers
  Server list

/servers/:serverId
  Server details

/tools
  Tool explorer

/tools/:toolId
  Tool details

/tools/:toolId/execute
  Tool execution

/resources
  Resource explorer

/prompts
  Prompt explorer

/executions
  Execution history

/logs
  Logs

/integrations
  Integrations

/settings
  Settings

/settings/general
/settings/security
/settings/appearance

/* 
  Not Found

The pages can initially be lightweight but must be structurally valid.

==================================================
12. UI FOUNDATION
==================================================

Create a professional modern developer-tool interface.

Requirements:

- responsive
- desktop-first but mobile usable
- dark/light theme architecture
- accessible components
- consistent spacing
- consistent typography
- reusable buttons/forms/cards/tables
- clear status indicators
- command/developer-tool aesthetic
- clean navigation
- keyboard-friendly interactions where practical

Do not spend excessive tokens polishing visual details.

Establish the design system foundation first.

==================================================
13. APP SHELL
==================================================

Create:

- Sidebar
- Header
- Main content area
- Responsive mobile navigation
- Breadcrumbs
- Page header
- Global notifications
- Theme switching foundation

Navigation should include:

Dashboard
Servers
Tools
Resources
Prompts
Executions
Logs
Integrations
Settings

Use icons only where an existing icon solution is available or lightweight.

Do not add a huge icon dependency unnecessarily.

==================================================
14. DASHBOARD FOUNDATION
==================================================

Create a dashboard that initially displays architecture-ready metrics such as:

- Connected Servers
- Available Tools
- Available Resources
- Available Prompts
- Recent Executions
- Failed Executions
- Server Status

Use mock/demo data only if required.

Clearly separate mock data from real services.

Do not pretend mock data is real MCP data.

==================================================
15. SERVER MANAGEMENT FOUNDATION
==================================================

Create server management UI architecture supporting:

- server list
- server details
- connection status
- transport
- capabilities
- enabled/disabled state
- connect/disconnect actions
- configuration section
- tools discovered from server
- resources discovered from server
- prompts discovered from server

Actual connection logic should remain behind MCPClient.

==================================================
16. TOOL EXPLORER FOUNDATION
==================================================

Create:

- tool list
- search
- filtering
- tool details
- input schema display
- output display
- execution interface

Create a reusable JSON/schema viewer.

Do not implement complicated visual schema editors yet.

==================================================
17. EXECUTION CONSOLE FOUNDATION
==================================================

Create a professional execution console supporting:

- selected tool
- JSON input
- formatted input
- validation
- execute button
- loading state
- result panel
- error panel
- execution metadata
- copy JSON
- clear/reset

Execution must call an abstraction rather than directly calling MCP from the component.

==================================================
18. ERROR HANDLING
==================================================

Create centralized error architecture.

Support:

- application errors
- validation errors
- API errors
- MCP errors
- connection errors
- unknown errors

Create normalized error types.

Create ErrorBoundary.

Create user-friendly error states.

Do not expose stack traces to normal users.

Keep detailed errors available for development/logging.

==================================================
19. LOGGING
==================================================

Create structured logger abstraction.

Support levels:

DEBUG
INFO
WARN
ERROR

Prepare structured metadata:

- timestamp
- module
- operation
- executionId
- serverId
- toolId
- error

Never log:

- passwords
- API keys
- tokens
- private credentials
- secrets

==================================================
20. ENVIRONMENT CONFIGURATION
==================================================

Create:

.env.example

Document configuration patterns.

Never commit real secrets.

Use environment abstraction instead of directly accessing import.meta.env throughout the application.

Centralize environment configuration.

==================================================
21. SECURITY FOUNDATION
==================================================

Establish security principles:

- no secrets in frontend source
- no secrets in Git
- no credential logging
- validate external input
- validate tool input
- sanitize rendered content where applicable
- avoid dangerous dynamic HTML
- centralized API configuration
- safe error handling
- clear trust boundaries

Document frontend/backend limitations.

Important:
A browser-only React application must NOT pretend it can securely store server-side secrets or execute arbitrary local processes.

Prepare the architecture so a future backend/service layer can handle privileged MCP operations.

==================================================
22. BACKEND READINESS
==================================================

Do NOT create a full backend during this foundation run unless absolutely required.

Instead create clear interfaces so the frontend can later communicate with:

/api

or

a dedicated MCP gateway/service.

The architecture must not tightly couple the UI to direct browser-only implementations.

Document this boundary in:

docs/ARCHITECTURE.md

==================================================
23. DATA MODELS
==================================================

Create TypeScript models/interfaces for:

User
Workspace
Server
ServerConfiguration
Connection
Tool
ToolSchema
Resource
Prompt
Execution
ExecutionResult
ExecutionError
LogEntry
Integration
AppSettings

Do not implement authentication yet.

Do not implement database yet.

The models should be future-backend compatible.

==================================================
24. MOCK DATA
==================================================

Create isolated mock data.

Mocks must NEVER be mixed with production service code.

Provide examples for:

- one mock MCP server
- several mock tools
- mock resources
- mock prompts
- mock executions

The UI should be able to render without a real MCP backend.

==================================================
25. UTILITIES
==================================================

Create reusable utilities for:

- JSON parsing
- JSON formatting
- safe JSON stringify
- date/time formatting
- error normalization
- validation
- className composition
- clipboard
- storage
- environment access

Do not create unnecessary utility abstractions.

==================================================
26. DOCUMENTATION
==================================================

Create/update:

README.md
docs/ARCHITECTURE.md
docs/DEVELOPMENT.md
docs/MCP.md
docs/PROJECT_STRUCTURE.md
docs/SECURITY.md
docs/ROADMAP.md

Documentation should be concise but useful.

Explain:

- what the project is
- how to install
- how to run
- architecture
- directory structure
- MCP abstraction
- development conventions
- environment variables
- security boundaries
- future backend direction

==================================================
27. CODE QUALITY
==================================================

Use:

- strict TypeScript
- explicit types where useful
- no `any` unless absolutely unavoidable
- small focused modules
- meaningful names
- no duplicated business logic
- no magic strings where constants/config are appropriate
- no dead imports
- no unused files
- no circular dependencies
- no giant components
- no giant utility file

Prefer composition over inheritance.

==================================================
28. DEPENDENCY POLICY
==================================================

Before installing any new dependency:

Ask whether native React/TypeScript/browser functionality can solve the problem.

Do NOT install large libraries simply for convenience.

Keep bundle size reasonable.

Avoid duplicate libraries serving the same purpose.

If routing/state/query functionality requires a dependency, use a well-established lightweight solution.

==================================================
29. PERFORMANCE FOUNDATION
==================================================

Prepare for:

- lazy-loaded routes
- code splitting
- large tool lists
- large execution histories
- virtualized tables in future
- memoization where justified
- avoiding unnecessary renders

Do not prematurely optimize.

Do not implement virtualization unless currently necessary.

==================================================
30. ACCESSIBILITY
==================================================

Foundation must support:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- button semantics
- dialog accessibility
- form labels
- reasonable contrast
- screen-reader friendly status messages

==================================================
31. PWA READINESS
==================================================

Prepare the project for future PWA support.

Do not introduce a complicated PWA implementation unless necessary now.

Create architecture/configuration that will allow:

- manifest
- service worker
- offline shell
- installability

to be added later.

==================================================
32. TESTING FOUNDATION
==================================================

Prepare testing structure.

At minimum create logical locations for:

- unit tests
- integration tests
- fixtures

Do not spend the majority of the token budget writing tests now.

Add only a few foundational tests if the existing environment supports it cleanly.

==================================================
33. GIT SAFETY
==================================================

Ensure .gitignore covers:

node_modules
dist
.env
.env.*
!.env.example
logs
coverage
local configuration
OS/editor temporary files

Do not remove existing useful Git configuration.

==================================================
34. BUILD VALIDATION
==================================================

After architecture changes:

Run:

npm install

then:

npm run build

and if available:

npm run lint

Fix all errors caused by your changes.

The final project must compile.

Do not leave broken imports.

Do not leave references to files that do not exist.

Do not leave TypeScript errors.

Do not leave obvious ESLint errors.

==================================================
35. IMPORTANT TOKEN / QUOTA RULE
==================================================

This is critical.

Prioritize work in this exact order:

PHASE 1
Project audit

PHASE 2
Core directory structure

PHASE 3
Application shell and routing

PHASE 4
Core types/interfaces

PHASE 5
MCP abstraction

PHASE 6
Services and state boundaries

PHASE 7
Reusable UI foundation

PHASE 8
Feature page skeletons

PHASE 9
Documentation

PHASE 10
Build/lint verification

If the available token/tool budget becomes limited:

STOP adding new features.

Finish the current foundation cleanly.

Ensure the project still builds.

Do NOT start a large feature and leave it half implemented.

Do NOT create unnecessary UI polish.

Do NOT spend tokens generating repetitive boilerplate.

==================================================
36. DO NOT DO THESE THINGS
==================================================

Do NOT:

- recreate the Vite project
- delete package.json
- delete package-lock.json
- delete the existing src folder blindly
- install dozens of packages
- implement a full backend
- implement authentication
- implement database
- implement billing
- implement marketplace
- implement AI assistant
- implement every MCP transport
- implement production credential storage
- hard-code API keys
- create fake successful MCP connections
- pretend mock data is live data
- use hard-coded secrets
- introduce unnecessary complexity

==================================================
37. FILE CREATION STRATEGY
==================================================

Create foundational files first.

When creating a module, make sure:

1. It has a clear responsibility.
2. It has correct imports.
3. It is type-safe.
4. It does not depend on future nonexistent modules.
5. It does not create circular dependencies.

Use barrel exports selectively.

Avoid excessive index.ts files if they make dependency tracing difficult.

==================================================
38. ARCHITECTURAL BOUNDARIES
==================================================

Enforce these rules:

components/
→ presentation only

features/
→ domain-specific UI + feature logic

mcp/
→ MCP protocol abstraction

services/
→ external/system services

store/
→ application state

hooks/
→ reusable React behavior

lib/
→ pure utilities

types/
→ shared domain-independent types

app/
→ application bootstrap/configuration

router/
→ routing

pages/
→ route-level screens

mocks/
→ development/demo data only

==================================================
39. FINAL ACCEPTANCE CRITERIA
==================================================

At the end of this task:

1. Project starts with:

npm run dev

2. Project builds with:

npm run build

3. Lint passes if configured.

4. Default Vite starter UI is removed.

5. Professional mcpl-tools application shell exists.

6. Navigation exists.

7. Dashboard exists.

8. Server section exists.

9. Tool section exists.

10. Execution section exists.

11. Settings section exists.

12. MCP abstractions exist.

13. Core TypeScript types exist.

14. Service boundaries exist.

15. Error handling exists.

16. Mock data is isolated.

17. Environment configuration exists.

18. Documentation exists.

19. No secrets are committed.

20. No unnecessary dependency explosion.

21. No broken imports.

22. No obvious TypeScript errors.

23. Architecture is ready for future MCP backend integration.

==================================================
40. FINAL RESPONSE FORMAT
==================================================

When finished, report ONLY:

A. What was inspected
B. What was created
C. Important architectural decisions
D. Files/directories created or significantly changed
E. Dependencies added, if any
F. Build/lint status
G. Remaining work for the next phase

Do not provide a long tutorial.

Do not repeat the entire codebase.

Do not claim functionality is production-ready if it is only a foundation.

Begin now.