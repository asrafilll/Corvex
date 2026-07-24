# ADR-0003: Activity is append-only safe metadata

## Decision

Every meaningful Project mutation creates an **Activity** record in the same database transaction as the mutation. Activity is read-only through the API and attributes the change to either the app session or the authenticated project-scoped **MCP Token**.

Activity stores only server-generated fields: actor type, MCP Token ID and name, action, entity type, entity ID and label, and timestamp. It never stores request bodies, field-diff payloads, Payment amounts, Secret values or ciphertext, token hashes, or raw MCP Tokens.

## Why

- App and MCP changes need one trustworthy history for debugging and accountability.
- Atomic writes prevent a successful mutation from existing without its corresponding Activity record.
- An explicit allowlist prevents the ledger from becoming a second store for sensitive data.

## Consequences

- Activity has no PATCH or DELETE route; deleting its Project removes it by cascade.
- MCP-authored Activity remains scoped to the Project selected by bearer authentication.
- Entity labels are snapshots so history remains readable after the source entity is renamed or deleted.
- Detailed field diffs are intentionally unavailable; adding them requires a new security review.
