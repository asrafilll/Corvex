# Session 6 — Hardening + closeout (in progress)

Final session. Full spec lives in `docs/roadmap.md` (Session 6). This file tracks
progress so we can resume. Delete this file (and `roadmap.md`) when Session 6 is done.

## Tasks

- [ ] **1. Migrate tests out of `app.test.ts`.** Move the remaining project/task
      tests from `apps/api/src/app.test.ts` into `modules/<module>/router.test.ts`
      using a shared mock helper. `app.test.ts` keeps only app-level tests;
      app-password tests stay in `modules/auth/router.test.ts`. Gate: `lexa audit --max 25` reports **0 high, 0 warning**
      (it currently flags `app.test.ts` at 854 lines).
      - New per-module tests already exist for milestones/payments/project-notes/
        secrets/mcp-tokens/mcp; projects + tasks are the ones still living in
        `app.test.ts`.
      - Follow the mock pattern in `modules/mcp/router.test.ts` /
        `modules/mcp-tokens/router.test.ts` (hoisted `vi.fn()` mocks, `vi.mock`
      of `../../utils/prisma` and `readAppSession`, with `baseDate`
      from `src/test/helpers.ts`). Consider extracting a shared mock helper.

- [x] **2. README rewrite.** DONE (uncommitted). Replaced template copy with a
      Corvex overview, setup (app-password hash plus both secrets, dev DB compose,
      `db:generate`/`db:migrate`), env table, and the MCP
      client `.mcp.json` snippet. Verified var names, script names, platform port
      3000, ADR filename.

- [ ] **3. Full manual verification.** Run the `docs/corvex-plan.md`
      "Verification" checklist end-to-end and fix anything broken:
      1. `pnpm --filter @repo/api db:migrate` clean against local Postgres, then generate.
      2. `pnpm typecheck` workspace-wide.
      3. `pnpm test`.
      4. Manual flow: customer -> project -> tasks/milestones/payments/notes/secret;
         reveal a secret **after an API restart** (proves env key wiring); create MCP token.
      5. MCP: inspector / curl JSON-RPC at `/mcp` with a Bearer token — tool list,
         task create/update, cross-project isolation.

- [ ] **4. Closeout.** Update `AGENTS.md` Status to "all Phase 1 + 2 modules done".
      Delete `docs/roadmap.md` (finished) and this file. Commit + push.

## Notes / state at pause

- Session 5 (MCP server) is committed + pushed (`ec772f4`).
- README change from task 2 is staged/unstaged locally, **not committed** — batch it
  into the Session 6 closeout commit (task 4), or commit separately if preferred.
- Untracked prototype leftovers intentionally excluded from commits:
  `apps/platform/src/modules/style-prototype/`, `apps/platform/src/routes/prototype-styles.tsx`.
  Decide during closeout whether to delete or keep them.
- Dev env: API `:8010`, platform `:3002` locally (defaults are 8000 / 3000; the
  local overrides exist because the shared template DB/ports are occupied). Config in
  gitignored root `.env`.
