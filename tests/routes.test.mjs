import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import test from "node:test";

const port = 4100 + (process.pid % 500);
const baseUrl = `http://127.0.0.1:${port}`;
let output = "";

const server = spawn(process.execPath, [".next/standalone/server.js"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    NODE_ENV: "production",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function waitUntilReady() {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The standalone server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(`Standalone server did not become ready.\n${output}`);
}

await waitUntilReady();

const tutorialAssets = [
  "step-02-redeem-form.png",
  "step-03-redeem-result.png",
  "step-06-recovery-email.png",
  "step-08-01-open-settings.png",
  "step-08-02-language-menu.png",
  "step-08-03-select-indonesian.png",
  "step-08-04-save-language.png",
  "step-13-open-manual-key.png",
  "step-14-fg-2fa.png",
];

test.after(() => {
  server.kill();
});

test("health endpoint is uncached and healthy", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "fg-store");
});

for (const [route, expectedText] of [
  ["/", "Semua layanan digital"],
  ["/redeem-gpt", "Ikuti 16 langkah"],
  ["/2fa", "2FA Code Generator"],
  ["/offline", "Koneksi internet terputus"],
]) {
  test(`${route} renders successfully`, async () => {
    const response = await fetch(`${baseUrl}${route}`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
    assert.match(html, new RegExp(expectedText, "i"));
  });
}

test("tutorial screenshots are present and stay inside the image budget", async () => {
  const projectRoot = new URL("..", import.meta.url);
  const sizes = await Promise.all(
    tutorialAssets.map(async (asset) => {
      const details = await stat(
        new URL(`public/tutorial/${asset}`, projectRoot),
      );

      assert.ok(details.size > 0, `${asset} should not be empty`);
      assert.ok(details.size < 400_000, `${asset} is too large`);
      return details.size;
    }),
  );

  assert.ok(
    sizes.reduce((total, size) => total + size, 0) < 1_200_000,
    "tutorial screenshot payload should stay below 1.2 MB",
  );
});

test("tutorial route renders every supplied screenshot with accessible captions", async () => {
  const response = await fetch(`${baseUrl}/redeem-gpt`);
  const html = await response.text();

  assert.equal(response.status, 200);
  for (const asset of tutorialAssets) {
    assert.match(html, new RegExp(asset.replaceAll(".", "\\.")));
  }

  assert.equal((html.match(/<figure/g) ?? []).length, tutorialAssets.length);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /src="\/tutorial\/step-13-open-manual-key\.png"/);
  assert.doesNotMatch(html, /_next\/image\?url=.*step-13-open-manual-key/);
  assert.match(html, /Gambar 8\.4/);
  assert.match(html, /QR pada gambar sengaja disamarkan/);
});
