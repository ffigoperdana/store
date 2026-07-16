import assert from "node:assert/strict";
import test from "node:test";

// Node's native TypeScript test runner needs the explicit source extension.
// @ts-expect-error -- TypeScript's noEmit build resolves this file through Node at runtime.
import * as totpModule from "../lib/totp.ts";

const {
  decodeBase32Secret,
  generateHotp,
  generateTotp,
  generateTotpPair,
  getTotpTiming,
  normalizeBase32Secret,
  TotpSecretError,
  validateBase32Secret,
} = totpModule;

const RFC_SHA1_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("normalizes common Base32 presentation characters", () => {
  assert.equal(
    normalizeBase32Secret("  jbsw-y3dp ehpk3pxp====  "),
    "JBSWY3DPEHPK3PXP",
  );
});

test("validates empty, invalid-character, and impossible-length secrets", () => {
  assert.deepEqual(validateBase32Secret("  "), {
    isValid: false,
    normalizedSecret: "",
    code: "EMPTY_SECRET",
  });
  assert.equal(validateBase32Secret("JBSW0Y3D").code, "INVALID_CHARACTERS");
  assert.equal(validateBase32Secret("A").code, "INVALID_LENGTH");
  assert.equal(validateBase32Secret("JBSWY3DP").isValid, true);
});

test("decodes the RFC 4648 Base32 example", () => {
  const decoded = decodeBase32Secret("JBSWY3DPEBLW64TMMQQQ====");
  assert.equal(new TextDecoder().decode(decoded), "Hello World!");
});

test("throws a typed error before attempting crypto for invalid secrets", () => {
  assert.throws(
    () => decodeBase32Secret("NOT-BASE32-0"),
    (error: unknown) =>
      error instanceof TotpSecretError &&
      error.code === "INVALID_CHARACTERS",
  );
});

test("matches all RFC 4226 HOTP SHA-1 counters", async () => {
  const expected = [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489",
  ];

  for (const [counter, code] of expected.entries()) {
    assert.equal(await generateHotp(RFC_SHA1_SECRET, counter), code);
  }
});

test("matches RFC 6238 TOTP SHA-1 vectors", async () => {
  const vectors = [
    [59, "94287082"],
    [1_111_111_109, "07081804"],
    [1_111_111_111, "14050471"],
    [1_234_567_890, "89005924"],
    [2_000_000_000, "69279037"],
    [20_000_000_000, "65353130"],
  ] as const;

  for (const [timestampSeconds, code] of vectors) {
    assert.equal(
      await generateTotp(RFC_SHA1_SECRET, timestampSeconds * 1_000, {
        digits: 8,
      }),
      code,
    );
  }
});

test("returns current and next 30-second, six-digit values together", async () => {
  const pair = await generateTotpPair(RFC_SHA1_SECRET, 59_000);
  assert.equal(pair.currentCode, "287082");
  assert.equal(pair.nextCode, "359152");
  assert.equal(pair.counter, 1);
  assert.equal(pair.remainingSeconds, 1);
});

test("reports stable countdown timing at a boundary and within a period", () => {
  assert.deepEqual(getTotpTiming(30_000), {
    counter: 1,
    periodStartedAt: 30_000,
    expiresAt: 60_000,
    remainingMilliseconds: 30_000,
    remainingSeconds: 30,
    remainingRatio: 1,
  });

  const timing = getTotpTiming(59_250);
  assert.equal(timing.counter, 1);
  assert.equal(timing.remainingMilliseconds, 750);
  assert.equal(timing.remainingSeconds, 1);
  assert.equal(timing.remainingRatio, 0.025);
});

test("rejects unsafe counters and invalid generation options", async () => {
  await assert.rejects(
    generateHotp(RFC_SHA1_SECRET, -1),
    /non-negative safe integer/,
  );
  await assert.rejects(
    generateTotp(RFC_SHA1_SECRET, 0, { digits: 0 }),
    /digits must be an integer/,
  );
  assert.throws(() => getTotpTiming(0, 0), /positive integer/);
});
