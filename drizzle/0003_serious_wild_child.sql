CREATE TABLE "rate_limit_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(48) NOT NULL,
	"key_hash" varchar(128) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_key" varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_scope_key_window_unique" ON "rate_limit_buckets" USING btree ("scope","key_hash","window_start");--> statement-breakpoint
CREATE INDEX "rate_limit_expires_at_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_key_unique" UNIQUE("checkout_key");