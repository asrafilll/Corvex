# Secrets are encrypted app-level and values are revealed in the UI only

Corvex stores client credentials (SSH, API keys, CMS logins) per project. They are encrypted at rest with AES-256-GCM using a 32-byte master key from the environment (`SECRETS_ENCRYPTION_KEY`), in a versioned format `v1.<iv>.<ciphertext>.<tag>` to leave a key-rotation path. Secret values are returned by exactly one endpoint — a POST reveal used by the web UI — and are never exposed through MCP tools; MCP sees names and descriptions only.

## Considered Options

- **Plaintext in notes** — rejected: a DB dump leaks every client credential, and MCP would feed them into LLM context.
- **MCP-readable secrets (opt-in flag)** — rejected for v1: prompt injection in a connected codebase could exfiltrate credentials; can be revisited per-secret later without changing the storage format.

## Consequences

- Secrets are environment-bound: values encrypted with the dev key cannot be decrypted in production.
- Losing the master key means losing all secret values.
- The reveal endpoint is POST (never GET) so values never land in URL logs; secret routes must be excluded from any body logging.
