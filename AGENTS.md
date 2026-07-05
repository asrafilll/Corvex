# AGENTS.md — Corvex

Single-user, MCP-native project management tool. Read before touching code:

- [CONTEXT.md](./CONTEXT.md) — domain glossary. Use these terms exactly (Customer, Project, Task, Milestone, Payment, Note, Secret, MCP Token).
- [docs/corvex-plan.md](./docs/corvex-plan.md) — implementation plan and sequencing.
- [docs/adr/](./docs/adr/) — 0001 secrets encryption, 0002 project-scoped MCP tokens. Do not violate these.
- `.claude/skills/corvex-design/` — design system (Linear-like density, base-mira purple theme). Mandatory for any UI work.

## Repo map

pnpm monorepo, TypeScript ESM, no build step for packages.

- `apps/api` — Hono + Prisma 7 + Postgres. Better Auth at `src/modules/auth/`. Entry `src/main.ts`, routes chained in `src/app.ts`.
- `apps/platform` — React + Vite + TanStack Router (file routes in `src/routes/`) + TanStack Query. Corvex UI lives here.
- `apps/admin` — admin panel. Leave untouched unless asked.
- `packages/ui` — shadcn (new-york, Tailwind 4). Import from `@repo/ui/components/*` only.
- `packages/api-client` — typed Hono RPC client (`hc<AppType>`).
- `packages/config` — typed env (zod). All env vars go through here, never `process.env` in app code.
- `packages/worker` — BullMQ; `packages/logger` — Pino; `packages/i18n` — i18next.

## Commands (run from repo root)

```bash
pnpm dev                 # all apps (API :8000, platform :5173, admin :5174)
pnpm test                # vitest, all workspaces
pnpm typecheck           # tsc across workspaces — run after any schema/route change
pnpm check:fix           # biome lint+format (do this before finishing)
pnpm db:migrate          # prisma migrate dev (needs local Postgres :15432 — docker compose -f docker-compose.dev.yaml up -d)
pnpm db:generate         # prisma generate — ALWAYS after schema.prisma changes, before typecheck
```

## API module pattern (copy `apps/api/src/modules/profile/`)

- One dir per module: `router.ts` / `schema.ts` (zod) / `services.ts` (prisma) / `types.ts`.
- Router = single chained Hono expression; mount via `.route(...)` in `app.ts` so `AppType` inference feeds the RPC client.
- Auth guards from `modules/auth/middleware.ts` (`requireUser` for Corvex routes) — first thing in every handler, 401 on fail.
- Nested project routes (`/projects/:projectId/...`) must 404 via shared `findProjectOrNull` before acting.
- zValidator for `param`, `query`, `json`. Zod enums mirror Prisma enums from one exported array — no drift.

## Hard rules

- **Money**: `Prisma.Decimal`, `Decimal(14,2)`. Arithmetic with Decimal methods, never JS floats. `.toString()` in services before returning.
- **Secrets** (ADR-0001): `encryptedValue` never selected in list queries, never logged, never crosses MCP. Reveal = POST endpoint only. Crypto via `apps/api/src/utils/secret-crypto.ts` (AES-256-GCM, key from `packages/config`).
- **MCP** (ADR-0002): tools never accept projectId (token scopes it); `get_project` returns no budget/currency/payments; `list_secrets` returns names+descriptions only. Raw `cvx_` tokens shown once at creation; DB stores sha256 hash only.
- **Frontend**: data via TanStack Query hooks + `@repo/api-client` — no `useEffect` fetching, no raw `fetch`. UI strings via `@repo/i18n`. Components from `@repo/ui` only.
- Don't touch Better Auth models in `schema.prisma`; append Corvex models below them.

## Tests

Vitest. API style = `apps/api/src/app.test.ts`: `vi.mock` prisma (`./utils/prisma`) and auth, drive `app.request(...)`. Every new module ships with router tests: 401 unauth, happy path, 404 missing parent, plus module-specific invariants (secrets never leak `encryptedValue`, token create returns raw once).

## Definition of done

1. `pnpm db:generate` (if schema changed) → `pnpm typecheck` clean
2. `pnpm test` green
3. `pnpm check:fix` applied
4. UI changes verified in both light and `.dark` mode
