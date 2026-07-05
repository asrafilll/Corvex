# Corvex Roadmap — handoff to the next agent

Architect's brief for finishing Corvex. Work top to bottom; one session per numbered block, commit + push after each. Spec lives in [corvex-plan.md](./corvex-plan.md), domain language in [CONTEXT.md](../CONTEXT.md), hard rules in [AGENTS.md](../AGENTS.md) and [docs/adr/](./adr/). If this file and the plan disagree, this file wins (it is newer).

## Current state (2026-07-05)

Done and pushed on `main`:

- Foundations: theme tokens, `SECRETS_ENCRYPTION_KEY` config, `utils/secret-crypto.ts` (AES-256-GCM, tested), full Prisma schema + `corvex_domain` migration.
- API modules: `customers/`, `projects/` (detail payload incl. paidTotal/outstanding), `tasks/` (nested CRUD + reorder). All mounted in `app.ts`, RPC `AppType` picks them up.
- Session 1 done (2026-07-05): `milestones/`, `payments/`, `project-notes/` — nested CRUD, mounted in projects router, tests in module `router.test.ts` files, shared helpers in `src/test/helpers.ts`.
- Design locked: "Linear Dense" — `.claude/skills/corvex-design/SKILL.md` has the layout rules (three-pane detail, h-8 task rows, priority dots). Invoke that skill before any UI work.

Not started: secrets/mcp-tokens API, all platform UI, MCP server.

Known debt (fold into the session that touches the area, don't do it standalone unless idle):

- `apps/api/src/app.test.ts` is 854 lines; lexa flags it. New tests go in `apps/api/src/modules/<module>/router.test.ts` (AGENTS.md rule). When convenient, migrate existing project/task tests out too.

## Conventions recap (read AGENTS.md for the full set)

- Copy `modules/tasks/` for nested modules, `modules/customers/` for flat ones.
- Child lookup scoped by `projectId` satisfies the 404 guard — don't also query the project.
- Money: `Prisma.Decimal`, `.toString()` in services. Zod enums mirror Prisma enums via one exported array.
- Every session ends: `pnpm db:generate` (if schema touched) → `pnpm typecheck` → `pnpm test` → `pnpm check:fix` → commit → push. Update the Status list in AGENTS.md when a module ships.

---

## Session 1 — Milestones, Payments, Project-notes API — ✅ DONE

Three near-identical nested CRUD modules. No schema changes.

Prompt:

```text
Read AGENTS.md and docs/roadmap.md (Session 1). Copy the apps/api/src/modules/tasks/ pattern. Build three modules nested under /projects/:projectId/:

1. milestones/ — GET (ordered by date asc), POST (name, date), PATCH /:milestoneId (name/date/done toggle), DELETE.
2. payments/ — GET (ordered by date asc), POST (date, amount, note?), PATCH /:paymentId, DELETE. Amount = Prisma.Decimal, validate with zod as string/number → Decimal in service, .toString() on the way out.
3. project-notes/ — routes at /projects/:projectId/notes (module dir named project-notes to avoid clash with customer notes field) — GET (updatedAt desc), POST (title, body), PATCH /:noteId, DELETE.

Mount all three in projects/router.ts via .route() like tasks. Tests in modules/<module>/router.test.ts (NOT app.test.ts): 401 unauth, happy paths, 404 missing project on create, 404 cross-project child access. Finish with typecheck, test, check:fix, commit, push.
```

Acceptance: `GET /projects/:id` detail payload already includes these collections — verify the new routes return the same shapes so RPC types stay coherent.

## Session 2 — Secrets + MCP tokens API

Security-sensitive. Read ADR-0001 and ADR-0002 first; their rules are non-negotiable.

Prompt:

```text
Read AGENTS.md, docs/adr/0001, docs/adr/0002, docs/roadmap.md (Session 2). Use apps/api/src/utils/secret-crypto.ts. Build under /projects/:projectId/:

1. secrets/ — GET (id/name/description only — the prisma select must never include encryptedValue), POST (unique name per project → 409 on duplicate), PATCH /:secretId (re-encrypt only when value present), DELETE, POST /:secretId/reveal (decrypts; POST so values never hit URL/access logs). Confirm no logger middleware captures request/response bodies on these routes.
2. mcp-tokens/ — GET metadata (id/name/createdAt/lastUsedAt/revoked), POST (raw token = "cvx_" + 32 random bytes base64url; store sha256 hex hash only; response contains the raw token — this is the ONLY place it ever appears), POST /:tokenId/revoke.

Tests in module router.test.ts files: list responses contain no encryptedValue/tokenHash anywhere in the JSON (assert on the serialized body), reveal round-trips, duplicate name 409s in same project but not across projects, create returns cvx_ token while the prisma mock received only a hash, revoke flips the flag, 401/404 guards. Finish with typecheck, test, check:fix, commit, push.
```

## Session 3 — Platform UI: shell, customers, projects list

First UI session. Invoke the corvex-design skill and follow it strictly.

Prompt:

```text
Invoke the corvex-design skill. Read AGENTS.md (frontend rules) and docs/roadmap.md (Session 3). In apps/platform:

1. Add react-markdown + remark-gfm (platform only; needed next session, install now).
2. App shell: Projects + Customers nav items (lucide icons, i18n labels via @repo/i18n).
3. Query hooks per resource in src/modules/<resource>/hooks/ mirroring modules/auth/ — TanStack Query queryOptions + mutations, @repo/api-client only, invalidate list keys and ["projects", projectId].
4. routes/projects.index.tsx — status filter tabs (All/Lead/Active/On hold/Completed/Cancelled), table columns name/customer/deadline/budget (tabular-nums), row click → detail, "New project" dialog (name, customer select, status, deadline, budget + currency).
5. routes/customers.index.tsx + customers.$customerId.tsx — list with project counts, create/edit dialog, detail with contact info + their projects.

Verify both light and .dark mode by running the app and clicking through. Finish with typecheck, test, check:fix, commit, push.
```

## Session 4 — Platform UI: project detail (the flagship screen)

Prompt:

```text
Invoke the corvex-design skill — the three-pane project detail layout it specifies is mandatory. Read docs/roadmap.md (Session 4). Build routes/projects.$projectId.tsx in apps/platform:

- Header: breadcrumb (Projects / name), inline status Select (updates immediately), tinted status pill, deadline right-aligned.
- Main column: tasks grouped In Progress → Todo → Done as dense h-8 rows (priority dot, title, due date; inline add; status change; reorder via up/down buttons or drag — POST /reorder). Below: notes list with markdown render (react-markdown + remark-gfm), add/edit via dialog with plain Textarea.
- Right rail (w-64): customer (link to detail), budget with paid (emerald) / outstanding (amber), payments list + inline add-payment, milestones checklist with done toggle + add, secrets masked ("••••••••", Reveal → POST reveal → show with copy button, auto-rehide ~30s, never toast a value), MCP tokens (create dialog shows raw cvx_ token once with copy + "won't be shown again" warning, revoke with confirm alert-dialog naming the token).

All data via the Session 3 hook pattern. Verify light + dark by running the full manual flow: create customer → project → tasks → payment → note → secret (reveal after API restart to prove key wiring) → token. Finish with typecheck, test, check:fix, commit, push.
```

## Session 5 — MCP server (Phase 2)

The reason this app exists. Spec: corvex-plan.md Phase 2 + ADR-0002.

Prompt:

```text
Read docs/adr/0002 and docs/corvex-plan.md (Phase 2 section), then docs/roadmap.md (Session 5). In apps/api, build modules/mcp/:

1. Deps: @modelcontextprotocol/sdk + @hono/mcp (pin exact versions).
2. middleware.ts — mcpTokenAuth: Bearer cvx_ token → sha256 → mcpToken.findUnique by tokenHash; 401 on missing/revoked; set mcpProjectId in context; update lastUsedAt only if >60s stale.
3. server.ts — buildMcpServer(projectId): tools get_project (NO budget/currency/payments), list_tasks (?status), get_task, create_task, update_task, list_notes, get_note, add_note, list_milestones, list_secrets (names+descriptions only). Zod input schemas; no tool accepts projectId.
4. router.ts — stateless: fresh McpServer + StreamableHTTPTransport per request; /mcp POST/GET/DELETE = middleware → connect → handleRequest. Bearer-only (no cookies); CORS must pass requests without an Origin header. Mount in app.ts.
5. Tests (modules/mcp/router.test.ts): JSON-RPC initialize, tools/list, tools/call via app.request("/mcp"); 401 missing + revoked; get_project has no budget fields; list_secrets has no values; project A token cannot reach project B data.
6. Verify live with npx @modelcontextprotocol/inspector against localhost:8000/mcp using a token created in the UI. Document the .mcp.json client snippet in README. Finish with typecheck, test, check:fix, commit, push.
```

## Session 6 — Hardening + closeout

Prompt:

```text
Read docs/roadmap.md (Session 6). Closeout pass:

1. Migrate remaining project/task tests out of apps/api/src/app.test.ts into modules/<module>/router.test.ts with a shared mock helper; app.test.ts keeps only auth/profile/users/app-level tests. lexa audit --max 25 must report 0 high 0 warning.
2. README: replace template copy with Corvex feature overview, setup steps (env vars incl. SECRETS_ENCRYPTION_KEY, docker compose dev DB, migrate, dev), and the MCP client setup snippet.
3. Full manual verification per docs/corvex-plan.md "Verification" section; fix anything broken.
4. Update AGENTS.md Status section to "all Phase 1 + 2 modules done". Delete docs/roadmap.md — it is finished. Commit, push.
```

---

Sessions 1–2 are independent of 3–4 and could run in parallel worktrees; 4 needs 1–2 merged (detail screen renders those resources). 5 needs 2 (tokens). 6 is last.
