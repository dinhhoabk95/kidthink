-- Create ai credit reason enum
DO $$ BEGIN
 CREATE TYPE "public"."ai_credit_reason" AS ENUM('purchase', 'usage', 'manual_grant', 'refund');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create ai_credit_ledger table
CREATE TABLE IF NOT EXISTS "ai_credit_ledger" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_credit_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"delta" integer NOT NULL,
	"reason" "ai_credit_reason" NOT NULL,
	"ref_type" varchar(60),
	"ref_id" varchar(100),
	"feature" varchar(60),
	"granted_by_manager_id" bigint REFERENCES "managers"("id"),
	"grant_reason" text,
	"idempotency_key" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_ledger_uuid_unique" UNIQUE("uuid")
);

CREATE INDEX IF NOT EXISTS "idx_ai_credit_ledger_user_created" ON "ai_credit_ledger" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "idx_ai_credit_ledger_ref" ON "ai_credit_ledger" USING btree ("ref_type","ref_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_credit_ledger_idempotency" ON "ai_credit_ledger" USING btree ("idempotency_key");

-- Create ai_credit_balance table
CREATE TABLE IF NOT EXISTS "ai_credit_balance" (
	"user_id" bigint PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_granted" integer DEFAULT 0 NOT NULL,
	"total_used" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_ai_credit_balance_non_negative" CHECK ("balance" >= 0)
);
