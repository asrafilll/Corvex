import type { Context, Next } from "hono";
import { auth, type AuthSession, type AuthUser } from "./auth";

export type AuthVariables = {
  session: AuthSession | null;
  user: AuthUser | null;
};

export async function loadAuthSession(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("session", session?.session ?? null);
  c.set("user", session?.user ?? null);

  await next();
}

export function requireAdmin(c: Context<{ Variables: AuthVariables }>) {
  const user = c.get("user");

  if (!user?.role?.split(",").includes("admin")) {
    return null;
  }

  return user;
}

export function requireUser(c: Context<{ Variables: AuthVariables }>) {
  return c.get("user");
}
