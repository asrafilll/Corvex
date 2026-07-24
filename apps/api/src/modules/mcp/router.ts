import { Hono } from "hono";
import { mcpActivityActor } from "../activities/services";
import { type McpVariables, mcpTokenAuth } from "./middleware";
import { buildMcpServer } from "./server";
import { StreamableHTTPTransport } from "./transport";

// Stateless: a fresh McpServer + transport per request, no session ids — fine at
// single-user scale. /mcp handles POST (JSON-RPC), GET (SSE), and DELETE.
export const mcpRouter = new Hono<{ Variables: McpVariables }>()
  .use("*", mcpTokenAuth)
  .all("/", async (c) => {
    const server = buildMcpServer(
      c.get("mcpProjectId"),
      mcpActivityActor(c.get("mcpTokenId"), c.get("mcpTokenName")),
    );
    const transport = new StreamableHTTPTransport({ enableJsonResponse: true });

    await server.connect(transport);

    return (await transport.handleRequest(c)) ?? c.body(null, 204);
  });
