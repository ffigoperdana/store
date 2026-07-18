"use client";

const BROWSER_KEY = "fg-store-browser-key";

export function getBrowserCheckoutKey() {
  const current = window.localStorage.getItem(BROWSER_KEY);
  if (current && /^[0-9a-f-]{36}$/i.test(current)) return current;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(BROWSER_KEY, created);
  return created;
}
