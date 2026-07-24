import { generateMcpToken, hashMcpToken } from "../../utils/mcp-token";
import { prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { withProjectActivity } from "../activities/services";
import type { CreateMcpTokenInput } from "./schema";

// ADR-0002: tokenHash never leaves the database layer.
const mcpTokenSelect = {
  id: true,
  name: true,
  createdAt: true,
  lastUsedAt: true,
  revoked: true,
} as const;

export async function listMcpTokens(projectId: string) {
  return {
    mcpTokens: await prisma.mcpToken.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: mcpTokenSelect,
    }),
  };
}

export async function findMcpTokenOrNull(projectId: string, tokenId: string) {
  return prisma.mcpToken.findFirst({
    where: { id: tokenId, projectId },
    select: { id: true },
  });
}

export async function createMcpToken(
  projectId: string,
  input: CreateMcpTokenInput,
  actor: ActivityActor,
) {
  // The raw token exists only in this response — the database stores its hash.
  const token = generateMcpToken();

  return withProjectActivity(
    actor,
    async (transaction) => ({
      mcpToken: await transaction.mcpToken.create({
        data: { name: input.name, tokenHash: hashMcpToken(token), projectId },
        select: mcpTokenSelect,
      }),
      token,
    }),
    ({ mcpToken }) => ({
      action: "Created",
      entityId: mcpToken.id,
      entityLabel: mcpToken.name,
      entityType: "McpToken",
      projectId,
    }),
  );
}

export async function revokeMcpToken(projectId: string, tokenId: string, actor: ActivityActor) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      mcpToken: await transaction.mcpToken.update({
        where: { id: tokenId },
        data: { revoked: true },
        select: mcpTokenSelect,
      }),
    }),
    ({ mcpToken }) => ({
      action: "Revoked",
      entityId: mcpToken.id,
      entityLabel: mcpToken.name,
      entityType: "McpToken",
      projectId,
    }),
  );
}
