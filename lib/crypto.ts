import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

export async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const wanted = Buffer.from(expected, "hex");
  return wanted.length === actual.length && timingSafeEqual(wanted, actual);
}

export function safeSecretEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function inventoryKey() {
  const configured = process.env.INVENTORY_ENCRYPTION_KEY;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("INVENTORY_ENCRYPTION_KEY must be configured in production.");
    }
    return Buffer.alloc(32, 7);
  }
  const key = Buffer.from(configured, "base64");
  if (key.length !== 32) throw new Error("INVENTORY_ENCRYPTION_KEY must be a base64-encoded 32 byte key.");
  return key;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", inventoryKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(payload: string) {
  const [ivEncoded, tagEncoded, encrypted] = payload.split(".");
  if (!ivEncoded || !tagEncoded || !encrypted) throw new Error("Invalid encrypted payload.");
  const decipher = createDecipheriv("aes-256-gcm", inventoryKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}
