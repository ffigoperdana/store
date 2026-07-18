CREATE TYPE "public"."email_delivery_status" AS ENUM('NOT_REQUESTED', 'PENDING', 'SENDING', 'SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_email_status" "email_delivery_status" DEFAULT 'NOT_REQUESTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_email_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_email_last_error" text;