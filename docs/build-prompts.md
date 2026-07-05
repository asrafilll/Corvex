# Corvex Build Prompts

Copy-paste one prompt per agent session, in order. Each assumes AGENTS.md is auto-loaded and finishes with the Definition of done. Don't start a prompt until the previous one is merged.

---

## Prompt 1 — Foundations: theme, encryption, schema

```text
Read CONTEXT.md, docs/corvex-plan.md (Phase 1 §1 "Foundations"), and docs/adr/0001. Then:

1. Apply the theme: replace the `:root` and `.dark` variable blocks in packages/ui/src/styles.css with the exact values from .claude/skills/corvex-design/THEME.md. Leave `@theme inline` untouched.
2. packages/config: add SECRETS_ENCRYPTION_KEY to the server env schema — dev default allowed, but superRefine like BETTER_AUTH_SECRET: in production it must be set, non-default, and decode to exactly 32 bytes (hex or base64). Export secretsConfig. Update .env.example.
3. Create apps/api/src/utils/secret-crypto.ts: encryptSecret/decryptSecret, AES-256-GCM, random 12-byte IV, output format "v1.<iv-b64>.<ct-b64>.<tag-b64>", authTag verified on decrypt, key length asserted at module load. Node crypto only — no new dependencies.
4. Append the Corvex models to apps/api/prisma/schema.prisma exactly as specified in docs/corvex-plan.md §1 (enums ProjectStatus/TaskStatus/TaskPriority; Customer, Project, Task, Milestone, Payment, Note, Secret, McpToken; cascade project→children, SetNull customer→project; Decimal(14,2) money). Don't touch the Better Auth models.
5. Start the dev DB (docker compose -f docker-compose.dev.yaml up -d), run pnpm db:migrate --name corvex_domain, then pnpm db:generate.
6. Tests for the crypto util: round-trip, unique IVs per call, tampered ciphertext throws, wrong key throws, malformed payload throws.

Scope guard: no API routes, no UI in this session.
```

## Prompt 2 — Core API: customers + projects

```text
Read CONTEXT.md and docs/corvex-plan.md (Phase 1 §2). Follow the module pattern in AGENTS.md (copy apps/api/src/modules/profile/ shape). Then:

1. Add requireUser to apps/api/src/modules/auth/middleware.ts (same shape as requireAdmin, any authenticated user).
2. modules/customers: GET /customers (list, include project counts), POST, GET /:id (with their projects), PATCH /:id, DELETE /:id.
3. modules/projects: GET /projects?status= (filter by ProjectStatus), POST, PATCH /:id, DELETE /:id, and GET /:id returning the full detail payload: customer, tasks ordered by `order`, milestones by date, payments plus computed paidTotal and outstanding (Prisma.Decimal math, .toString() before returning), notes, secrets metadata only (id/name/description), mcp tokens metadata only. Export a shared findProjectOrNull service for later modules.
4. Mount both routers in app.ts via .route() chaining (RPC AppType must pick them up).
5. Router tests per AGENTS.md test style: 401 unauth, CRUD happy paths, 404s, status filter, detail payload contains no encryptedValue and no tokenHash, money fields serialized as strings.

Scope guard: no tasks/milestones/payments/notes/secrets routes yet, no UI.
```

## Prompt 3 — Project sub-resources: tasks, milestones, payments, notes

```text
Read CONTEXT.md and docs/corvex-plan.md (Phase 1 §2, nested routes). Reuse findProjectOrNull from modules/projects; every route 404s if the project doesn't exist. Then:

1. modules/tasks under /projects/:projectId/tasks: GET (optional ?status=), POST, PATCH /:taskId, DELETE /:taskId, POST /reorder — accepts ordered task-id list, validates the id set exactly matches that project's tasks, renumbers `order` inside prisma.$transaction.
2. modules/milestones under /projects/:projectId/milestones: GET, POST, PATCH /:milestoneId (incl. done toggle), DELETE.
3. modules/payments under /projects/:projectId/payments: GET, POST, PATCH /:paymentId, DELETE. Amounts follow the Decimal rules in AGENTS.md.
4. modules/project-notes under /projects/:projectId/notes: GET, POST, PATCH /:noteId, DELETE.
5. Mount all in app.ts; zod enums mirror Prisma enums via exported arrays.
6. Router tests: 401, happy paths, 404 missing project, reorder rejects foreign/missing task ids, cross-project isolation (task under project A not reachable via project B).
```

## Prompt 4 — Secrets + MCP tokens API

```text
Read CONTEXT.md, docs/adr/0001, docs/adr/0002, docs/corvex-plan.md (Phase 1 §2). Use secret-crypto util and findProjectOrNull. Then:

1. modules/secrets under /projects/:projectId/secrets:
   - GET: id/name/description/timestamps ONLY — never select encryptedValue.
   - POST: validates name unique per project, encrypts value.
   - PATCH /:secretId: re-encrypts when value present, else metadata only.
   - DELETE /:secretId.
   - POST /:secretId/reveal: returns decrypted value (POST, never GET).
   Ensure no logging middleware captures bodies on these routes.
2. modules/mcp-tokens under /projects/:projectId/mcp-tokens:
   - GET: metadata (id, name, createdAt, lastUsedAt, revoked).
   - POST: generate "cvx_" + 32 random bytes base64url, store sha256 hex hash only, return the raw token in this response ONLY.
   - POST /:tokenId/revoke.
3. Mount in app.ts.
4. Tests: list never contains encryptedValue or tokenHash; reveal round-trips a stored secret; duplicate secret name in same project 409s (ok in different projects); token create response contains raw cvx_ token while DB mock receives only the hash; revoke works; 401/404 guards.
```

## Prompt 5 — Platform UI

```text
Invoke the corvex-design skill first and follow it strictly. Read CONTEXT.md and docs/corvex-plan.md (Phase 1 §3). Data access per AGENTS.md frontend rules (TanStack Query + @repo/api-client, i18n keys). Then, in apps/platform:

1. Add react-markdown + remark-gfm (platform only).
2. App shell nav: add Projects and Customers items (lucide icons, i18n labels).
3. routes/projects.index.tsx: project list — status filter tabs (All/Lead/Active/On hold/Completed/Cancelled), columns name/customer/deadline/budget, rows navigate to detail, "New project" dialog (name, customer select, status, deadline, budget+currency).
4. routes/projects.$projectId.tsx: dense detail page per the design skill — header (name, status Select inline-updating, deadline); cards: Customer, Budget (payments list, paid/outstanding, inline add-payment), Milestones (checklist w/ done toggle, add), Notes (markdown render, add/edit dialog); Tasks section grouped by status with inline add, priority badge, status change, reorder; Secrets card (masked values, Reveal button → POST reveal → show w/ copy, auto-rehide ~30s); MCP tokens card (list, create dialog showing raw token once with copy warning, revoke w/ confirm).
5. routes/customers.index.tsx + customers.$customerId.tsx: list w/ project counts, create/edit dialog, detail with contact info and their projects.
6. Query hooks per resource with mutations invalidating ["projects", projectId] (and list keys). Optimistic update for task status is welcome, not required.
7. Verify light AND dark mode. Definition of done applies; also run the app and click through the full flow: customer → project → task → payment → note → secret → token.
```

## Prompt 6 — MCP server (Phase 2)

```text
Read docs/adr/0002 and docs/corvex-plan.md (Phase 2). Then, in apps/api:

1. Add @modelcontextprotocol/sdk and @hono/mcp (pin versions).
2. modules/mcp/middleware.ts — mcpTokenAuth: parse Authorization Bearer cvx_ token, sha256 → mcpToken.findUnique by tokenHash, reject missing/revoked with 401, set mcpProjectId in context, update lastUsedAt only if >60s stale.
3. modules/mcp/server.ts — buildMcpServer(projectId) registering tools (zod schemas, all internally scoped to projectId, none accept a projectId param):
   get_project (details/status/deadline/customer name/milestones — NO budget, currency, or payments), list_tasks (status filter), get_task, create_task, update_task (title/description/status/priority/dueDate), list_notes, get_note, add_note, list_milestones, list_secrets (name+description only — never select encryptedValue).
4. modules/mcp/transport.ts + router.ts — stateless: fresh McpServer + StreamableHTTPTransport per request; /mcp POST/GET/DELETE = middleware → connect → transport.handleRequest. Bearer-only auth (no cookies). Confirm CORS passes requests without an Origin header. Mount in app.ts.
5. Tests: JSON-RPC initialize + tools/list + tools/call via app.request("/mcp"); 401 missing and revoked token; get_project payload has no budget fields; list_secrets has no values; token for project A cannot read project B.
6. Verify with npx @modelcontextprotocol/inspector against localhost:8000/mcp using a real token from the UI; document the .mcp.json client snippet in README.
```

---

Post-build: update README features section; consider /code-review before each merge.
