// Isolate the transport dependency (@hono/mcp) behind one import so a future
// swap only touches this file. See docs/corvex-plan.md Phase 2.
export { StreamableHTTPTransport } from "@hono/mcp";
