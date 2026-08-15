DO $$ BEGIN
 CREATE TYPE "public"."mfa_recovery_status" AS ENUM('pending_verification', 'waiting', 'completed', 'cancelled', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "mfa_recovery_requests" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_recovery_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"status" "mfa_recovery_status" DEFAULT 'pending_verification' NOT NULL,
	"requested_by_manager_id" bigint NOT NULL REFERENCES "managers"("id") ON DELETE cascade,
	"reason" text NOT NULL,
	"verification_token_hash" text,
	"verification_token_expires_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"eligible_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_manager_id" bigint REFERENCES "managers"("id") ON DELETE set null,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_mfa_recovery_requests_user_status" ON "mfa_recovery_requests" USING btree ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_mfa_recovery_requests_token_hash" ON "mfa_recovery_requests" USING btree ("verification_token_hash");
