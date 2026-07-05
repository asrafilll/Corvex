import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./index";

const productionEnv = {
  BETTER_AUTH_URL: "http://localhost:8000",
  CLIENT_ORIGINS: "http://localhost:3000,http://localhost:4000",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:15432/monorepo_template?schema=public",
  NODE_ENV: "production",
  REDIS_URL: "redis://localhost:16379",
  SECRETS_ENCRYPTION_KEY: "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100",
} satisfies NodeJS.ProcessEnv;

describe("server environment config", () => {
  it("rejects the default auth secret in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        BETTER_AUTH_SECRET: "dev-change-me",
      }),
    ).toThrow("BETTER_AUTH_SECRET must be changed in production.");
  });

  it("rejects short auth secrets in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        BETTER_AUTH_SECRET: "short-secret",
      }),
    ).toThrow("BETTER_AUTH_SECRET must be at least 32 characters in production.");
  });

  it("accepts a strong auth secret in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        BETTER_AUTH_SECRET: "a-production-secret-with-32-chars",
      }),
    ).not.toThrow();
  });

  it("rejects the default secrets encryption key in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        BETTER_AUTH_SECRET: "a-production-secret-with-32-chars",
        SECRETS_ENCRYPTION_KEY: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      }),
    ).toThrow("SECRETS_ENCRYPTION_KEY must be changed in production.");
  });

  it("rejects invalid secrets encryption keys in production", () => {
    expect(() =>
      parseServerEnv({
        ...productionEnv,
        BETTER_AUTH_SECRET: "a-production-secret-with-32-chars",
        SECRETS_ENCRYPTION_KEY: "short",
      }),
    ).toThrow("SECRETS_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.");
  });
});
