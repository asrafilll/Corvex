import { Hono } from "hono";
import type { AuthVariables } from "../auth/middleware";
import { type McpVariables, mcpTokenAuth } from "./middleware";
import { buildMcpServer } from "./server";
import { StreamableHTTPTransport } from "./transport";

// Stateless: a fresh McpServer + transport per request, no session ids — fine at
// single-user scale. /mcp handles POST (JSON-RPC), GET (SSE), and DELETE.
export const mcpRouter = new Hono<{ Variables: AuthVariables & McpVariables }>()
  .use("*", mcpTokenAuth)
  .all("/", async (c) => {
    const server = buildMcpServer(c.get("mcpProjectId"));
    const transport = new StreamableHTTPTransport({ enableJsonResponse: true });

    await server.connect(transport);

    return (await transport.handleRequest(c)) ?? c.body(null, 204);
  });
