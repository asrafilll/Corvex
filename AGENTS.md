# AGENTS.md — Corvex

Single-user, MCP-native project management tool. Read before touching code:

- [CONTEXT.md](./CONTEXT.md) — domain glossary. Use these terms exactly (Customer, Project, Task, Milestone, Payment, Note, Secret, MCP Token).
- [docs/roadmap.md](./docs/roadmap.md) — **start here**: current state + remaining work as ready-to-run session prompts.
- [docs/corvex-plan.md](./docs/corvex-plan.md) — full spec (locked decisions, Phase 2 MCP details, gotchas).
- [docs/adr/](./docs/adr/) — 0001 secrets encryption, 0002 project-scoped MCP tokens. Do not violate these.
- `.claude/skills/corvex-design/` — design system (Linear-like density, black-and-white foundation, blue-purple accent, selective hard shadows). Mandatory for any UI work.

## Repo map

pnpm monorepo, TypeScript ESM, no build step for packages.

- `apps/api` — Hono + Prisma 7 + Postgres. Browser-session app-password auth lives at `src/modules/auth/`. Entry `src/main.ts`, routes chained in `src/app.ts`.
- `apps/platform` — React + Vite + TanStack Router (file routes in `src/routes/`) + TanStack Query. Corvex UI lives here.
- `packages/ui` — shadcn (new-york, Tailwind 4). Import from `@repo/ui/components/*` only.
- `packages/api-client` — typed Hono RPC client (`hc<AppType>`).
- `packages/config` — typed env (zod). All env vars go through here, never `process.env` in app code.
- `packages/worker` — BullMQ; `packages/logger` — Pino; `packages/i18n` — i18next.

## Commands (run from repo root)

```bash
pnpm dev                 # all apps (API :8000, platform :3000)
pnpm test                # vitest, all workspaces
pnpm typecheck           # tsc across workspaces — run after any schema/route change
pnpm check:fix           # biome lint+format (do this before finishing)
pnpm db:migrate          # prisma migrate dev (needs local Postgres :15432 — docker compose -f docker-compose.dev.yaml up -d)
pnpm db:generate         # prisma generate — ALWAYS after schema.prisma changes, before typecheck
```

## Status (update this list when you ship a module)

API modules done: app-password auth, customers, projects, tasks, milestones, payments, project-notes, secrets, mcp-tokens, activities, workspace search, mcp (Phase 2 server). Platform UI done: app-password unlock/lock, shell nav with global command palette and quick Task capture, projects list, customers list/detail, editable Task details, and full project detail with separate Overview, Tasks, Payments, Milestones, Secrets, MCP Tokens, and Activity tabs. Corvex has no registration, Profile, user-management, or admin app. Pending: closeout (Session 6) — session-by-session prompts in docs/roadmap.md. Cross-check `apps/api/src/modules/` against `schema.prisma` models if unsure.

Human access uses `POST /auth/unlock` with `APP_PASSWORD_HASH`, then a signed, HTTP-only browser-session cookie using `APP_SESSION_SECRET`. The cookie has no persistent expiry; closing the browser or calling `POST /auth/lock` requires the app password again. Production rejects development defaults. MCP does not accept this cookie and remains Bearer-only.

MCP server (`modules/mcp/`): stateless Streamable HTTP at `POST /mcp` via `@hono/mcp` + `@modelcontextprotocol/sdk`. `mcpTokenAuth` (Bearer `cvx_` → sha256 → `mcpToken.findUnique`, 401 missing/revoked, throttled `lastUsedAt`) sets `mcpProjectId`; `buildMcpServer(projectId)` closes over the project so no tool accepts a projectId. Dates cross as ISO strings (z.date has no JSON Schema). Transport isolated in `transport.ts`. ADR-0002 rules: `get_project` omits money, `list_secrets` omits values.

## API module pattern (copy `modules/customers/` for flat resources, `modules/tasks/` for project-nested)

- One dir per module: `router.ts` / `schema.ts` (zod) / `services.ts` (prisma) / `types.ts`.
- Router = single chained Hono expression; mount via `.route(...)` in `app.ts` so `AppType` inference feeds the RPC client.
- Auth guards from `modules/auth/middleware.ts` (`requireAppSession` for Corvex routes) — first thing in every handler, 401 on fail.
- Nested project routes (`/projects/:projectId/...`) must 404 before acting: `findProjectOrNull` when there's no child lookup, or a child lookup scoped by `projectId` (e.g. `findTaskOrNull`) — FK cascade guarantees the project exists, don't double-query.
- Domain errors: service throws named Error subclass (e.g. `InvalidTaskReorderError`), router catches → 400 with snake_case `error` code.
- zValidator for `param`, `query`, `json`. Zod enums mirror Prisma enums from one exported array — no drift.

## Hard rules

- **Money**: `Prisma.Decimal`, `Decimal(14,2)`. Arithmetic with Decimal methods, never JS floats. `.toString()` in services before returning.
- **Secrets** (ADR-0001): `encryptedValue` never selected in list queries, never logged, never crosses MCP. Reveal = POST endpoint only. Crypto via `apps/api/src/utils/secret-crypto.ts` (AES-256-GCM, key from `packages/config`).
- **MCP** (ADR-0002): tools never accept projectId (token scopes it); `get_project` returns no budget/currency/payments; `list_secrets` returns names+descriptions only. Raw `cvx_` tokens shown once at creation; DB stores sha256 hash only.
- **Frontend**: data via TanStack Query hooks + `@repo/api-client` — no `useEffect` fetching, no raw `fetch`. UI strings via `@repo/i18n`. Components from `@repo/ui` only.
- Legacy Better Auth models remain in `schema.prisma` for migration safety but are not active. Do not modify or drop them without an explicit data-migration plan.

## Tests

Vitest. API style: `vi.mock` prisma (`./utils/prisma`) and `readAppSession`, drive `app.request(...)` — see `apps/api/src/app.test.ts`. That file is already too large (lexa flags it); new modules put router tests in `apps/api/src/modules/<module>/router.test.ts` instead, extracting shared mock setup into a helper when first needed. Every new module ships with router tests: 401 unauth, happy path, 404 missing parent, plus module-specific invariants (secrets never leak `encryptedValue`, token create returns raw once).

## Definition of done

1. `pnpm db:generate` (if schema changed) → `pnpm typecheck` clean
2. `pnpm test` green
3. `pnpm check:fix` applied
4. UI changes verified in both light and `.dark` mode
