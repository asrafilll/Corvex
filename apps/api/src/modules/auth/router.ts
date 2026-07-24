import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";
import { endAppSession, startAppSession, verifyAppPassword } from "./auth";
import { type AppAuthVariables, requireAppSession } from "./middleware";
import { unlockSchema } from "./schema";

const maximumFailures = 5;
const failureWindowMs = 15 * 60 * 1000;
const maximumTrackedClients = 1_000;
const failuresByClient = new Map<string, { count: number; firstFailureAt: number }>();

export const appAuthRouter = new Hono<{ Variables: AppAuthVariables }>()
  .get("/session", (c) => {
    if (!requireAppSession(c)) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json({ authenticated: true as const }, 200);
  })
  .post("/unlock", zValidator("json", unlockSchema), async (c) => {
    const clientKey = getClientKey(c);
    const retryAfter = getRetryAfter(clientKey);

    if (retryAfter !== null) {
      c.header("Retry-After", retryAfter.toString());
      return c.json({ error: "too_many_attempts" }, 429);
    }

    const { password } = c.req.valid("json");

    if (!(await verifyAppPassword(password))) {
      recordFailure(clientKey);
      return c.json({ error: "incorrect_password" }, 401);
    }

    failuresByClient.delete(clientKey);
    await startAppSession(c);

    return c.json({ authenticated: true as const }, 200);
  })
  .post("/lock", (c) => {
    endAppSession(c);
    return c.json({ authenticated: false as const }, 200);
  });

function getClientKey(c: Context) {
  const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const proxyAddress = c.req.header("cf-connecting-ip")?.trim();
  const candidate = proxyAddress || forwardedFor;

  if (!candidate || candidate.length > 64) {
    return "unknown";
  }

  if (!failuresByClient.has(candidate) && failuresByClient.size >= maximumTrackedClients) {
    return "overflow";
  }

  return candidate;
}

function getRetryAfter(clientKey: string) {
  const failure = failuresByClient.get(clientKey);

  if (!failure || failure.count < maximumFailures) {
    return null;
  }

  const elapsed = Date.now() - failure.firstFailureAt;

  if (elapsed >= failureWindowMs) {
    failuresByClient.delete(clientKey);
    return null;
  }

  return Math.ceil((failureWindowMs - elapsed) / 1_000);
}

function recordFailure(clientKey: string) {
  const failure = failuresByClient.get(clientKey);

  if (!failure || Date.now() - failure.firstFailureAt >= failureWindowMs) {
    failuresByClient.set(clientKey, { count: 1, firstFailureAt: Date.now() });
    return;
  }

  failure.count += 1;
}

export function resetUnlockRateLimitForTests() {
  failuresByClient.clear();
}
