import { generateMcpToken, hashMcpToken } from "../../utils/mcp-token";
import { prisma } from "../../utils/prisma";
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

export async function createMcpToken(projectId: string, input: CreateMcpTokenInput) {
  // The raw token exists only in this response — the database stores its hash.
  const token = generateMcpToken();

  return {
    mcpToken: await prisma.mcpToken.create({
      data: { name: input.name, tokenHash: hashMcpToken(token), projectId },
      select: mcpTokenSelect,
    }),
    token,
  };
}

export async function revokeMcpToken(tokenId: string) {
  return {
    mcpToken: await prisma.mcpToken.update({
      where: { id: tokenId },
      data: { revoked: true },
      select: mcpTokenSelect,
    }),
  };
}
