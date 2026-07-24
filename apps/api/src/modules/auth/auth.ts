import { appConfig, appPasswordConfig } from "@repo/config";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Context } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";

const scrypt = promisify(nodeScrypt);
const sessionCookieName = "corvex_app_session";
const sessionValue = "unlocked-v1";

export async function hashAppPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyAppPassword(password: string) {
  const [algorithm, encodedSalt, encodedHash, extra] = appPasswordConfig.passwordHash.split("$");

  if (algorithm !== "scrypt" || !encodedSalt || !encodedHash || extra !== undefined) {
    return false;
  }

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const storedHash = Buffer.from(encodedHash, "base64url");
    const suppliedHash = (await scrypt(password, salt, storedHash.length)) as Buffer;

    return suppliedHash.length === storedHash.length && timingSafeEqual(suppliedHash, storedHash);
  } catch {
    return false;
  }
}

export async function readAppSession(c: Context) {
  const value = await getSignedCookie(c, appPasswordConfig.sessionSecret, sessionCookieName);

  return value === sessionValue;
}

export async function startAppSession(c: Context) {
  await setSignedCookie(c, sessionCookieName, sessionValue, appPasswordConfig.sessionSecret, {
    httpOnly: true,
    path: "/",
    sameSite: "Strict",
    secure: appConfig.isProduction,
  });
}

export function endAppSession(c: Context) {
  deleteCookie(c, sessionCookieName, {
    path: "/",
    secure: appConfig.isProduction,
  });
}
