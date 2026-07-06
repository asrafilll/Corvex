import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const mcpTokensClient = apiClient.projects[":projectId"]["mcp-tokens"];

export type CreateMcpTokenInput = InferRequestType<typeof mcpTokensClient.$post>["json"];

export async function createMcpToken(projectId: string, input: CreateMcpTokenInput) {
  const response = await mcpTokensClient.$post({ param: { projectId }, json: input });

  if (!response.ok) {
    throw new Error("Failed to create the token.");
  }

  return response.json();
}

export async function revokeMcpToken(projectId: string, tokenId: string) {
  const response = await mcpTokensClient[":tokenId"].revoke.$post({
    param: { projectId, tokenId },
  });

  if (!response.ok) {
    throw new Error("Failed to revoke the token.");
  }

  return (await response.json()).mcpToken;
}
