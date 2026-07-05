# MCP access is per-project token, and money never crosses MCP

An MCP client authenticates with a project-scoped bearer token (`cvx_…`, generated on the project page, stored as a sha256 hash, raw value shown once). Tools never accept a project id — the token determines the project — so an agent connected to one repo can only touch that repo's project. `get_project` deliberately omits budget, currency, and payments.

## Considered Options

- **One personal token + projectId tool params** — rejected: an agent (or a prompt-injected repo) could read and modify every project and all customer/pricing data.

## Consequences

- Blast radius of a leaked token or hijacked agent session is one project's tasks and notes.
- Asking cross-project questions ("what's overdue everywhere?") is a UI concern, not an MCP one — a personal token could be added later as a separate decision.
- Future readers will notice `get_project` lacks budget fields: that is deliberate, not an oversight.
