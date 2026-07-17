"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const result = await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const data = await result.json();
    if (!result.ok) { setError(data.error || "Login gagal."); setBusy(false); return; }
    router.push("/admin"); router.refresh();
  }
  return <form className="admin-login-form" onSubmit={submit}>
    <label>Email<input name="email" type="email" autoComplete="username" required placeholder="owner@store.com" /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="store-button store-button-primary" disabled={busy}>{busy ? "Memverifikasi…" : "Masuk ke admin"}</button>
  </form>;
}
