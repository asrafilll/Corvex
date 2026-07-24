import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../app";
import { resetUnlockRateLimitForTests } from "./router";

describe("app password router", () => {
  beforeEach(() => {
    resetUnlockRateLimitForTests();
  });

  it("rejects a missing or tampered app session", async () => {
    const missingResponse = await app.request("/auth/session");
    const tamperedResponse = await app.request("/auth/session", {
      headers: { Cookie: "corvex_app_session=unlocked-v1.tampered" },
    });

    await expect(missingResponse.json()).resolves.toEqual({ error: "unauthorized" });
    await expect(tamperedResponse.json()).resolves.toEqual({ error: "unauthorized" });
    expect(missingResponse.status).toBe(401);
    expect(tamperedResponse.status).toBe(401);
  });

  it("unlocks with the app password and sets a browser-session cookie", async () => {
    const unlockResponse = await unlock("corvex");
    const setCookie = unlockResponse.headers.get("set-cookie");

    await expect(unlockResponse.json()).resolves.toEqual({ authenticated: true });
    expect(unlockResponse.status).toBe(200);
    expect(setCookie).toContain("corvex_app_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).not.toContain("Max-Age");
    expect(setCookie).not.toContain("Expires");

    const sessionResponse = await app.request("/auth/session", {
      headers: { Cookie: setCookie?.split(";")[0] ?? "" },
    });

    await expect(sessionResponse.json()).resolves.toEqual({ authenticated: true });
    expect(sessionResponse.status).toBe(200);
  });

  it("returns a generic error for a wrong password", async () => {
    const response = await unlock("this-is-not-the-password");

    await expect(response.json()).resolves.toEqual({ error: "incorrect_password" });
    expect(response.status).toBe(401);
  });

  it("rejects malformed password input before verification", async () => {
    const response = await unlock("x".repeat(257));

    expect(response.status).toBe(400);
  });

  it("rate-limits repeated wrong passwords", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await unlock("wrong", { "X-Forwarded-For": "192.0.2.10" });
      expect(response.status).toBe(401);
    }

    const response = await unlock("corvex", { "X-Forwarded-For": "192.0.2.10" });

    await expect(response.json()).resolves.toEqual({ error: "too_many_attempts" });
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("clears the app session when locked", async () => {
    const unlockResponse = await unlock("corvex");
    const cookie = unlockResponse.headers.get("set-cookie")?.split(";")[0] ?? "";
    const lockResponse = await app.request("/auth/lock", {
      headers: { Cookie: cookie },
      method: "POST",
    });

    await expect(lockResponse.json()).resolves.toEqual({ authenticated: false });
    expect(lockResponse.status).toBe(200);
    expect(lockResponse.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("does not allow an app session to replace an MCP token", async () => {
    const unlockResponse = await unlock("corvex");
    const cookie = unlockResponse.headers.get("set-cookie")?.split(";")[0] ?? "";
    const response = await app.request("/mcp", {
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
  });
});

function unlock(password: string, headers: Record<string, string> = {}) {
  return app.request("/auth/unlock", {
    body: JSON.stringify({ password }),
    headers: { "Content-Type": "application/json", ...headers },
    method: "POST",
  });
}
