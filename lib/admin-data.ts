import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { orderItems, orders, payments } from "@/db/schema";
import { ensureStoreBootstrap } from "@/lib/store-bootstrap";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerWhatsapp: string;
  orderStatus: string;
  paymentStatus: string | null;
  provider: string | null;
  product: string;
  totalAmount: number;
  createdAt: Date;
  paidAt: Date | null;
  fulfilledAt: Date | null;
  deliveryEmailStatus: string;
  deliveryEmailSentAt: Date | null;
  deliveryEmailLastError: string | null;
};

export type AdminDashboardData = {
  metrics: {
    todayOrders: number;
    successfulOrders: number;
    awaitingPayment: number;
    awaitingFulfillment: number;
    totalRevenue: number;
    uniqueBuyers: number;
    conversionRate: number;
  };
  trend: Array<{ day: string; orders: number; successful: number; revenue: number }>;
  statuses: Array<{ status: string; count: number }>;
  topProducts: Array<{ product: string; sold: number; revenue: number }>;
  recentOrders: AdminOrderRow[];
};

const emptyData: AdminDashboardData = {
  metrics: {
    todayOrders: 0,
    successfulOrders: 0,
    awaitingPayment: 0,
    awaitingFulfillment: 0,
    totalRevenue: 0,
    uniqueBuyers: 0,
    conversionRate: 0,
  },
  trend: [],
  statuses: [],
  topProducts: [],
  recentOrders: [],
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!db) return emptyData;
  await ensureStoreBootstrap();

  const [metricRows, trendResult, statusRows, productRows, recentRows] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      today: sql<number>`count(*) filter (where ${orders.createdAt} >= (date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'))::int`,
      successful: sql<number>`count(*) filter (where ${payments.status} = 'PAID')::int`,
      pending: sql<number>`count(*) filter (where ${orders.status} = 'AWAITING_PAYMENT')::int`,
      fulfillment: sql<number>`count(*) filter (where ${orders.status} in ('PAID', 'FULFILLING', 'MANUAL_REVIEW'))::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}) filter (where ${payments.status} = 'PAID'), 0)::int`,
      buyers: sql<number>`count(distinct coalesce(${orders.buyerEmail}, ${orders.buyerWhatsapp}))::int`,
    }).from(orders).leftJoin(payments, eq(payments.orderId, orders.id)),
    db.execute(sql`
      with days as (
        select generate_series(
          (current_date - interval '6 days')::date,
          current_date,
          interval '1 day'
        )::date as day
      )
      select
        to_char(days.day, 'YYYY-MM-DD') as day,
        count(${orders.id})::int as orders,
        count(${orders.id}) filter (where ${payments.status} = 'PAID')::int as successful,
        coalesce(sum(${orders.totalAmount}) filter (where ${payments.status} = 'PAID'), 0)::int as revenue
      from days
      left join ${orders} on (${orders.createdAt} at time zone 'Asia/Jakarta')::date = days.day
      left join ${payments} on ${payments.orderId} = ${orders.id}
      group by days.day
      order by days.day asc
    `),
    db.select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .groupBy(orders.status)
      .orderBy(desc(sql`count(*)`)),
    db.select({
      product: orderItems.productName,
      sold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)::int`,
    })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(payments, eq(payments.orderId, orders.id))
      .where(eq(payments.status, "PAID"))
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(6),
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      buyerName: orders.buyerName,
      buyerEmail: orders.buyerEmail,
      buyerWhatsapp: orders.buyerWhatsapp,
      orderStatus: orders.status,
      paymentStatus: payments.status,
      provider: payments.provider,
      product: sql<string>`coalesce(string_agg(${orderItems.productName} || ' · ' || ${orderItems.variantName}, ', '), '-')`,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      fulfilledAt: orders.fulfilledAt,
      deliveryEmailStatus: orders.deliveryEmailStatus,
      deliveryEmailSentAt: orders.deliveryEmailSentAt,
      deliveryEmailLastError: orders.deliveryEmailLastError,
    })
      .from(orders)
      .leftJoin(payments, eq(payments.orderId, orders.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .groupBy(orders.id, payments.status, payments.provider)
      .orderBy(desc(orders.createdAt))
      .limit(50),
  ]);

  const metric = metricRows[0] ?? { total: 0, today: 0, successful: 0, pending: 0, fulfillment: 0, revenue: 0, buyers: 0 };
  const trend = Array.from(trendResult as unknown as Array<Record<string, unknown>>).map((row) => ({
    day: String(row.day),
    orders: Number(row.orders),
    successful: Number(row.successful),
    revenue: Number(row.revenue),
  }));

  return {
    metrics: {
      todayOrders: metric.today,
      successfulOrders: metric.successful,
      awaitingPayment: metric.pending,
      awaitingFulfillment: metric.fulfillment,
      totalRevenue: metric.revenue,
      uniqueBuyers: metric.buyers,
      conversionRate: metric.total ? Math.round((metric.successful / metric.total) * 1000) / 10 : 0,
    },
    trend,
    statuses: statusRows,
    topProducts: productRows,
    recentOrders: recentRows,
  };
}
