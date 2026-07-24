import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./index";

const productionEnv = {
  APP_PASSWORD_HASH:
    "scrypt$cHJvZHVjdGlvbi1zYWx0LTE$uEYmT-V0oUoyO2f3nVGfM1-VJNXR6qExGEuaqMmz8XSlG5Xrd6mruoR-a4f8qwIBY1cufTfhqjeQ-CKYWUxW4w",
  APP_SESSION_SECRET: "a-production-session-secret-32-chars",
  CLIENT_ORIGINS: "http://localhost:3000",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:15432/corvex?schema=public",
  NODE_ENV: "production",
  REDIS_URL: "redis://localhost:16379",
  SECRETS_ENCRYPTION_KEY: "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100",
} satisfies NodeJS.ProcessEnv;

describe("server environment config", () => {
  it("rejects the default app password hash in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        APP_PASSWORD_HASH:
          "scrypt$Y29ydmV4LWRldi1zYWx0IQ$M6irG4c6XtX2Ri7KoOXCDEvwGFfiUOve78LuH9UlSJF1KznGiQpecgof3sBLe1lz7XeA4ubdifcaBYMcvXWQhA",
      }),
    ).toThrow("APP_PASSWORD_HASH must be changed in production.");
  });

  it("rejects malformed app password hashes", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        APP_PASSWORD_HASH: "not-a-password-hash",
      }),
    ).toThrow("APP_PASSWORD_HASH must be a valid Corvex scrypt hash.");
  });

  it("rejects short app session secrets in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        APP_SESSION_SECRET: "short-secret",
      }),
    ).toThrow("APP_SESSION_SECRET must be at least 32 characters in production.");
  });

  it("accepts strong app-password settings in production", () => {
    expect(() => parseServerEnv(productionEnv)).not.toThrow();
  });

  it("rejects the default secrets encryption key in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        SECRETS_ENCRYPTION_KEY: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      }),
    ).toThrow("SECRETS_ENCRYPTION_KEY must be changed in production.");
  });

  it("rejects invalid secrets encryption keys in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        SECRETS_ENCRYPTION_KEY: "short",
      }),
    ).toThrow("SECRETS_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.");
  });
});
