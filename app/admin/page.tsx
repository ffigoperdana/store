import { desc, eq, gte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminProductManager } from "@/components/admin-product-manager";
import { db } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getStats() {
  if (!db) return { todayOrders: 0, paidOrders: 0, revenue: 0, pending: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayOrders, paidOrders, pending, revenue] = await Promise.all([
    db.select({ amount: sql<number>`count(*)::int` }).from(orders).where(gte(orders.createdAt, today)),
    db.select({ amount: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "PAID")),
    db.select({ amount: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "AWAITING_PAYMENT")),
    db.select({ amount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int` }).from(orders).where(eq(orders.status, "FULFILLED")),
  ]);
  return { todayOrders: todayOrders[0]?.amount || 0, paidOrders: paidOrders[0]?.amount || 0, pending: pending[0]?.amount || 0, revenue: revenue[0]?.amount || 0 };
}

export default async function AdminPage() {
  const user = await getAdminSession(); if (!user) redirect("/admin/login");
  const stats = await getStats();
  return <main className="admin-page"><header className="admin-topbar"><a href="/">FG <span>Store</span></a><div><span>{user.name}</span><form action="/api/admin/auth/logout" method="post"><button>Keluar</button></form></div></header><section className="admin-hero"><p className="eyebrow">OPERATIONS / LIVE</p><h1>Dashboard kontrol toko.</h1><p>Payment callback menjadi sumber kebenaran; WhatsApp hanya dibuka setelah pesanan berstatus paid.</p></section><section className="admin-stat-grid"><article><span>Order hari ini</span><strong>{stats.todayOrders}</strong></article><article><span>Menunggu fulfilment</span><strong>{stats.paidOrders}</strong></article><article><span>Menunggu pembayaran</span><strong>{stats.pending}</strong></article><article><span>Revenue fulfilled</span><strong>Rp{stats.revenue.toLocaleString("id-ID")}</strong></article></section><AdminProductManager /></main>;
}
