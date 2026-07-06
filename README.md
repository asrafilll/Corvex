# Corvex

**One home for every client project — and a way to let your AI coding agent run tasks inside it.**

Corvex is a project management tool built for the solo operator: the freelancer,
consultant, or indie shop who runs several client projects at once and does the work
themselves. Instead of scattering a project across a task app, a notes doc, a
spreadsheet of payments, and a password manager, Corvex puts all of it in one place —
one **project** holds the customer, the status, the budget and what's been paid, the
tasks and milestones, the notes, and the credentials.

## What it's trying to accomplish

- **Kill the tool sprawl.** Everything about a piece of work lives on its project page.
  No hunting across five apps to answer "where does this stand and did they pay?"
- **Make the money legible.** Every project carries a budget and payment history, so
  paid vs. outstanding is always a glance away — not a spreadsheet you forgot to update.
- **Let the agent do the work.** Each project exposes its own MCP server. Point a
  coding agent (Claude Code, Cursor, etc.) at a project and it can read the project's
  context and manage its tasks on its own — while money and secret values stay locked
  to the UI and never leak to the agent.
- **Stay fast and dense.** Linear-flavored UI. Built for one person moving quickly, not
  for committees.

## Features

- **Projects** as the center of gravity — customer, status, budget, payments, tasks,
  milestones, markdown notes, and encrypted secrets, all on one page.
- **Customers** as first-class entities (1:N projects), optional per project so internal
  work is allowed.
- **Status lifecycle:** `Lead → Active ⇄ OnHold → Completed`, `Cancelled` from anywhere.
- **Budget & payments** tracked with exact `Decimal` math — paid and outstanding are
  derived, never guessed with JS floats.
- **Encrypted secrets** (AES-256-GCM at rest) revealed only in the UI.
- **Per-project MCP server** so an agent can work a single project autonomously.

## How it's scoped (single-user by design)

- **Single user.** No orgs, roles, or sharing. The platform app is the Corvex UI.
- **Customer** is its own entity, 1:N projects, optional on a project (internal work allowed).
- **Project status:** `Lead → Active ⇄ OnHold → Completed`, `Cancelled` from anywhere.
- **Budget** = `budgetAmount + currency` plus **Payment** records; paid/outstanding are derived with `Decimal`, never JS floats.
- **Secrets** are encrypted at rest (AES-256-GCM) and only ever revealed in the UI — never over MCP.
- **MCP** access is per-project token: task CRUD + read-only context, no money, no secret values. See [`docs/adr/0002`](docs/adr/0002-project-scoped-mcp-tokens-no-money-over-mcp.md).

## Stack

pnpm monorepo, source-only packages (no build step):

- `apps/api`: Hono API on Node.js, Prisma 7 + Postgres, Better Auth.
- `apps/platform`: React + Vite + TanStack Router (file routes) + TanStack Query — the Corvex UI.
- `apps/admin`: untouched template admin app.
- `packages/api-client`: typed Hono RPC client. `packages/ui`: shadcn components. `packages/config`: typed env. `packages/i18n`, `packages/logger`, `packages/telemetry`, `packages/storage`, `packages/worker`.

## Setup

```sh
pnpm install
cp .env.example .env

# Generate the two required secrets and set them in .env:
openssl rand -base64 32          # -> BETTER_AUTH_SECRET
openssl rand -hex 32             # -> SECRETS_ENCRYPTION_KEY (32 bytes)

docker compose -f docker-compose.dev.yaml up -d   # Postgres on :15432, Redis on :16379
pnpm db:generate
pnpm db:migrate
```

Create the single user, then sign in at the platform app:

```sh
pnpm createsuperuser
```

## Development

```sh
pnpm dev          # runs every app in apps/* in parallel
```

Or per app: `pnpm --filter @repo/platform dev`, `pnpm --filter @repo/api dev`.

Default local URLs: Platform `http://localhost:3000`, API `http://localhost:8000`
(health at `/health`), Postgres `localhost:15432`.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (dev DB on `:15432`). |
| `BETTER_AUTH_SECRET` | Auth signing key. Production rejects the default and anything under 32 chars. |
| `SECRETS_ENCRYPTION_KEY` | 32-byte hex or base64 AES-256-GCM master key for project secrets. Production rejects the default. |
| `BETTER_AUTH_URL` | Public API URL for auth callbacks. |
| `VITE_API_URL` | API base URL baked into the frontend bundle. |
| `CLIENT_ORIGINS` | Comma-separated browser origins allowed by CORS. |

`SECRETS_ENCRYPTION_KEY` is environment-bound: secrets encrypted with the dev key
cannot be decrypted under a different key, so a prod deploy needs its own key set
before any secret is stored. Revealing a secret after an API restart proves the key
is wired correctly.

## Tests

```sh
pnpm test         # Vitest suites across API, Platform, Admin, Worker
pnpm typecheck
pnpm check        # Biome lint + format
```

## Corvex MCP server

Each project can mint **project-scoped** MCP tokens (project detail page → MCP tokens). A token authenticates a coding agent against exactly one project: tools never accept a project id, so a leaked or hijacked token can only reach that project's tasks, notes, and metadata. Money never crosses MCP — `get_project` omits budget and payments, and `list_secrets` returns names and descriptions only, never values (see [`docs/adr/0002`](docs/adr/0002-project-scoped-mcp-tokens-no-money-over-mcp.md)).

The endpoint is stateless Streamable HTTP at `POST /mcp`, authenticated with a `Bearer cvx_…` token (no cookies). Point an MCP client at it via `.mcp.json`:

```json
{
  "mcpServers": {
    "corvex": {
      "type": "http",
      "url": "http://localhost:8000/mcp",
      "headers": { "Authorization": "Bearer cvx_your_token_here" }
    }
  }
}
```

Tools: `get_project`, `list_tasks`, `get_task`, `create_task`, `update_task`, `list_notes`, `get_note`, `add_note`, `list_milestones`, `list_secrets`.

Inspect it locally with the MCP Inspector (create a token in the UI first):

```sh
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP · URL: http://localhost:8000/mcp
# Auth: add header  Authorization: Bearer cvx_your_token_here
```

## Docker

```sh
cp .env.example .env
openssl rand -base64 32   # set BETTER_AUTH_SECRET
openssl rand -hex 32      # set SECRETS_ENCRYPTION_KEY
docker compose up --build
```

The full-stack Compose file starts Caddy, Postgres, Redis, API, and Worker. Caddy
serves the built frontend assets, reverse-proxies the API, and is the only public
service. The API container runs migrations with `pnpm db:deploy` on startup.
Containers read the single root `.env`; `DOCKER_DATABASE_URL` and `DOCKER_REDIS_URL`
point them at the Compose service names.

For production, set the public addresses before building so the frontend bundle and
auth settings point at the proxied API:

```env
PLATFORM_SITE_ADDRESS="app.example.com"
ADMIN_SITE_ADDRESS="admin.example.com"
API_SITE_ADDRESS="api.example.com"
VITE_API_URL="https://api.example.com"
BETTER_AUTH_URL="https://api.example.com"
CLIENT_ORIGINS="https://app.example.com,https://admin.example.com"
```
