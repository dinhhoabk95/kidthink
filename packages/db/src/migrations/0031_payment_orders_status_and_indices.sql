ALTER TYPE "public"."payment_order_status" ADD VALUE IF NOT EXISTS 'draft';
--> statement-breakpoint
ALTER TYPE "public"."payment_order_status" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."payment_order_status" ADD VALUE IF NOT EXISTS 'under_review';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_orders_transfer_note" ON "payment_orders" ("transfer_note");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_bank_txn_ref" ON "payment_orders" ("bank_txn_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_status_submitted_at" ON "payment_orders" ("status", "submitted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_user_id_status" ON "payment_orders" ("user_id", "status");
--> statement-breakpoint
REVOKE DELETE ON payment_orders FROM kidthink_app;
