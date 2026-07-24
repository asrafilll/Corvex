import type { Context, Next } from "hono";
import { hashMcpToken, mcpTokenPrefix } from "../../utils/mcp-token";
import { prisma } from "../../utils/prisma";

export type McpVariables = {
  mcpProjectId: string;
  mcpTokenId: string;
  mcpTokenName: string;
};

// Only refresh lastUsedAt when it is at least this stale, so a chatty agent
// does not write to the row on every tool call.
const lastUsedThrottleMs = 60_000;

// Bearer-only, independent of cookies: the token alone determines the project
// (ADR-0002). A leaked or hijacked token can reach exactly one project.
export async function mcpTokenAuth(c: Context<{ Variables: McpVariables }>, next: Next) {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!token?.startsWith(mcpTokenPrefix)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const record = await prisma.mcpToken.findUnique({
    where: { tokenHash: hashMcpToken(token) },
    select: { id: true, name: true, projectId: true, revoked: true, lastUsedAt: true },
  });

  if (!record || record.revoked) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const now = Date.now();
  if (!record.lastUsedAt || now - record.lastUsedAt.getTime() > lastUsedThrottleMs) {
    await prisma.mcpToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date(now) },
    });
  }

  c.set("mcpProjectId", record.projectId);
  c.set("mcpTokenId", record.id);
  c.set("mcpTokenName", record.name);

  await next();
}
