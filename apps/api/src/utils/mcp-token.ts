import { createHash, randomBytes } from "node:crypto";

export const mcpTokenPrefix = "cvx_";

export function generateMcpToken() {
  return `${mcpTokenPrefix}${randomBytes(32).toString("base64url")}`;
}

export function hashMcpToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
