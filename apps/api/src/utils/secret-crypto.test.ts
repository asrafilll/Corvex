import { describe, expect, it } from "vitest";
import { decodeKey, decryptSecret, encryptSecret } from "./secret-crypto";

const key = decodeKey("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
const otherKey = decodeKey("1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100");

describe("secret crypto", () => {
  it("round-trips secret values", () => {
    const encrypted = encryptSecret("staging-password", key);

    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(decryptSecret(encrypted, key)).toBe("staging-password");
  });

  it("uses a unique iv per encryption", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("rejects tampered values", () => {
    const encrypted = encryptSecret("secret", key);
    const tampered = `${encrypted.slice(0, -1)}A`;

    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  it("rejects the wrong key", () => {
    const encrypted = encryptSecret("secret", key);

    expect(() => decryptSecret(encrypted, otherKey)).toThrow();
  });

  it("rejects bad formats", () => {
    expect(() => decryptSecret("secret", key)).toThrow("Invalid secret format.");
    expect(() => decodeKey("short")).toThrow("SECRETS_ENCRYPTION_KEY");
  });
});
