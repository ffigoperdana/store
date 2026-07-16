const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;

export type Base32ValidationCode =
  | "EMPTY_SECRET"
  | "INVALID_CHARACTERS"
  | "INVALID_LENGTH";

export interface Base32ValidationResult {
  isValid: boolean;
  normalizedSecret: string;
  code: Base32ValidationCode | null;
}

export interface TotpOptions {
  digits?: number;
  periodSeconds?: number;
}

export interface TotpTiming {
  counter: number;
  periodStartedAt: number;
  expiresAt: number;
  remainingMilliseconds: number;
  remainingSeconds: number;
  remainingRatio: number;
}

export interface TotpPair extends TotpTiming {
  currentCode: string;
  nextCode: string;
}

export class TotpSecretError extends Error {
  readonly code: Base32ValidationCode;

  constructor(code: Base32ValidationCode) {
    const messages: Record<Base32ValidationCode, string> = {
      EMPTY_SECRET: "A Base32 secret is required.",
      INVALID_CHARACTERS: "The secret contains characters outside Base32.",
      INVALID_LENGTH: "The secret has an invalid Base32 length.",
    };

    super(messages[code]);
    this.name = "TotpSecretError";
    this.code = code;
  }
}

/**
 * Makes secrets copied from authenticator setup screens interoperable without
 * weakening Base32 validation. Whitespace, grouping hyphens, casing, and
 * trailing RFC 4648 padding are presentation details, so they are removed.
 */
export function normalizeBase32Secret(secret: string): string {
  return secret
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "")
    .replace(/=+$/, "");
}

export function validateBase32Secret(
  secret: string,
): Base32ValidationResult {
  const normalizedSecret = normalizeBase32Secret(secret);

  if (!normalizedSecret) {
    return {
      isValid: false,
      normalizedSecret,
      code: "EMPTY_SECRET",
    };
  }

  if (/[^A-Z2-7]/.test(normalizedSecret)) {
    return {
      isValid: false,
      normalizedSecret,
      code: "INVALID_CHARACTERS",
    };
  }

  // Valid unpadded Base32 can only have these remainders. A remainder of 1,
  // 3, or 6 cannot contain a whole number of source bytes.
  if ([1, 3, 6].includes(normalizedSecret.length % 8)) {
    return {
      isValid: false,
      normalizedSecret,
      code: "INVALID_LENGTH",
    };
  }

  return {
    isValid: true,
    normalizedSecret,
    code: null,
  };
}

export function decodeBase32Secret(secret: string): Uint8Array {
  const validation = validateBase32Secret(secret);

  if (!validation.isValid || validation.code) {
    throw new TotpSecretError(validation.code ?? "INVALID_CHARACTERS");
  }

  const output: number[] = [];
  let buffer = 0;
  let bufferedBits = 0;

  for (const character of validation.normalizedSecret) {
    buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(character);
    bufferedBits += 5;

    if (bufferedBits >= 8) {
      bufferedBits -= 8;
      output.push((buffer >>> bufferedBits) & 0xff);
      buffer &= (1 << bufferedBits) - 1;
    }
  }

  return new Uint8Array(output);
}

function assertDigits(digits: number): void {
  if (!Number.isInteger(digits) || digits < 1 || digits > 10) {
    throw new RangeError("TOTP digits must be an integer from 1 through 10.");
  }
}

function assertPeriod(periodSeconds: number): void {
  if (!Number.isInteger(periodSeconds) || periodSeconds <= 0) {
    throw new RangeError("The TOTP period must be a positive integer.");
  }
}

function assertTimestamp(timestampMilliseconds: number): void {
  if (!Number.isFinite(timestampMilliseconds) || timestampMilliseconds < 0) {
    throw new RangeError("The timestamp must be a non-negative finite number.");
  }
}

function counterToBytes(counter: number): Uint8Array {
  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new RangeError("The HOTP counter must be a non-negative safe integer.");
  }

  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  const high = Math.floor(counter / 0x1_0000_0000);
  const low = counter % 0x1_0000_0000;

  view.setUint32(0, high, false);
  view.setUint32(4, low, false);
  return bytes;
}

function getSubtleCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable in this browser.");
  }

  return globalThis.crypto.subtle;
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const keyBytes = decodeBase32Secret(secret);

  return subtle.importKey(
    "raw",
    copyToArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
}

async function generateHotpWithKey(
  key: CryptoKey,
  counter: number,
  digits: number,
): Promise<string> {
  const digest = new Uint8Array(
    await getSubtleCrypto().sign(
      "HMAC",
      key,
      copyToArrayBuffer(counterToBytes(counter)),
    ),
  );
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    (digest[offset] & 0x7f) * 0x1_000_000 +
    digest[offset + 1] * 0x1_0000 +
    digest[offset + 2] * 0x100 +
    digest[offset + 3];
  const code = binaryCode % 10 ** digits;

  return code.toString().padStart(digits, "0");
}

/** Generates an RFC 4226 HOTP value using the RFC 6238 SHA-1 primitive. */
export async function generateHotp(
  secret: string,
  counter: number,
  digits = TOTP_DIGITS,
): Promise<string> {
  assertDigits(digits);
  const key = await importHmacKey(secret);
  return generateHotpWithKey(key, counter, digits);
}

export function getTotpTiming(
  timestampMilliseconds = Date.now(),
  periodSeconds = TOTP_PERIOD_SECONDS,
): TotpTiming {
  assertTimestamp(timestampMilliseconds);
  assertPeriod(periodSeconds);

  const periodMilliseconds = periodSeconds * 1_000;
  const counter = Math.floor(timestampMilliseconds / periodMilliseconds);
  const periodStartedAt = counter * periodMilliseconds;
  const expiresAt = periodStartedAt + periodMilliseconds;
  const remainingMilliseconds = Math.max(
    0,
    expiresAt - timestampMilliseconds,
  );

  return {
    counter,
    periodStartedAt,
    expiresAt,
    remainingMilliseconds,
    remainingSeconds: Math.max(1, Math.ceil(remainingMilliseconds / 1_000)),
    remainingRatio: remainingMilliseconds / periodMilliseconds,
  };
}

export async function generateTotp(
  secret: string,
  timestampMilliseconds = Date.now(),
  options: TotpOptions = {},
): Promise<string> {
  const digits = options.digits ?? TOTP_DIGITS;
  const periodSeconds = options.periodSeconds ?? TOTP_PERIOD_SECONDS;
  assertDigits(digits);
  const timing = getTotpTiming(timestampMilliseconds, periodSeconds);
  const key = await importHmacKey(secret);
  return generateHotpWithKey(key, timing.counter, digits);
}

/**
 * Generates both periods with a single in-memory CryptoKey. The key is not
 * cached, persisted, logged, or sent anywhere.
 */
export async function generateTotpPair(
  secret: string,
  timestampMilliseconds = Date.now(),
  options: TotpOptions = {},
): Promise<TotpPair> {
  const digits = options.digits ?? TOTP_DIGITS;
  const periodSeconds = options.periodSeconds ?? TOTP_PERIOD_SECONDS;
  assertDigits(digits);
  const timing = getTotpTiming(timestampMilliseconds, periodSeconds);
  const key = await importHmacKey(secret);
  const [currentCode, nextCode] = await Promise.all([
    generateHotpWithKey(key, timing.counter, digits),
    generateHotpWithKey(key, timing.counter + 1, digits),
  ]);

  return { ...timing, currentCode, nextCode };
}
