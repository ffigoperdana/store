/* global caches */

const CACHE_PREFIX = "fg-store";
const CACHE_VERSION = "v1";
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const ACTIVE_CACHES = new Set([PAGE_CACHE, STATIC_CACHE]);
const OFFLINE_URL = "/offline";

const STATIC_DESTINATIONS = new Set([
  "font",
  "image",
  "manifest",
  "script",
  "style",
]);

const SENSITIVE_QUERY_KEYS = new Set([
  "auth",
  "code",
  "credential",
  "key",
  "otp",
  "password",
  "secret",
  "token",
]);

function isSensitivePath(url) {
  return /\/(?:admin|checkout|pesanan|api)(?:\/|$)/.test(url.pathname);
}

function hasSensitiveQuery(url) {
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function canCache(response) {
  if (!response || !response.ok || response.type !== "basic") {
    return false;
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  const vary = response.headers.get("Vary") || "";

  return !/\b(?:no-store|private)\b/i.test(cacheControl) && vary !== "*";
}

async function offlineFallback() {
  const cached = await caches.match(OFFLINE_URL, { ignoreSearch: true });

  return (
    cached ||
    new Response("Kamu sedang offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function networkOnlyNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return offlineFallback();
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);

    if (canCache(response)) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

async function cacheFirstStatic(request, url) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (canCache(response) && !hasSensitiveQuery(url)) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith(`${CACHE_PREFIX}-`) && !ACTIVE_CACHES.has(name),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const containsSensitiveQuery = hasSensitiveQuery(url);

  if (request.mode === "navigate") {
    // Query-string navigations may contain TOTP secrets. They always bypass caches.
    event.respondWith(
      url.search || containsSensitiveQuery || isSensitivePath(url)
        ? networkOnlyNavigation(request)
        : networkFirstNavigation(request),
    );
    return;
  }

  if (containsSensitiveQuery || isSensitivePath(url)) {
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirstStatic(request, url));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
