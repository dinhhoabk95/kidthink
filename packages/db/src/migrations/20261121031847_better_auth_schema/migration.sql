CREATE TABLE "manager_accounts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manager_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"manager_id" bigint NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manager_accounts_provider_account_unique" UNIQUE("provider_id","account_id"),
	CONSTRAINT "manager_accounts_manager_provider_unique" UNIQUE("manager_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "manager_passkeys" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manager_passkeys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text,
	"public_key" text NOT NULL,
	"manager_id" bigint NOT NULL,
	"credential_id" text NOT NULL UNIQUE,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manager_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"manager_id" bigint NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"auth_method" text DEFAULT 'password' NOT NULL,
	"reauth_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_two_factors" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manager_two_factors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"manager_id" bigint NOT NULL CONSTRAINT "manager_two_factors_manager_unique" UNIQUE,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_verifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manager_verifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" bigint NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password_hash" text,
	"email_at_provider" citext,
	"email_verified_at_provider" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_accounts_provider_account_unique" UNIQUE("provider_id","account_id"),
	CONSTRAINT "user_accounts_user_provider_unique" UNIQUE("user_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "user_passkeys" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_passkeys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text,
	"public_key" text NOT NULL,
	"user_id" bigint NOT NULL,
	"credential_id" text NOT NULL UNIQUE,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"auth_method" text DEFAULT 'password' NOT NULL,
	"reauth_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_two_factors" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_two_factors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL CONSTRAINT "user_two_factors_user_unique" UNIQUE,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_verifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "managers" ADD COLUMN "email_verified" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "managers" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users" SET "email_verified" = true WHERE "email_verified_at" IS NOT NULL;--> statement-breakpoint
INSERT INTO "user_accounts" ("account_id", "provider_id", "user_id", "password_hash", "created_at", "updated_at")
SELECT "id"::text, 'credential', "id", "password_hash", "created_at", "updated_at"
FROM "users"
WHERE "password_hash" IS NOT NULL
ON CONFLICT ("user_id", "provider_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "manager_accounts" ("account_id", "provider_id", "manager_id", "password_hash", "created_at", "updated_at")
SELECT "id"::text, 'credential', "id", "password_hash", "created_at", "updated_at"
FROM "managers"
WHERE "password_hash" IS NOT NULL
ON CONFLICT ("manager_id", "provider_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "user_accounts" ("account_id", "provider_id", "user_id", "email_at_provider", "email_verified_at_provider", "created_at", "updated_at")
SELECT "provider_user_id", "provider"::text, "user_id", "email_at_provider", "email_verified_at_provider", "created_at", "updated_at"
FROM "social_identities"
ON CONFLICT ("provider_id", "account_id") DO NOTHING;--> statement-breakpoint
DROP TABLE "active_sessions";--> statement-breakpoint
DROP TABLE "mfa_recovery_codes";--> statement-breakpoint
DROP TABLE "mfa_settings";--> statement-breakpoint
DROP TABLE "social_identities";--> statement-breakpoint
DROP TABLE "verification_tokens";--> statement-breakpoint
DROP INDEX "idx_ai_credit_ledger_granted_by_manager";--> statement-breakpoint
CREATE INDEX "idx_ai_credit_ledger_granted_by_manager" ON "ai_credit_ledger" ("granted_by_manager_id") WHERE "granted_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_ai_credit_ledger_idempotency";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_credit_ledger_idempotency" ON "ai_credit_ledger" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_entitlements_granted_by_manager";--> statement-breakpoint
CREATE INDEX "idx_entitlements_granted_by_manager" ON "entitlements" ("granted_by_manager_id") WHERE "granted_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_payment_orders_bank_txn_ref";--> statement-breakpoint
CREATE INDEX "idx_payment_orders_bank_txn_ref" ON "payment_orders" ("bank_txn_ref") WHERE "bank_txn_ref" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_payment_orders_reviewed_by_manager";--> statement-breakpoint
CREATE INDEX "idx_payment_orders_reviewed_by_manager" ON "payment_orders" ("reviewed_by_manager_id") WHERE "reviewed_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_payment_transactions_order_id";--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_order_id" ON "payment_transactions" ("order_id") WHERE "order_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_child_profiles_status_purge_at";--> statement-breakpoint
CREATE INDEX "idx_child_profiles_status_purge_at" ON "child_profiles" ("status","purge_at") WHERE "purge_at" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_child_profiles_current_curriculum_id";--> statement-breakpoint
CREATE INDEX "idx_child_profiles_current_curriculum_id" ON "child_profiles" ("current_curriculum_id") WHERE "current_curriculum_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_child_stickers_play_session_id";--> statement-breakpoint
CREATE INDEX "idx_child_stickers_play_session_id" ON "child_stickers" ("play_session_id") WHERE "play_session_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_curriculum_enrollments_child_active_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_curriculum_enrollments_child_active_unique" ON "curriculum_enrollments" ("child_id") WHERE "status" = 'active';--> statement-breakpoint
DROP INDEX "idx_export_jobs_status";--> statement-breakpoint
CREATE INDEX "idx_export_jobs_status" ON "export_jobs" ("status","created_at") WHERE "status" IN ('queued', 'processing');--> statement-breakpoint
DROP INDEX "idx_export_jobs_expires_at";--> statement-breakpoint
CREATE INDEX "idx_export_jobs_expires_at" ON "export_jobs" ("expires_at") WHERE "expires_at" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_game_levels_skill_dataset_id";--> statement-breakpoint
CREATE INDEX "idx_game_levels_skill_dataset_id" ON "game_levels" ("skill_dataset_id") WHERE "skill_dataset_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_mfa_recovery_requests_token_hash";--> statement-breakpoint
CREATE INDEX "idx_mfa_recovery_requests_token_hash" ON "mfa_recovery_requests" ("verification_token_hash") WHERE "verification_token_hash" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_mfa_recovery_requests_completed_by_manager";--> statement-breakpoint
CREATE INDEX "idx_mfa_recovery_requests_completed_by_manager" ON "mfa_recovery_requests" ("completed_by_manager_id") WHERE "completed_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_users_status_purge_at";--> statement-breakpoint
CREATE INDEX "idx_users_status_purge_at" ON "users" ("status","purge_at") WHERE "purge_at" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_library_items_collection_id";--> statement-breakpoint
CREATE INDEX "idx_library_items_collection_id" ON "library_items" ("collection_id") WHERE "collection_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_error_logs_user_id";--> statement-breakpoint
CREATE INDEX "idx_error_logs_user_id" ON "error_logs" ("user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_error_logs_resolved_by_manager";--> statement-breakpoint
CREATE INDEX "idx_error_logs_resolved_by_manager" ON "error_logs" ("resolved_by_manager_id") WHERE "resolved_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_feature_flags_updated_by_manager";--> statement-breakpoint
CREATE INDEX "idx_feature_flags_updated_by_manager" ON "feature_flags" ("updated_by_manager_id") WHERE "updated_by_manager_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_notification_deliveries_queued";--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_queued" ON "notification_deliveries" ("status","created_at") WHERE "status" = 'queued';--> statement-breakpoint
DROP INDEX "idx_personal_curriculum_enrollments_child_active_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_personal_curriculum_enrollments_child_active_unique" ON "personal_curriculum_enrollments" ("child_id") WHERE "status" = 'active';--> statement-breakpoint
DROP INDEX "idx_play_sessions_child_started_at";--> statement-breakpoint
CREATE INDEX "idx_play_sessions_child_started_at" ON "play_sessions" ("child_profile_id","started_at") WHERE "child_profile_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_play_sessions_guest_status";--> statement-breakpoint
CREATE INDEX "idx_play_sessions_guest_status" ON "play_sessions" ("guest_device_id","completion_status") WHERE "guest_device_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX "idx_telemetry_events_child_uuid";--> statement-breakpoint
CREATE INDEX "idx_telemetry_events_child_uuid" ON "telemetry_events" ("child_uuid") WHERE "child_uuid" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_manager_accounts_manager_id" ON "manager_accounts" ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_manager_passkeys_manager_id" ON "manager_passkeys" ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_manager_sessions_manager_id" ON "manager_sessions" ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_manager_two_factors_secret" ON "manager_two_factors" ("secret");--> statement-breakpoint
CREATE INDEX "idx_manager_verifications_identifier" ON "manager_verifications" ("identifier");--> statement-breakpoint
CREATE INDEX "idx_user_accounts_user_id" ON "user_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_passkeys_user_id" ON "user_passkeys" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_two_factors_secret" ON "user_two_factors" ("secret");--> statement-breakpoint
CREATE INDEX "idx_user_verifications_identifier" ON "user_verifications" ("identifier");--> statement-breakpoint
ALTER TABLE "manager_accounts" ADD CONSTRAINT "manager_accounts_manager_id_managers_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manager_passkeys" ADD CONSTRAINT "manager_passkeys_manager_id_managers_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manager_sessions" ADD CONSTRAINT "manager_sessions_manager_id_managers_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "manager_two_factors" ADD CONSTRAINT "manager_two_factors_manager_id_managers_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_passkeys" ADD CONSTRAINT "user_passkeys_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_two_factors" ADD CONSTRAINT "user_two_factors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;