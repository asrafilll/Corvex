import { z } from "zod";

export const mcpTokenParamSchema = z.object({
  projectId: z.string().trim().min(1),
  tokenId: z.string().trim().min(1),
});

export const projectMcpTokensParamSchema = mcpTokenParamSchema.pick({ projectId: true });

export const createMcpTokenSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export type CreateMcpTokenInput = z.infer<typeof createMcpTokenSchema>;
