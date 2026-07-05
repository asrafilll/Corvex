import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { secretsConfig } from "@repo/config";

const algorithm = "aes-256-gcm";
const ivLength = 12;
const keyLength = 32;
const version = "v1";

const masterKey = decodeKey(secretsConfig.encryptionKey);

export function encryptSecret(value: string, key = masterKey) {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    version,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    authTag.toString("base64url"),
  ].join(".");
}

export function decryptSecret(encryptedValue: string, key = masterKey) {
  const [secretVersion, iv, ciphertext, authTag] = encryptedValue.split(".");

  if (secretVersion !== version || !iv || !ciphertext || !authTag) {
    throw new Error("Invalid secret format.");
  }

  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function decodeKey(value: string) {
  const key = /^[0-9a-f]{64}$/i.test(value)
    ? Buffer.from(value, "hex")
    : Buffer.from(value, "base64");

  if (key.length !== keyLength) {
    throw new Error("SECRETS_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.");
  }

  return key;
}
