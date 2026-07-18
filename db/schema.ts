import {
  boolean,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const adminRole = pgEnum("admin_role", [
  "OWNER",
  "ADMIN",
  "CATALOG_MANAGER",
  "OPERATIONS",
  "SUPPORT",
  "ANALYST",
]);
export const publicationStatus = pgEnum("publication_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const availabilityMode = pgEnum("availability_mode", ["AUTO", "FORCE_AVAILABLE", "FORCE_SOLD_OUT"]);
export const variantStatus = pgEnum("variant_status", ["ACTIVE", "DISABLED", "ARCHIVED"]);
export const fulfillmentMode = pgEnum("fulfillment_mode", ["MANUAL_WHATSAPP", "SINGLE_SHARED", "UNIQUE_POOL"]);
export const inventoryStatus = pgEnum("inventory_status", ["AVAILABLE", "RESERVED", "DELIVERED", "INVALID", "REVOKED"]);
export const orderStatus = pgEnum("order_status", ["AWAITING_PAYMENT", "PAID", "FULFILLING", "FULFILLED", "MANUAL_REVIEW", "EXPIRED", "CANCELLED"]);
export const paymentStatus = pgEnum("payment_status", ["PENDING", "PAID", "EXPIRED", "FAILED", "AMOUNT_MISMATCH", "REFUNDED"]);
export const emailDeliveryStatus = pgEnum("email_delivery_status", ["NOT_REQUESTED", "PENDING", "SENDING", "SENT", "FAILED", "SKIPPED"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: adminRole("role").notNull().default("OWNER"),
  enabled: boolean("enabled").notNull().default(true),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
  ...timestamps,
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  publicationStatus: publicationStatus("publication_status").notNull().default("DRAFT"),
  availabilityMode: availabilityMode("availability_mode").notNull().default("AUTO"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  content: jsonb("content").notNull().default({}),
  ...timestamps,
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  duration: varchar("duration", { length: 140 }),
  warranty: varchar("warranty", { length: 200 }),
  channel: varchar("channel", { length: 160 }),
  estimatedProcess: varchar("estimated_process", { length: 200 }),
  status: variantStatus("status").notNull().default("ACTIVE"),
  fulfillmentMode: fulfillmentMode("fulfillment_mode").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  sharedDeliveryValue: text("shared_delivery_value"),
  sharedDeliveryLabel: varchar("shared_delivery_label", { length: 100 }),
  metadata: jsonb("metadata").notNull().default({}),
  ...timestamps,
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
  encryptedValue: text("encrypted_value").notNull(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  status: inventoryStatus("status").notNull().default("AVAILABLE"),
  reservedOrderId: uuid("reserved_order_id"),
  reservedUntil: timestamp("reserved_until", { withTimezone: true }),
  deliveredOrderId: uuid("delivered_order_id"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  note: text("note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("inventory_variant_fingerprint_unique").on(table.variantId, table.fingerprint),
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 64 }).notNull().unique(),
  publicToken: varchar("public_token", { length: 96 }).notNull().unique(),
  checkoutKey: varchar("checkout_key", { length: 64 }).unique(),
  // A random browser-scoped key. It is deliberately not a login/session id;
  // it only lets the checkout flow enforce one open invoice per browser.
  browserKey: varchar("browser_key", { length: 64 }),
  buyerName: varchar("buyer_name", { length: 140 }).notNull(),
  buyerWhatsapp: varchar("buyer_whatsapp", { length: 32 }).notNull(),
  buyerEmail: varchar("buyer_email", { length: 320 }),
  status: orderStatus("status").notNull().default("AWAITING_PAYMENT"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  whatsappOpenedAt: timestamp("whatsapp_opened_at", { withTimezone: true }),
  customerCancelledAt: timestamp("customer_cancelled_at", { withTimezone: true }),
  deliveryEmailStatus: emailDeliveryStatus("delivery_email_status").notNull().default("NOT_REQUESTED"),
  deliveryEmailProviderId: varchar("delivery_email_provider_id", { length: 160 }),
  deliveryEmailSentAt: timestamp("delivery_email_sent_at", { withTimezone: true }),
  deliveryEmailAttempts: integer("delivery_email_attempts").notNull().default(0),
  deliveryEmailLastError: text("delivery_email_last_error"),
  ...timestamps,
}, (table) => [
  index("orders_browser_active_idx").on(table.browserKey, table.status, table.expiresAt),
  index("orders_browser_customer_cancelled_idx").on(table.browserKey, table.customerCancelledAt),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 180 }).notNull(),
  variantName: varchar("variant_name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  fulfillmentMode: fulfillmentMode("fulfillment_mode").notNull(),
  snapshot: jsonb("snapshot").notNull().default({}),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
  provider: varchar("provider", { length: 40 }).notNull(),
  providerOrderId: varchar("provider_order_id", { length: 100 }).notNull().unique(),
  signature: text("signature"),
  qrImage: text("qr_image"),
  qrUrl: text("qr_url"),
  providerStatus: varchar("provider_status", { length: 40 }).notNull().default("PENDING"),
  status: paymentStatus("status").notNull().default("PENDING"),
  requestedAmount: integer("requested_amount").notNull(),
  uniqueAmount: integer("unique_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  rawResponse: jsonb("raw_response").notNull().default({}),
  ...timestamps,
});

export const deliveryTokens = pgTable("delivery_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  encryptedValue: text("encrypted_value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  maxAccess: integer("max_access"),
  accessCount: integer("access_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps,
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  eventHash: varchar("event_hash", { length: 128 }).notNull().unique(),
  orderId: uuid("order_id"),
  verified: boolean("verified").notNull().default(false),
  payload: jsonb("payload").notNull().default({}),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: varchar("scope", { length: 48 }).notNull(),
  keyHash: varchar("key_hash", { length: 128 }).notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  hits: integer("hits").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("rate_limit_scope_key_window_unique").on(table.scope, table.keyHash, table.windowStart),
  index("rate_limit_expires_at_idx").on(table.expiresAt),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  detail: jsonb("detail").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
