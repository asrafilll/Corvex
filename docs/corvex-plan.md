# Corvex — Implementation Plan

Single-user, MCP-native project management. Domain language: see [CONTEXT.md](../CONTEXT.md). Decisions: see [docs/adr/](./adr/).

## Context

Corvex is a pnpm monorepo with a Hono API, Prisma 7/Postgres, and a React/Vite/TanStack platform app. Each Project holds its Customer, status, budget/Payments, Tasks, Milestones, Notes, encrypted Secrets, and project-scoped MCP Tokens.

## Locked decisions

- **Single user.** No orgs/roles/sharing, registration, Profile, or admin app. Human access uses one app password and an HTTP-only browser-session cookie. MCP authentication remains project-scoped Bearer tokens and never accepts the app session.
- **Customer = own entity**, 1:N projects, optional on project (internal projects allowed).
- **Project status:** `Lead → Active ⇄ OnHold → Completed`, `Cancelled` from anywhere.
- **Task:** lean Linear-ish — title, markdown description, status (Todo/InProgress/Done/Cancelled), priority (None/Low/Medium/High/Urgent), optional dueDate, manual `order` int.
- **Milestones:** name, date, done flag, per project.
- **Budget:** `budgetAmount + currency` on project plus **Payment** records (date, amount, note) → paid/outstanding derived. `Decimal(14,2)`, never JS floats.
- **Secrets:** encrypted at rest (AES-256-GCM, env master key). Values revealed UI-only via POST endpoint. See ADR-0001.
- **Notes:** markdown Note entity per project (title + body).
- **MCP:** project-scoped tokens; task CRUD + read-only context; no money, no secret values over MCP. See ADR-0002.

## Phase 1 — Domain, API, UI

### 1. Foundations

- `packages/config/src/index.ts`: `SECRETS_ENCRYPTION_KEY` must be set to a non-default 32-byte hex/base64 key in production. `APP_PASSWORD_HASH` must be a Corvex scrypt hash and `APP_SESSION_SECRET` must be at least 32 characters in production.
- `apps/api/src/utils/secret-crypto.ts`: Node crypto only, no new dep. `encryptSecret`/`decryptSecret`, random 12-byte IV, authTag verify, key asserted 32 bytes at boot, `v1.` version prefix.
- `apps/api/prisma/schema.prisma`: Corvex models live below the inactive legacy auth models, which remain untouched for migration safety:
  - Enums: `ProjectStatus`, `TaskStatus`, `TaskPriority`.
  - `Customer` (name, email?, phone?, company?, notes?, timestamps).
  - `Project` (name, description? md, status default Lead, startDate?, deadline?, budgetAmount? `Decimal(14,2)`, currency default, customerId? → `SetNull` on customer delete, timestamps, `@@index([status])`).
  - `Task` (title, description? md, status, priority, dueDate?, order Int, projectId cascade, `@@index([projectId, status, order])`).
  - `Milestone` (name, date, done, projectId cascade).
  - `Payment` (date, amount `Decimal(14,2)`, note?, projectId cascade).
  - `Note` (title, body md, projectId cascade, timestamps).
  - `Secret` (name, description?, encryptedValue, projectId cascade, `@@unique([projectId, name])`).
  - `McpToken` (name, tokenHash `@unique`, projectId cascade, createdAt, lastUsedAt?, revoked).
  - Migration `corvex_domain`; run `prisma generate` before typecheck.

### 2. API modules (`apps/api/src/modules/`)

Use `router.ts` / `schema.ts` / `services.ts` / `types.ts`, with chained routers mounted in `app.ts` so `AppType` feeds the RPC client.

- `auth/middleware.ts`: `requireAppSession` gates every human-facing Corvex route. `/auth/unlock` verifies the scrypt hash with rate limiting and creates a signed browser-session cookie; `/auth/lock` clears it.
- `customers/`: CRUD; list with project counts; detail with projects.
- `projects/`: CRUD; list with `?status=` filter; detail returns everything — customer, ordered tasks, milestones by date, payments + computed paidTotal/outstanding (with `Prisma.Decimal`), notes, secrets **metadata only**, tokens metadata only. Shared `findProjectOrNull` guard → 404 for nested routes.
- Nested under `/projects/:projectId/`:
  - `tasks/`: CRUD + `POST /reorder` (transaction, renumber, validate id-set belongs to the project).
  - `milestones/`, `payments/`, `project-notes/` (name avoids clash with customer `notes` field): CRUD.
- `secrets/`: GET metadata only (never select `encryptedValue`), POST encrypts, PATCH re-encrypts, DELETE, `POST /:id/reveal` (POST so the value never lands in URL logs).
- `mcp-tokens/`: GET metadata; POST generates `cvx_` + 32 random bytes base64url, stores sha256 hex, returns raw token **once**; `POST /:id/revoke`.
- Decimal → `.toString()` in services (keeps inferred RPC types honest). Zod enums mirror Prisma enums via one exported array per module.

### 3. Platform UI (`apps/platform/src/`)

- Routes:
  - `projects.index.tsx` — list with status filter tabs, name/customer/deadline/budget columns, new-project dialog.
  - `projects.$projectId.tsx` — full-width tabbed detail: header (name, status select, deadline); Overview (customer, budget, notes); focused Tasks, Payments, Milestones, Secrets, and MCP Tokens tabs. Tasks are grouped by status and created through a Title + Description dialog. Secrets stay masked with reveal + copy + auto-rehide; token creation shows the raw token once.
  - Task detail editing exposes the existing status, priority, due date, title, and markdown-description fields. Project detail also includes an Activity tab for append-only UI/MCP mutation history.
  - The shell command palette provides allowlisted global search across Projects, Customers, Tasks, and Notes plus Project-aware quick Task capture. Secrets and MCP Token material are never searchable.
  - `customers.index.tsx`, `customers.$customerId.tsx` — list + detail with their projects.
- Feature hooks per resource (TanStack Query `queryOptions` + mutations invalidating `["projects", projectId]`), pattern of existing `modules/auth/`.
- `app-shell.tsx`: add Projects + Customers nav items; i18n strings via `@repo/i18n`.
- New deps (platform only): `react-markdown`, `remark-gfm`. Editing = plain Textarea, no WYSIWYG.

## Phase 2 — MCP server (`apps/api/src/modules/mcp/`)

- Deps (api): `@modelcontextprotocol/sdk`, `@hono/mcp` (StreamableHTTPTransport). Pin version; isolate in `transport.ts`; fallback = `fetch-to-node` + SDK's own transport.
- **Stateless**: fresh `McpServer` + transport per request, no session ids — fine at single-user scale.
- `middleware.ts` — `mcpTokenAuth`: Bearer `cvx_…` → sha256 → `mcpToken.findUnique({ tokenHash })`; reject missing/revoked → 401; set `mcpProjectId` in context; throttled `lastUsedAt` update (only if >60s stale).
- `server.ts` — `buildMcpServer(projectId)` registers tools (zod input schemas, all internally scoped; tools never accept projectId):
  - `get_project` (details, status, deadline, customer name, milestones — **no budget/payments**)
  - `list_tasks` (status filter), `get_task`, `create_task`, `update_task`
  - `list_notes`, `get_note`, `add_note`
  - `list_milestones`
  - `list_secrets` (names + descriptions only; never selects `encryptedValue`)
- `router.ts` — `/mcp` POST/GET/DELETE: middleware → connect → `transport.handleRequest(c)`. Auth is Bearer-only, independent of cookies; CORS must pass no-Origin (non-browser) requests.

## Tests

Style of existing `apps/api/src/app.test.ts` (mock Prisma and `readAppSession`, drive `app.request`):

- Crypto unit: round-trip, unique IVs per call, tamper → throw, wrong key, bad format.
- Token unit: format/prefix, hash determinism.
- Per-module router: 401 unauth, CRUD happy path, 404 missing project, secrets list contains no `encryptedValue`, reveal returns plaintext, token create returns raw once and stores only the hash.
- MCP: JSON-RPC initialize / tools-list / tools-call via `app.request("/mcp")`; 401 on missing + revoked token; `get_project` has no budget fields; `list_secrets` has no values; token for project A cannot reach project B.

## Verification

1. `pnpm --filter @repo/api db:migrate` clean against local Postgres (:15432), then `prisma generate`.
2. `pnpm typecheck` workspace-wide (catches RPC type drift).
3. `pnpm test`.
4. Manual flow: customer → project → tasks/milestones/payments/notes/secret; reveal a secret **after server restart** (proves env key wiring); create MCP token.
5. MCP: `npx @modelcontextprotocol/inspector` (or curl JSON-RPC) at `http://localhost:8000/mcp` with the Bearer token — tool list, task create/update, cross-project isolation.

## Gotchas

- Prisma 7 + driver adapter: no `url` in datasource; migrate CLI still needs `DATABASE_URL` via the existing `with-env` script. Generate before typecheck.
- Never log `/secrets/*` request/response bodies; check logger middleware.
- Dev encryption key default → dev-encrypted secrets won't decrypt in prod (environment-bound).
- Keep each router a single chained expression (existing pattern) to keep `AppType` inference sane.

## Sequencing

1. Config key + crypto util + schema + migration
2. `customers` + `projects` modules + tests
3. `tasks` / `milestones` / `payments` / `project-notes`
4. `secrets` + `mcp-tokens`
5. Platform UI: nav → projects list → project detail → customers
6. MCP: middleware → tools → transport → tests → inspector
