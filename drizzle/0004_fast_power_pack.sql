ALTER TABLE "orders" ADD COLUMN "browser_key" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_cancelled_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_browser_active_idx" ON "orders" USING btree ("browser_key","status","expires_at");--> statement-breakpoint
CREATE INDEX "orders_browser_customer_cancelled_idx" ON "orders" USING btree ("browser_key","customer_cancelled_at");