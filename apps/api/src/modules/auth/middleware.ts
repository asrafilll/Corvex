import type { Context, Next } from "hono";
import { readAppSession } from "./auth";

export type AppAuthVariables = {
  appAuthenticated: boolean;
};

export async function loadAppSession(c: Context<{ Variables: AppAuthVariables }>, next: Next) {
  if (c.req.path === "/mcp" || c.req.path.startsWith("/mcp/")) {
    c.set("appAuthenticated", false);
    await next();
    return;
  }

  c.set("appAuthenticated", await readAppSession(c));
  await next();
}

export function requireAppSession(c: Context<{ Variables: AppAuthVariables }>) {
  return c.get("appAuthenticated") === true;
}
