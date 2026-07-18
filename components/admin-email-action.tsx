"use client";

import { useState } from "react";

const labels: Record<string, string> = {
  NOT_REQUESTED: "Belum diproses",
  PENDING: "Dalam antrean",
  SENDING: "Sedang dikirim",
  SENT: "Terkirim",
  FAILED: "Gagal",
  SKIPPED: "Tidak dikirim",
};

export function AdminEmailAction({ orderId, initialStatus, hasEmail }: { orderId: string; initialStatus: string; hasEmail: boolean }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resend() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/orders/${orderId}/email`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Email gagal dikirim.");
    else setStatus(data.status === "sent" ? "SENT" : data.status === "disabled" ? "SKIPPED" : "FAILED");
    setBusy(false);
  }

  return <div className="admin-email-action">
    <span className={`status-pill ${status === "SENT" ? "success" : status === "FAILED" ? "danger" : "warning"}`}>{labels[status] || status}</span>
    {hasEmail && !["PENDING", "SENDING", "SENT"].includes(status) && <button type="button" onClick={() => void resend()} disabled={busy}>{busy ? "Mengirim…" : "Coba kirim"}</button>}
    {error && <small title={error}>Gagal: {error}</small>}
  </div>;
}
