import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return <main className="admin-auth-page"><section className="admin-auth-card"><p className="eyebrow">FG STORE / ADMIN</p><h1>Kelola katalog dengan aman.</h1><p>Gunakan akun administrator. Kredensial awal diatur melalui environment deployment.</p><AdminLoginForm /></section></main>;
}
