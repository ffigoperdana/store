import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminProductManager } from "@/components/admin-product-manager";
import { AdminEmailAction } from "@/components/admin-email-action";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { getAdminSession } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const statusLabels: Record<string, string> = {
  AWAITING_PAYMENT: "Menunggu bayar",
  PAID: "Sudah dibayar",
  FULFILLING: "Sedang dikirim",
  FULFILLED: "Selesai",
  MANUAL_REVIEW: "Perlu dicek",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  PENDING: "Pending",
  FAILED: "Gagal",
  REFUNDED: "Refund",
};

const adminLinks = [
  ["01", "Ringkasan", "#overview"],
  ["02", "Pesanan & pembeli", "#orders"],
  ["03", "Kategori", "#categories"],
  ["04", "Paket ChatGPT", "#gpt-products"],
  ["05", "Semua produk", "#products"],
  ["06", "Varian & stok", "#new-variant"],
] as const;

function statusTone(status: string | null) {
  if (!status) return "neutral";
  if (["PAID", "FULFILLED"].includes(status)) return "success";
  if (["AWAITING_PAYMENT", "PENDING", "FULFILLING", "MANUAL_REVIEW"].includes(status)) return "warning";
  return "danger";
}

export default async function AdminPage() {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  const data = await getAdminDashboardData();
  const maxRevenue = Math.max(...data.trend.map((item) => item.revenue), 1);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/"><b>FG</b><span>FG Store</span><small>Admin console</small></Link>
        <nav className="admin-desktop-nav" aria-label="Navigasi admin">
          {adminLinks.map(([number, label, href]) => <a key={href} href={href}><span>{number}</span>{label}</a>)}
        </nav>
        <AdminMobileNav links={adminLinks} />
        <div className="admin-sidebar-foot">
          <span>Login sebagai</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <form action="/api/admin/auth/logout" method="post"><button>Keluar</button></form>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-commandbar">
          <div><span className="live-dot" />Store operations</div>
          <div className="admin-command-actions"><Link href="/" target="_blank">Lihat toko ↗</Link><Link href="/gpt" target="_blank">Halaman GPT ↗</Link></div>
        </header>

        <section className="admin-section admin-overview" id="overview">
          <div className="admin-section-title">
            <div><p className="eyebrow">OVERVIEW / REAL DATA</p><h1>Semua angka penting, dalam satu layar.</h1></div>
            <p>Data dihitung langsung dari order dan callback pembayaran. Pembeli tidak perlu memiliki akun agar nama, email, dan WhatsApp tetap tercatat.</p>
          </div>
          <div className="admin-metric-grid">
            <article className="metric-primary"><span>Omzet berhasil</span><strong>{rupiah.format(data.metrics.totalRevenue)}</strong><small>Dari order paid + fulfilled</small></article>
            <article><span>Pembelian berhasil</span><strong>{data.metrics.successfulOrders}</strong><small>Konversi {data.metrics.conversionRate}%</small></article>
            <article><span>Pembeli unik</span><strong>{data.metrics.uniqueBuyers}</strong><small>Berdasarkan email / WhatsApp</small></article>
            <article><span>Order hari ini</span><strong>{data.metrics.todayOrders}</strong><small>{data.metrics.awaitingPayment} menunggu pembayaran</small></article>
            <article><span>Perlu dikirim</span><strong>{data.metrics.awaitingFulfillment}</strong><small>Manual fulfilment setelah paid</small></article>
          </div>

          <div className="admin-analytics-grid">
            <article className="admin-card admin-sales-chart">
              <div className="admin-card-head"><div><p className="eyebrow">7 HARI TERAKHIR</p><h2>Tren omzet</h2></div><strong>{data.trend.reduce((sum, item) => sum + item.successful, 0)} order sukses</strong></div>
              <div className="sales-bars" aria-label="Grafik omzet tujuh hari">
                {data.trend.map((item) => <div key={item.day} className="sales-bar-item"><div className="sales-bar-value">{item.revenue ? `${Math.round(item.revenue / 1000)}k` : "0"}</div><div className="sales-bar-track"><i style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue ? 8 : 2)}%` }} /></div><span>{new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(`${item.day}T00:00:00+07:00`))}</span></div>)}
              </div>
            </article>
            <article className="admin-card">
              <div className="admin-card-head"><div><p className="eyebrow">STATUS</p><h2>Distribusi order</h2></div></div>
              <div className="status-breakdown">
                {data.statuses.map((item) => <div key={item.status}><span><i className={`status-dot ${statusTone(item.status)}`} />{statusLabels[item.status] ?? item.status}</span><strong>{item.count}</strong></div>)}
              </div>
            </article>
            <article className="admin-card">
              <div className="admin-card-head"><div><p className="eyebrow">BEST SELLER</p><h2>Produk terlaris</h2></div></div>
              <div className="top-product-list">
                {data.topProducts.map((item, index) => <div key={item.product}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{item.product}</strong><small>{item.sold} terjual</small></span><em>{rupiah.format(item.revenue)}</em></div>)}
              </div>
            </article>
          </div>
        </section>

        <section className="admin-section" id="orders">
          <div className="admin-section-title compact"><div><p className="eyebrow">ORDERS / CUSTOMER REPORT</p><h2>Pesanan dan identitas pembeli</h2></div><p>{data.recentOrders.length} transaksi terbaru, termasuk status callback dan fulfilment.</p></div>
          <div className="admin-table-card">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead><tr><th>Order</th><th>Pembeli</th><th>Kontak</th><th>Email delivery</th><th>Produk</th><th>Pembayaran</th><th>Status order</th><th>Total</th></tr></thead>
                <tbody>{data.recentOrders.map((order) => <tr key={order.id}>
                  <td><strong>{order.orderNumber}</strong><small>{dateTime.format(order.createdAt)}</small></td>
                  <td><strong>{order.buyerName}</strong><small>{order.paidAt ? `Paid ${dateTime.format(order.paidAt)}` : "Belum dibayar"}</small></td>
                  <td><a href={order.buyerEmail ? `mailto:${order.buyerEmail}` : undefined}>{order.buyerEmail || "Email tidak diisi"}</a><a href={`https://wa.me/${order.buyerWhatsapp}`} target="_blank">+{order.buyerWhatsapp} ↗</a></td>
                  <td title={order.deliveryEmailLastError || undefined}><AdminEmailAction orderId={order.id} initialStatus={order.deliveryEmailStatus} hasEmail={Boolean(order.buyerEmail)} />{order.deliveryEmailSentAt && <small>{dateTime.format(order.deliveryEmailSentAt)}</small>}</td>
                  <td><span className="table-product">{order.product}</span><small>{order.provider || "-"}</small></td>
                  <td><span className={`status-pill ${statusTone(order.paymentStatus)}`}>{statusLabels[order.paymentStatus || ""] ?? order.paymentStatus ?? "-"}</span></td>
                  <td><span className={`status-pill ${statusTone(order.orderStatus)}`}>{statusLabels[order.orderStatus] ?? order.orderStatus}</span></td>
                  <td><strong>{rupiah.format(order.totalAmount)}</strong></td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <AdminProductManager />
      </div>
    </main>
  );
}
