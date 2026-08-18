-- Migration nền của MindKid — gộp toàn bộ 52 migration cũ (0000–0051) thành một
-- file duy nhất. Lịch sử cũ chưa từng chạy ở đâu ngoài máy dev nên không có gì để
-- bảo toàn; ngược lại chuỗi cũ đã lệch khỏi `src/schema/*.ts` đủ để
-- `pnpm db:migrate && pnpm db:seed` trên DB rỗng đứt ở seed — đúng cái mà
-- `docs/specs/01-platform/data-model-overview.md` §9 bắt phải chạy được.
--
-- Năm quy ước schema toàn cục (Task #88) đã áp vào file này: không hậu tố `_vi`,
-- không refresh token, mọi bảng có `created_at`/`updated_at`, cặp đa hình có index
-- (không FK), mọi bảng có `id` tự tăng trừ bảng pivot.
--
-- Bố cục file, theo đúng thứ tự bắt buộc:
--   §1 role ứng dụng + default privileges  (phải trước khi tạo bảng)
--   §2 extension                            (citext cho email, vector cho embedding)
--   §3 schema do `drizzle-kit generate` sinh ra — KHÔNG sửa tay
--   §4 function + trigger bất biến nội dung  (Drizzle không mô tả được)
--   §5 quyền bảng: ép BR-DM-05 (bảng INSERT-only) bằng quyền DB, không bằng quy ước
--
-- Sửa §3 bằng cách sửa `src/schema/*.ts` rồi chạy `pnpm db:generate` — nó sinh
-- migration 0001 kế tiếp. Sửa §1/§2/§4/§5 thì viết migration mới bằng tay.

-- ═══ §1. Role ứng dụng ═══════════════════════════════════════════════════════
-- App chạy bằng `mindkid_app`, không phải owner: quyền hẹp là thứ ép được
-- BR-DM-05, còn owner thì REVOKE nào cũng vô nghĩa.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mindkid_app') THEN
    CREATE ROLE mindkid_app WITH LOGIN PASSWORD 'mindkid_app_password';
  END IF;
END $$;--> statement-breakpoint

-- `current_database()` thay vì tên cứng: cùng file này còn chạy trên DB scratch của
-- CI và của test, tên khác `mindkid`.
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO mindkid_app', current_database());
END $$;--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO mindkid_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mindkid_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mindkid_app;--> statement-breakpoint

-- ═══ §2. Extension ═══════════════════════════════════════════════════════════
-- citext: `users.email` UNIQUE không phân biệt hoa thường (BR-SIB-07).
-- vector:  `content_embeddings.embedding` cho semantic search.
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint

-- ═══ §3. Schema (sinh bởi drizzle-kit) ═══════════════════════════════════════
CREATE TYPE "public"."ai_credit_reason" AS ENUM('purchase', 'usage', 'manual_grant', 'refund');--> statement-breakpoint
CREATE TYPE "public"."image_owner_type" AS ENUM('game_level', 'lesson', 'activity', 'worksheet', 'payment_order', 'payment_proof', 'custom_game', 'user_avatar', 'manager_avatar');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('active', 'orphan', 'archived');--> statement-breakpoint
CREATE TYPE "public"."image_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."entitlement_group" AS ENUM('content', 'account', 'report', 'creator', 'ai');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('package_order', 'manual_grant', 'trial', 'promo');--> statement-breakpoint
CREATE TYPE "public"."entitlement_status" AS ENUM('pending', 'soft_unlock', 'active', 'grace_period', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."payment_order_status" AS ENUM('draft', 'pending', 'pending_proof', 'submitted', 'under_review', 'approved', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."recurring_subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."child_relationship" AS ENUM('child', 'student', 'other');--> statement-breakpoint
CREATE TYPE "public"."child_status" AS ENUM('active', 'archived', 'pending_deletion');--> statement-breakpoint
CREATE TYPE "public"."action_suggestion_kind" AS ENUM('home_activity', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."activity_kind" AS ENUM('digital_game', 'discussion', 'storytelling', 'movement', 'manipulative', 'worksheet', 'observation', 'mini_project', 'assessment', 'home_activity');--> statement-breakpoint
CREATE TYPE "public"."seo_page_type" AS ENUM('competency', 'skill', 'age_program', 'topic', 'static');--> statement-breakpoint
CREATE TYPE "public"."worksheet_layout_template" AS ENUM('pattern_coloring', 'pair_matching', 'group_circling', 'shape_completion', 'count_and_color', 'spot_differences');--> statement-breakpoint
CREATE TYPE "public"."curriculum_progress_status" AS ENUM('not_started', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."curriculum_enrollment_status" AS ENUM('active', 'completed', 'paused', 'withdrawn', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."program_type" AS ENUM('age_based', 'journey');--> statement-breakpoint
CREATE TYPE "public"."custom_game_status" AS ENUM('draft', 'ready');--> statement-breakpoint
CREATE TYPE "public"."export_job_kind" AS ENUM('lesson_plan', 'worksheet', 'curriculum_plan');--> statement-breakpoint
CREATE TYPE "public"."export_job_status" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."access_tier" AS ENUM('free', 'login', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."authored_in" AS ENUM('repo_seed', 'studio');--> statement-breakpoint
CREATE TYPE "public"."content_lifecycle_status" AS ENUM('draft', 'in_review', 'approved', 'published', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."content_origin" AS ENUM('human', 'ai_assisted');--> statement-breakpoint
CREATE TYPE "public"."game_template_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('user', 'manager');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('password', 'social');--> statement-breakpoint
CREATE TYPE "public"."consent_action" AS ENUM('accepted', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('terms', 'privacy', 'child_data');--> statement-breakpoint
CREATE TYPE "public"."manager_role" AS ENUM('super_admin', 'content_reviewer');--> statement-breakpoint
CREATE TYPE "public"."mfa_recovery_status" AS ENUM('pending_verification', 'waiting', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."social_provider" AS ENUM('google', 'facebook');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending_verification', 'active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verify', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('user', 'manager', 'system');--> statement-breakpoint
CREATE TYPE "public"."backup_status" AS ENUM('started', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."backup_type" AS ENUM('dump', 'verify', 'drill');--> statement-breakpoint
CREATE TYPE "public"."error_group_status" AS ENUM('open', 'ack', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."error_level" AS ENUM('warn', 'error', 'fatal');--> statement-breakpoint
CREATE TYPE "public"."error_source" AS ENUM('server', 'client');--> statement-breakpoint
CREATE TYPE "public"."flag_scope" AS ENUM('global', 'user_ids', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'in_app', 'fcm_web');--> statement-breakpoint
CREATE TYPE "public"."notification_endpoint_provider" AS ENUM('fcm_web');--> statement-breakpoint
CREATE TYPE "public"."notification_endpoint_status" AS ENUM('active', 'invalid', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'dispatched', 'failed', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('user', 'manager');--> statement-breakpoint
CREATE TYPE "public"."review_entity_type" AS ENUM('game_level', 'lesson', 'activity', 'curriculum', 'worksheet');--> statement-breakpoint
CREATE TYPE "public"."personal_curriculum_status" AS ENUM('draft', 'ready');--> statement-breakpoint
CREATE TYPE "public"."lesson_plan_item_type" AS ENUM('activity', 'game_level', 'custom_note');--> statement-breakpoint
CREATE TYPE "public"."tag_axis" AS ENUM('what', 'thinking', 'mechanic', 'theme');--> statement-breakpoint
CREATE TYPE "public"."tag_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."emoji_age_suitability" AS ENUM('all', '4plus', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."emoji_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('seeded', 'deprecated');--> statement-breakpoint
CREATE TABLE "child_badges" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_badges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"badge_code" varchar(50) NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_ref" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_badges_child_profile_id_badge_code_unique" UNIQUE("child_profile_id","badge_code")
);
--> statement-breakpoint
CREATE TABLE "level_params" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "level_params_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"game_level_id" bigint NOT NULL,
	"param_overrides" jsonb,
	"adaptive_factor" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_params_child_game_level_unique" UNIQUE("child_profile_id","game_level_id")
);
--> statement-breakpoint
CREATE TABLE "mastery_state" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mastery_state_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"skill_id" bigint NOT NULL,
	"p_learn" numeric(5, 4) DEFAULT '0.1000' NOT NULL,
	"ema_correct" numeric(5, 4) DEFAULT '0.5000' NOT NULL,
	"hint_rate" numeric(5, 4) DEFAULT '0.0000' NOT NULL,
	"attempts_total" integer DEFAULT 0 NOT NULL,
	"best_p_learn" numeric(5, 4) DEFAULT '0.1000' NOT NULL,
	"params_version" varchar(20) DEFAULT 'v1' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mastery_state_child_skill_unique" UNIQUE("child_profile_id","skill_id"),
	CONSTRAINT "check_mastery_state_p_learn" CHECK ("mastery_state"."p_learn" >= 0 AND "mastery_state"."p_learn" <= 1),
	CONSTRAINT "check_mastery_state_ema_correct" CHECK ("mastery_state"."ema_correct" >= 0 AND "mastery_state"."ema_correct" <= 1),
	CONSTRAINT "check_mastery_state_hint_rate" CHECK ("mastery_state"."hint_rate" >= 0 AND "mastery_state"."hint_rate" <= 1),
	CONSTRAINT "check_mastery_state_best_p_learn" CHECK ("mastery_state"."best_p_learn" >= 0 AND "mastery_state"."best_p_learn" <= 1)
);
--> statement-breakpoint
CREATE TABLE "ai_credit_balance" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_credit_balance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_granted" integer DEFAULT 0 NOT NULL,
	"total_used" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_balance_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "check_ai_credit_balance_non_negative" CHECK ("ai_credit_balance"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_credit_ledger" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_credit_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"delta" integer NOT NULL,
	"reason" "ai_credit_reason" NOT NULL,
	"ref_type" varchar(60),
	"ref_id" varchar(100),
	"feature" varchar(60),
	"granted_by_manager_id" bigint,
	"grant_reason" text,
	"idempotency_key" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_ledger_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_usage_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"feature" varchar(60) NOT NULL,
	"credits_spent" integer DEFAULT 0 NOT NULL,
	"model" varchar(60) NOT NULL,
	"prompt_version" varchar(40) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd_micros" integer DEFAULT 0 NOT NULL,
	"moderation_passed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_log_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "content_embeddings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_embeddings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"content_type" varchar(30) NOT NULL,
	"content_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"model" varchar(60) NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"chunk_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_asset_refs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_asset_refs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"asset_kind" varchar(50) NOT NULL,
	"asset_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_asset_refs_unique" UNIQUE("entity_type","entity_id","asset_kind","asset_ref")
);
--> statement-breakpoint
CREATE TABLE "content_images" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"owner_type" "image_owner_type" NOT NULL,
	"owner_id" bigint NOT NULL,
	"storage_path" text NOT NULL,
	"thumb_path" text,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"mime" varchar(50),
	"alt_text" text,
	"visibility" "image_visibility" DEFAULT 'public' NOT NULL,
	"status" "image_status" DEFAULT 'active' NOT NULL,
	"uploaded_by_manager_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlement_keys" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"group" "entitlement_group" NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"is_mvp" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "entitlements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"entitlement_key" varchar(60) NOT NULL,
	"source" "entitlement_source" NOT NULL,
	"source_ref" uuid,
	"status" "entitlement_status" DEFAULT 'pending' NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"granted_by_manager_id" bigint,
	"grant_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_entitlements" (
	"package_code" varchar(40) NOT NULL,
	"entitlement_key" varchar(60) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_entitlements_package_code_entitlement_key_pk" PRIMARY KEY("package_code","entitlement_key")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"code" varchar(40) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"audience" varchar(100) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" "package_status" DEFAULT 'active' NOT NULL,
	"offers" jsonb NOT NULL,
	"quotas" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"package_code" varchar(40) NOT NULL,
	"offer_code" varchar(40) NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'VND' NOT NULL,
	"status" "payment_order_status" DEFAULT 'pending' NOT NULL,
	"transfer_note" varchar(100),
	"bank_txn_ref" varchar(100),
	"proof_path" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_manager_id" bigint,
	"admin_note" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "payment_orders_transfer_note_unique" UNIQUE("transfer_note")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"provider" varchar(30) NOT NULL,
	"provider_event_id" varchar(120) NOT NULL,
	"order_id" bigint,
	"order_uuid" uuid NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"status" varchar(30) NOT NULL,
	"raw_payload" jsonb,
	"reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transactions_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
CREATE TABLE "quota_usage" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quota_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"quota_key" varchar(60) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"limit_snapshot" integer NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_usage_user_key_period_unique" UNIQUE("user_id","quota_key","period_start")
);
--> statement-breakpoint
CREATE TABLE "recurring_subscriptions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recurring_subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"package_code" varchar(40) NOT NULL,
	"offer_code" varchar(40) NOT NULL,
	"billing_period" varchar(20) NOT NULL,
	"price_vnd" bigint NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"status" "recurring_subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"next_billing_at" timestamp with time zone,
	"dunning_attempts" integer DEFAULT 0 NOT NULL,
	"last_dunning_at" timestamp with time zone,
	"consent_terms_version" varchar(40) NOT NULL,
	"consent_snapshot" jsonb,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" varchar(30),
	"cancel_reason" text,
	"cancel_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"display_name" varchar(40) NOT NULL,
	"birth_year" smallint NOT NULL,
	"avatar_id" varchar(24) NOT NULL,
	"relationship" "child_relationship",
	"current_curriculum_id" bigint,
	"daily_play_cap_minutes" smallint DEFAULT 60 NOT NULL,
	"status" "child_status" DEFAULT 'active' NOT NULL,
	"purge_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_profiles_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "check_child_profiles_birth_year" CHECK ("child_profiles"."birth_year" >= 2010 AND "child_profiles"."birth_year" <= 2035)
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"title" varchar(200) NOT NULL,
	"instruction" text,
	"materials" text,
	"estimated_minutes" integer,
	"ref_type" varchar(50),
	"ref_id" bigint,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_activities_code_format" CHECK ("activities"."code" ~ '^ACT-\d{4}$'),
	CONSTRAINT "check_activities_estimated_minutes" CHECK ("activities"."estimated_minutes" >= 2 AND "activities"."estimated_minutes" <= 20)
);
--> statement-breakpoint
CREATE TABLE "lesson_activities" (
	"lesson_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"activity_id" bigint NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_activities_lesson_id_activity_id_pk" PRIMARY KEY("lesson_id","activity_id"),
	CONSTRAINT "lesson_activities_lesson_position_unique" UNIQUE("lesson_id","position")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lessons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"title" varchar(200) NOT NULL,
	"guide" text,
	"target_age_min" smallint,
	"target_age_max" smallint,
	"estimated_minutes" integer,
	"materials" text,
	"warm_up" text,
	"reflection" text,
	"assessment" text,
	"extension" text,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_lessons_code_format" CHECK ("lessons"."code" ~ '^LES-\d{4}$'),
	CONSTRAINT "check_lessons_estimated_minutes" CHECK ("lessons"."estimated_minutes" >= 5 AND "lessons"."estimated_minutes" <= 45)
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seo_pages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(200) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"page_type" "seo_page_type" NOT NULL,
	"title" varchar(300) NOT NULL,
	"meta_description" text NOT NULL,
	"h1" varchar(300),
	"body" text,
	"og_image_path" text,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"related_content_refs" jsonb DEFAULT '[]'::jsonb,
	"faq_items" jsonb DEFAULT '[]'::jsonb,
	"access_tier" "access_tier" DEFAULT 'free' NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"redirect_from" text,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_slug_version_unique" UNIQUE("slug","content_version")
);
--> statement-breakpoint
CREATE TABLE "skill_action_suggestions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_action_suggestions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"skill_id" bigint NOT NULL,
	"order_no" smallint DEFAULT 1 NOT NULL,
	"text" text NOT NULL,
	"kind" "action_suggestion_kind" DEFAULT 'home_activity' NOT NULL,
	"ref_entity_id" bigint,
	"status" "content_lifecycle_status" DEFAULT 'published' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'repo_seed' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_action_suggestions_skill_order_unique" UNIQUE("skill_id","order_no")
);
--> statement-breakpoint
CREATE TABLE "worksheets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "worksheets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"title" varchar(200) NOT NULL,
	"layout_template" "worksheet_layout_template" DEFAULT 'pattern_coloring' NOT NULL,
	"content_blocks" jsonb,
	"instructions" text,
	"learning_objective_ids" jsonb DEFAULT '[]'::jsonb,
	"pdf_path" text,
	"preview_path" text,
	"render_job_id" varchar(100),
	"render_status" varchar(50) DEFAULT 'pending',
	"render_input_hash" varchar(64),
	"source_content_version" integer,
	"render_page_count" integer,
	"render_grayscale_passed" boolean,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worksheets_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_worksheets_code_format" CHECK ("worksheets"."code" ~ '^WS-\d{4}$')
);
--> statement-breakpoint
CREATE TABLE "curricula" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curricula_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"program_type" "program_type" DEFAULT 'age_based' NOT NULL,
	"target_age_min" smallint,
	"target_age_max" smallint,
	"duration_weeks" smallint DEFAULT 8 NOT NULL,
	"sessions_per_week" smallint DEFAULT 3 NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curricula_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_curricula_code_format" CHECK ("curricula"."code" ~ '^CUR-[A-Za-z0-9_-]+$')
);
--> statement-breakpoint
CREATE TABLE "curriculum_enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_id" bigint NOT NULL,
	"curriculum_id" bigint NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "curriculum_enrollment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_item_progress" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_item_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"child_id" bigint NOT NULL,
	"curriculum_item_id" bigint NOT NULL,
	"status" "curriculum_progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_item_progress_enrollment_item_unique" UNIQUE("enrollment_id","curriculum_item_id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"curriculum_id" bigint NOT NULL,
	"week_no" smallint NOT NULL,
	"session_no" smallint NOT NULL,
	"position" smallint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_items_curriculum_week_session_pos_unique" UNIQUE("curriculum_id","week_no","session_no","position")
);
--> statement-breakpoint
CREATE TABLE "curriculum_weeks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_weeks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"curriculum_id" bigint NOT NULL,
	"week_no" smallint NOT NULL,
	"goal" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_weeks_curriculum_id_week_no_unique" UNIQUE("curriculum_id","week_no")
);
--> statement-breakpoint
CREATE TABLE "custom_games" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "custom_games_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"template_id" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"instruction" text NOT NULL,
	"content_pack" jsonb NOT NULL,
	"difficulty_params" jsonb NOT NULL,
	"theme_id" varchar(50) DEFAULT 'farm' NOT NULL,
	"age_min" smallint DEFAULT 3 NOT NULL,
	"age_max" smallint DEFAULT 6 NOT NULL,
	"skill_ids" jsonb,
	"status" "custom_game_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_games_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "check_custom_games_age_range" CHECK ("custom_games"."age_min" <= "custom_games"."age_max" AND "custom_games"."age_min" >= 3 AND "custom_games"."age_max" <= 6)
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "export_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" "export_job_kind" NOT NULL,
	"ref_id" varchar(200) NOT NULL,
	"status" "export_job_status" DEFAULT 'queued' NOT NULL,
	"file_path" text,
	"page_count" integer,
	"expires_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_export_jobs_page_count" CHECK ("export_jobs"."page_count" IS NULL OR ("export_jobs"."page_count" >= 1 AND "export_jobs"."page_count" <= 20))
);
--> statement-breakpoint
CREATE TABLE "game_levels" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"template_id" bigint NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"instruction" text,
	"instruction_audio_path" text,
	"content_pack" jsonb NOT NULL,
	"difficulty_params" jsonb NOT NULL,
	"theme_id" varchar(50),
	"age_min" smallint,
	"age_max" smallint,
	"difficulty" smallint,
	"access_tier" "access_tier" NOT NULL,
	"thumbnail_emoji" varchar(50),
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_levels_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_game_levels_code_format" CHECK ("game_levels"."code" ~ '^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$')
);
--> statement-breakpoint
CREATE TABLE "game_templates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"mechanic" varchar(50) NOT NULL,
	"layouts" text[],
	"content_contract" jsonb,
	"difficulty_contract" jsonb,
	"limits" jsonb,
	"age_min" smallint,
	"age_max" smallint,
	"banned_age_bands" text[],
	"requires_tap_fallback" boolean DEFAULT false,
	"asset_kinds" text[],
	"scoring" jsonb,
	"events" text[],
	"engine_session" text,
	"status" "game_template_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_templates_code_unique" UNIQUE("code"),
	CONSTRAINT "check_game_templates_code_format" CHECK ("game_templates"."code" ~ '^GT-\d{3}$')
);
--> statement-breakpoint
CREATE TABLE "active_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "active_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_type" "account_type" NOT NULL,
	"account_id" bigint NOT NULL,
	"device_id" varchar(64) NOT NULL,
	"remembered" boolean DEFAULT false NOT NULL,
	"device_label" text,
	"ip_address" text,
	"auth_method" "auth_method" NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "consent_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"action" "consent_action" DEFAULT 'accepted' NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_requirements" (
	"consent_type" "consent_type" PRIMARY KEY NOT NULL,
	"reconsent_required_at" timestamp with time zone,
	"notice" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "managers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "managers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(60) NOT NULL,
	"role" "manager_role" NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"session_version" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "managers_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "managers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "mfa_recovery_codes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_recovery_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_type" "account_type" NOT NULL,
	"account_id" bigint NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa_recovery_requests" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_recovery_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"status" "mfa_recovery_status" DEFAULT 'pending_verification' NOT NULL,
	"requested_by_manager_id" bigint NOT NULL,
	"reason" text NOT NULL,
	"verification_token_hash" text,
	"verification_token_expires_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"eligible_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_manager_id" bigint,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_recovery_requests_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "mfa_settings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mfa_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_type" "account_type" NOT NULL,
	"account_id" bigint NOT NULL,
	"secret_encrypted" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_settings_account_unique" UNIQUE("account_type","account_id")
);
--> statement-breakpoint
CREATE TABLE "social_identities" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_identities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"provider" "social_provider" NOT NULL,
	"provider_user_id" text NOT NULL,
	"email_at_provider" "citext",
	"email_verified_at_provider" boolean DEFAULT false NOT NULL,
	"display_name_at_provider" varchar(60),
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_identities_provider_user_id_unique" UNIQUE("provider","provider_user_id"),
	CONSTRAINT "social_identities_user_id_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text,
	"display_name" varchar(60) NOT NULL,
	"status" "user_status" DEFAULT 'pending_verification' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"session_version" integer DEFAULT 0 NOT NULL,
	"suspended_reason" text,
	"purge_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "verification_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"account_type" "account_type" NOT NULL,
	"account_id" bigint NOT NULL,
	"purpose" "verification_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"user_id" bigint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"collection_id" bigint,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_items_user_id_entity_type_entity_id_pk" PRIMARY KEY("user_id","entity_type","entity_id"),
	CONSTRAINT "check_library_items_entity_type" CHECK ("library_items"."entity_type" IN ('game_level', 'lesson', 'curriculum', 'activity'))
);
--> statement-breakpoint
CREATE TABLE "user_tag_map" (
	"user_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_tag_map_user_id_tag_id_entity_type_entity_id_pk" PRIMARY KEY("user_id","tag_id","entity_type","entity_id"),
	CONSTRAINT "check_user_tag_entity_type" CHECK ("user_tag_map"."entity_type" IN ('game_level', 'lesson', 'curriculum', 'activity'))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" bigint,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "chk_audit_logs_actor" CHECK (("audit_logs"."actor_type" = 'system' AND "audit_logs"."actor_id" IS NULL)
        OR ("audit_logs"."actor_type" <> 'system' AND "audit_logs"."actor_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "backup_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "backup_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"backup_type" "backup_type" NOT NULL,
	"status" "backup_status" NOT NULL,
	"size_bytes" bigint,
	"storage_path" text,
	"checksum" varchar(64),
	"restored_rows" integer,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_review_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_review_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_type" "review_entity_type" NOT NULL,
	"entity_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"from_status" "content_lifecycle_status" NOT NULL,
	"to_status" "content_lifecycle_status" NOT NULL,
	"actor_manager_id" bigint,
	"actor_role" "manager_role",
	"reason" text,
	"checklist_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_seed_batches" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_seed_batches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"batch_code" varchar(60) NOT NULL,
	"kind" varchar(40) NOT NULL,
	"git_sha" varchar(40),
	"pr_url" varchar(255),
	"approved_by_manager_id" bigint,
	"rows_inserted" integer DEFAULT 0 NOT NULL,
	"gate_results" jsonb,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_seed_batches_batch_code_unique" UNIQUE("batch_code")
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "error_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"source" "error_source" DEFAULT 'server' NOT NULL,
	"level" "error_level" DEFAULT 'error' NOT NULL,
	"code" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"fingerprint" varchar(120) NOT NULL,
	"context" jsonb,
	"request_id" varchar(80),
	"user_id" bigint,
	"status" "error_group_status" DEFAULT 'open' NOT NULL,
	"resolved_notes" text,
	"resolved_by_manager_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "error_logs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feature_flags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"scope" "flag_scope" DEFAULT 'global' NOT NULL,
	"scope_value" jsonb,
	"default_value" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_by_manager_id" bigint,
	"update_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_deliveries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" bigint NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"suppressed_reason" text,
	"provider_message_id" varchar(100),
	"dispatched_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_deliveries_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "notification_endpoints" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_endpoints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"provider" "notification_endpoint_provider" NOT NULL,
	"client_installation_id" uuid NOT NULL,
	"token_encrypted" text NOT NULL,
	"token_fingerprint" text NOT NULL,
	"status" "notification_endpoint_status" DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_endpoints_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "notification_endpoints_token_fingerprint_unique" UNIQUE("token_fingerprint")
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_reads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"notification_id" bigint NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_notification_id_unique" UNIQUE("notification_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"recipient_type" "recipient_type" NOT NULL,
	"recipient_id" bigint NOT NULL,
	"template_code" varchar(60) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "personal_curricula" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curricula_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"title" varchar(200) NOT NULL,
	"age_min" smallint,
	"age_max" smallint,
	"duration_weeks" smallint DEFAULT 8 NOT NULL,
	"sessions_per_week" smallint DEFAULT 3 NOT NULL,
	"status" "personal_curriculum_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_curricula_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "check_personal_curricula_age_range" CHECK ("personal_curricula"."age_min" IS NULL OR "personal_curricula"."age_max" IS NULL OR "personal_curricula"."age_min" <= "personal_curricula"."age_max"),
	CONSTRAINT "check_personal_curricula_duration" CHECK ("personal_curricula"."duration_weeks" > 0),
	CONSTRAINT "check_personal_curricula_sessions" CHECK ("personal_curricula"."sessions_per_week" > 0)
);
--> statement-breakpoint
CREATE TABLE "personal_curriculum_enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_id" bigint NOT NULL,
	"personal_curriculum_id" bigint NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "curriculum_enrollment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_curriculum_item_progress" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_item_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"child_id" bigint NOT NULL,
	"personal_curriculum_item_id" bigint NOT NULL,
	"status" "curriculum_progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_curriculum_item_progress_enrollment_item_unique" UNIQUE("enrollment_id","personal_curriculum_item_id")
);
--> statement-breakpoint
CREATE TABLE "personal_curriculum_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"personal_curriculum_id" bigint NOT NULL,
	"week_no" smallint NOT NULL,
	"session_no" smallint NOT NULL,
	"position" smallint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_curriculum_items_week_session_pos_unique" UNIQUE("personal_curriculum_id","week_no","session_no","position")
);
--> statement-breakpoint
CREATE TABLE "lesson_plan_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_plan_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lesson_plan_id" bigint NOT NULL,
	"position" smallint NOT NULL,
	"item_type" "lesson_plan_item_type" NOT NULL,
	"item_code" varchar(50),
	"source_entity_id" bigint,
	"source_content_version" integer,
	"custom_instruction" text,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_plan_items_plan_pos_unique" UNIQUE("lesson_plan_id","position"),
	CONSTRAINT "check_lesson_plan_items_position" CHECK ("lesson_plan_items"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lesson_plans" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"title" varchar(200) NOT NULL,
	"target_age" smallint,
	"estimated_minutes" integer,
	"notes" text,
	"source_lesson_code" varchar(50),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_lesson_plans_target_age" CHECK ("lesson_plans"."target_age" IS NULL OR ("lesson_plans"."target_age" >= 3 AND "lesson_plans"."target_age" <= 6)),
	CONSTRAINT "check_lesson_plans_estimated_minutes" CHECK ("lesson_plans"."estimated_minutes" IS NULL OR ("lesson_plans"."estimated_minutes" >= 1 AND "lesson_plans"."estimated_minutes" <= 180))
);
--> statement-breakpoint
CREATE TABLE "child_daily_stats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_daily_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"date_ict" varchar(10) NOT NULL,
	"sessions_count" integer DEFAULT 0 NOT NULL,
	"total_play_time_seconds" integer DEFAULT 0 NOT NULL,
	"levels_attempted" integer DEFAULT 0 NOT NULL,
	"levels_completed" integer DEFAULT 0 NOT NULL,
	"skills_touched" integer DEFAULT 0 NOT NULL,
	"stars_earned" integer DEFAULT 0 NOT NULL,
	"extra_time_granted_minutes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_daily_stats_child_date_unique" UNIQUE("child_profile_id","date_ict")
);
--> statement-breakpoint
CREATE TABLE "child_session_summaries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_session_summaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"session_uuid" uuid NOT NULL,
	"game_level_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"template_id" bigint NOT NULL,
	"completion_status" varchar(20) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"stars_earned" smallint DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"retries_count" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_session_summaries_child_session_unique" UNIQUE("child_profile_id","session_uuid")
);
--> statement-breakpoint
CREATE TABLE "level_daily_stats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "level_daily_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"level_code" varchar(40) NOT NULL,
	"content_version" integer NOT NULL,
	"date_ict" varchar(10) NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"completions_count" integer DEFAULT 0 NOT NULL,
	"abandoned_count" integer DEFAULT 0 NOT NULL,
	"avg_duration_seconds" integer DEFAULT 0 NOT NULL,
	"avg_hints_used" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_daily_stats_level_version_date_unique" UNIQUE("level_code","content_version","date_ict")
);
--> statement-breakpoint
CREATE TABLE "play_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" bigint,
	"guest_device_id" varchar(100),
	"game_level_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"template_id" bigint NOT NULL,
	"is_preview" boolean DEFAULT false NOT NULL,
	"completion_status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"access_tier_at_start" varchar(20),
	"stars_earned" smallint DEFAULT 0,
	"score" integer DEFAULT 0,
	"duration_seconds" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_play_sessions_identity" CHECK ("play_sessions"."child_profile_id" IS NOT NULL OR "play_sessions"."guest_device_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "skill_daily_stats" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_daily_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"skill_id" bigint NOT NULL,
	"date_ict" varchar(10) NOT NULL,
	"exposure_count" integer DEFAULT 0 NOT NULL,
	"avg_accuracy_percent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_daily_stats_skill_date_unique" UNIQUE("skill_id","date_ict")
);
--> statement-breakpoint
CREATE TABLE "telemetry_events" (
	"session_uuid" uuid NOT NULL,
	"seq" integer NOT NULL,
	"child_uuid" uuid,
	"game_level_id" bigint,
	"content_version" integer,
	"template_id" bigint,
	"event_name" varchar(100) NOT NULL,
	"occurred_at_ms" integer,
	"payload" jsonb,
	"client_timestamp" timestamp with time zone,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telemetry_events_session_uuid_seq_pk" PRIMARY KEY("session_uuid","seq")
);
--> statement-breakpoint
CREATE TABLE "content_skill_map" (
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"skill_id" bigint NOT NULL,
	"weight" numeric(3, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_skill_map_entity_type_entity_id_skill_id_pk" PRIMARY KEY("entity_type","entity_id","skill_id"),
	CONSTRAINT "check_content_skill_map_weight" CHECK ("content_skill_map"."weight" > 0 AND "content_skill_map"."weight" <= 1)
);
--> statement-breakpoint
CREATE TABLE "content_tag_map" (
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_tag_map_entity_type_entity_id_tag_id_pk" PRIMARY KEY("entity_type","entity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"axis" "tag_axis" NOT NULL,
	"label" varchar(100) NOT NULL,
	"status" "tag_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_tags_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"label" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_tags_user_id_label_unique" UNIQUE("user_id","label")
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "competencies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color_token" varchar(50) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competencies_code_unique" UNIQUE("code"),
	CONSTRAINT "check_competencies_code_format" CHECK ("competencies"."code" ~ '^C[1-6]$')
);
--> statement-breakpoint
CREATE TABLE "emoji_registry" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "emoji_registry_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"unicode" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"search_keywords" text[],
	"age_suitability" "emoji_age_suitability" DEFAULT 'all' NOT NULL,
	"what_axis" varchar(50),
	"status" "emoji_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emoji_registry_code_unique" UNIQUE("code"),
	CONSTRAINT "check_emoji_registry_code_format" CHECK ("emoji_registry"."code" ~ '^EMJ-[a-z0-9-]+$')
);
--> statement-breakpoint
CREATE TABLE "learning_objectives" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning_objectives_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"skill_id" bigint NOT NULL,
	"behaviour" text NOT NULL,
	"observable_criteria" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_objectives_code_unique" UNIQUE("code"),
	CONSTRAINT "check_learning_objectives_code_format" CHECK ("learning_objectives"."code" ~ '^LO-C[1-6]\.[A-Z]{2,5}\.\d{2}-\d{2}$')
);
--> statement-breakpoint
CREATE TABLE "skill_prerequisites" (
	"skill_id" bigint NOT NULL,
	"prerequisite_id" bigint NOT NULL,
	"strength" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_prerequisites_skill_id_prerequisite_id_pk" PRIMARY KEY("skill_id","prerequisite_id"),
	CONSTRAINT "check_skill_prerequisites_strength" CHECK ("skill_prerequisites"."strength" >= 0 AND "skill_prerequisites"."strength" <= 1)
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(40) NOT NULL,
	"strand_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"age_min" smallint NOT NULL,
	"age_max" smallint NOT NULL,
	"difficulty" smallint NOT NULL,
	"thinking_processes" text[],
	"what_axis" text[],
	"status" "skill_status" DEFAULT 'seeded' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_code_unique" UNIQUE("code"),
	CONSTRAINT "check_skills_code_format" CHECK ("skills"."code" ~ '^C[1-6]\.[A-Z]{2,5}\.\d{2}$'),
	CONSTRAINT "check_skills_age_min" CHECK ("skills"."age_min" >= 3 AND "skills"."age_min" <= 6),
	CONSTRAINT "check_skills_age_max" CHECK ("skills"."age_max" >= 3 AND "skills"."age_max" <= 6),
	CONSTRAINT "check_skills_age_range" CHECK ("skills"."age_min" <= "skills"."age_max"),
	CONSTRAINT "check_skills_difficulty" CHECK ("skills"."difficulty" >= 1 AND "skills"."difficulty" <= 5)
);
--> statement-breakpoint
CREATE TABLE "strands" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "strands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(30) NOT NULL,
	"competency_id" bigint NOT NULL,
	"parent_strand_id" bigint,
	"name" varchar(100) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "strands_code_unique" UNIQUE("code"),
	CONSTRAINT "check_strands_code_format" CHECK ("strands"."code" ~ '^C[1-6]\.[A-Z]{2,5}$')
);
--> statement-breakpoint
ALTER TABLE "child_badges" ADD CONSTRAINT "child_badges_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_params" ADD CONSTRAINT "level_params_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_params" ADD CONSTRAINT "level_params_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_balance" ADD CONSTRAINT "ai_credit_balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_ledger" ADD CONSTRAINT "ai_credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_ledger" ADD CONSTRAINT "ai_credit_ledger_granted_by_manager_id_managers_id_fk" FOREIGN KEY ("granted_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_log" ADD CONSTRAINT "ai_usage_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_uploaded_by_manager_id_managers_id_fk" FOREIGN KEY ("uploaded_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_entitlement_key_entitlement_keys_key_fk" FOREIGN KEY ("entitlement_key") REFERENCES "public"."entitlement_keys"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_granted_by_manager_id_managers_id_fk" FOREIGN KEY ("granted_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_package_code_packages_code_fk" FOREIGN KEY ("package_code") REFERENCES "public"."packages"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_entitlement_key_entitlement_keys_key_fk" FOREIGN KEY ("entitlement_key") REFERENCES "public"."entitlement_keys"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_package_code_packages_code_fk" FOREIGN KEY ("package_code") REFERENCES "public"."packages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_payment_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_subscriptions" ADD CONSTRAINT "recurring_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_subscriptions" ADD CONSTRAINT "recurring_subscriptions_package_code_packages_code_fk" FOREIGN KEY ("package_code") REFERENCES "public"."packages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_enrollments" ADD CONSTRAINT "curriculum_enrollments_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_enrollments" ADD CONSTRAINT "curriculum_enrollments_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_enrollment_id_curriculum_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."curriculum_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_curriculum_item_id_curriculum_items_id_fk" FOREIGN KEY ("curriculum_item_id") REFERENCES "public"."curriculum_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_weeks" ADD CONSTRAINT "curriculum_weeks_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_games" ADD CONSTRAINT "custom_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_recovery_requests" ADD CONSTRAINT "mfa_recovery_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_recovery_requests" ADD CONSTRAINT "mfa_recovery_requests_requested_by_manager_id_managers_id_fk" FOREIGN KEY ("requested_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_recovery_requests" ADD CONSTRAINT "mfa_recovery_requests_completed_by_manager_id_managers_id_fk" FOREIGN KEY ("completed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_identities" ADD CONSTRAINT "social_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tag_map" ADD CONSTRAINT "user_tag_map_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tag_map" ADD CONSTRAINT "user_tag_map_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_review_log" ADD CONSTRAINT "content_review_log_actor_manager_id_managers_id_fk" FOREIGN KEY ("actor_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_seed_batches" ADD CONSTRAINT "content_seed_batches_approved_by_manager_id_managers_id_fk" FOREIGN KEY ("approved_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_resolved_by_manager_id_managers_id_fk" FOREIGN KEY ("resolved_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_manager_id_managers_id_fk" FOREIGN KEY ("updated_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_endpoints" ADD CONSTRAINT "notification_endpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curricula" ADD CONSTRAINT "personal_curricula_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_enrollments" ADD CONSTRAINT "personal_curriculum_enrollments_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_enrollments" ADD CONSTRAINT "personal_curriculum_enrollments_personal_curriculum_id_personal_curricula_id_fk" FOREIGN KEY ("personal_curriculum_id") REFERENCES "public"."personal_curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_item_progress" ADD CONSTRAINT "personal_curriculum_item_progress_enrollment_id_personal_curriculum_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."personal_curriculum_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_item_progress" ADD CONSTRAINT "personal_curriculum_item_progress_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_item_progress" ADD CONSTRAINT "personal_curriculum_item_progress_personal_curriculum_item_id_personal_curriculum_items_id_fk" FOREIGN KEY ("personal_curriculum_item_id") REFERENCES "public"."personal_curriculum_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_curriculum_items" ADD CONSTRAINT "personal_curriculum_items_personal_curriculum_id_personal_curricula_id_fk" FOREIGN KEY ("personal_curriculum_id") REFERENCES "public"."personal_curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plan_items" ADD CONSTRAINT "lesson_plan_items_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "public"."lesson_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_daily_stats" ADD CONSTRAINT "child_daily_stats_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_daily_stats" ADD CONSTRAINT "skill_daily_stats_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_skill_map" ADD CONSTRAINT "content_skill_map_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tag_map" ADD CONSTRAINT "content_tag_map_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_id_skills_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_strand_id_strands_id_fk" FOREIGN KEY ("strand_id") REFERENCES "public"."strands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strands" ADD CONSTRAINT "strands_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strands" ADD CONSTRAINT "strands_parent_strand_id_strands_id_fk" FOREIGN KEY ("parent_strand_id") REFERENCES "public"."strands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_credit_ledger_user_created" ON "ai_credit_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_credit_ledger_ref" ON "ai_credit_ledger" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ai_credit_ledger_idempotency" ON "ai_credit_ledger" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_log_user_created" ON "ai_usage_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_log_feature_created" ON "ai_usage_log" USING btree ("feature","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_content_embeddings_unique" ON "content_embeddings" USING btree ("content_type","content_id","content_version","model","chunk_index");--> statement-breakpoint
CREATE INDEX "idx_content_embeddings_model" ON "content_embeddings" USING btree ("model");--> statement-breakpoint
CREATE INDEX "idx_content_asset_refs_asset_ref" ON "content_asset_refs" USING btree ("asset_ref");--> statement-breakpoint
CREATE INDEX "idx_content_images_owner" ON "content_images" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "idx_entitlements_user_status_expires" ON "entitlements" USING btree ("user_id","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_orders_transfer_note" ON "payment_orders" USING btree ("transfer_note");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_bank_txn_ref" ON "payment_orders" USING btree ("bank_txn_ref");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_status_submitted_at" ON "payment_orders" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "idx_payment_orders_user_id_status" ON "payment_orders" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_transactions_provider_event" ON "payment_transactions" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_order_uuid" ON "payment_transactions" USING btree ("order_uuid");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_created_at" ON "payment_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_recurring_subscriptions_user_status" ON "recurring_subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_recurring_subscriptions_next_billing" ON "recurring_subscriptions" USING btree ("next_billing_at");--> statement-breakpoint
CREATE INDEX "child_profiles_birth_year_idx" ON "child_profiles" USING btree ("birth_year");--> statement-breakpoint
CREATE INDEX "idx_activities_ref" ON "activities" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_activities_published_code" ON "activities" USING btree ("code") WHERE "activities"."status" = 'published';--> statement-breakpoint
CREATE INDEX "idx_activities_entity_id" ON "activities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_activities_activity_id" ON "lesson_activities" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lessons_published_code" ON "lessons" USING btree ("code") WHERE "lessons"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_seo_pages_published_slug" ON "seo_pages" USING btree ("slug") WHERE "seo_pages"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_worksheets_published_code" ON "worksheets" USING btree ("code") WHERE "worksheets"."status" = 'published';--> statement-breakpoint
CREATE INDEX "idx_worksheets_entity_id" ON "worksheets" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_curricula_published_code" ON "curricula" USING btree ("code") WHERE "curricula"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_curriculum_enrollments_child_active_unique" ON "curriculum_enrollments" USING btree ("child_id") WHERE "curriculum_enrollments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_curriculum_enrollments_child_id" ON "curriculum_enrollments" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_curriculum_item_progress_child_id" ON "curriculum_item_progress" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_curriculum_item_progress_enrollment_status" ON "curriculum_item_progress" USING btree ("enrollment_id","status");--> statement-breakpoint
CREATE INDEX "idx_curriculum_items_entity" ON "curriculum_items" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_curriculum_items_entity_id" ON "curriculum_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_custom_games_user_status" ON "custom_games" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_custom_games_user_template" ON "custom_games" USING btree ("user_id","template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_custom_games_uuid" ON "custom_games" USING btree ("uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_export_jobs_uuid" ON "export_jobs" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "idx_export_jobs_user_id" ON "export_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_export_jobs_status" ON "export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_export_jobs_expires_at" ON "export_jobs" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_game_levels_published_code" ON "game_levels" USING btree ("code") WHERE "game_levels"."status" = 'published';--> statement-breakpoint
CREATE INDEX "idx_game_levels_content_pack_gin" ON "game_levels" USING gin ("content_pack");--> statement-breakpoint
CREATE INDEX "idx_active_sessions_account" ON "active_sessions" USING btree ("account_type","account_id");--> statement-breakpoint
CREATE INDEX "idx_mfa_recovery_codes_account" ON "mfa_recovery_codes" USING btree ("account_type","account_id");--> statement-breakpoint
CREATE INDEX "idx_mfa_recovery_requests_user_status" ON "mfa_recovery_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_mfa_recovery_requests_token_hash" ON "mfa_recovery_requests" USING btree ("verification_token_hash");--> statement-breakpoint
CREATE INDEX "idx_verification_tokens_account" ON "verification_tokens" USING btree ("account_type","account_id");--> statement-breakpoint
CREATE INDEX "idx_library_items_collection_id" ON "library_items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_library_items_entity" ON "library_items" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_user_tag_map_entity" ON "user_tag_map" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_created" ON "audit_logs" USING btree ("actor_type","actor_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity_created" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action_created" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_review_log_entity" ON "content_review_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_error_logs_fingerprint_status" ON "error_logs" USING btree ("fingerprint","status");--> statement-breakpoint
CREATE INDEX "idx_error_logs_created_at" ON "error_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_deliveries_active_channel" ON "notification_deliveries" USING btree ("notification_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_endpoints_user_installation" ON "notification_endpoints" USING btree ("user_id","client_installation_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_type","recipient_id");--> statement-breakpoint
CREATE INDEX "idx_personal_curricula_user_id" ON "personal_curricula" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_personal_curricula_uuid" ON "personal_curricula" USING btree ("uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_personal_curriculum_enrollments_child_active_unique" ON "personal_curriculum_enrollments" USING btree ("child_id") WHERE "personal_curriculum_enrollments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_enrollments_child_id" ON "personal_curriculum_enrollments" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_enrollments_curriculum_id" ON "personal_curriculum_enrollments" USING btree ("personal_curriculum_id");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_item_progress_child_id" ON "personal_curriculum_item_progress" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_item_progress_status" ON "personal_curriculum_item_progress" USING btree ("enrollment_id","status");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_items_entity" ON "personal_curriculum_items" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_items_curriculum_week" ON "personal_curriculum_items" USING btree ("personal_curriculum_id","week_no");--> statement-breakpoint
CREATE INDEX "idx_personal_curriculum_items_entity_id" ON "personal_curriculum_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_plan_items_plan_id" ON "lesson_plan_items" USING btree ("lesson_plan_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_plan_items_source_entity" ON "lesson_plan_items" USING btree ("source_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lesson_plans_uuid" ON "lesson_plans" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "idx_lesson_plans_user_id" ON "lesson_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_plans_source_lesson_code" ON "lesson_plans" USING btree ("source_lesson_code");--> statement-breakpoint

-- ═══ §4. Bất biến nội dung — function + trigger ══════════════════════════════
-- BR-CLC-01/BR-SCT-05: hàng `published` là bất biến; sửa nội dung phải tạo version
-- mới. Ép ở trigger vì đây là ràng buộc giữa OLD và NEW — CHECK không thấy OLD.
CREATE OR REPLACE FUNCTION prevent_published_game_level_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-CLC-01/BR-SCT-05: Cannot update published game level version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_published_content_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-CLC-01/BR-SCT-05: Cannot update published content version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- BR-SPT-07: phiên chơi đã kết thúc là bản ghi lịch sử, không sửa lại được.
CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.completion_status IN ('completed', 'abandoned') THEN
        RAISE EXCEPTION 'BR-SPT-07: Cannot update play session after completion or abandonment.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER trigger_prevent_published_game_level_update
  BEFORE UPDATE ON "game_levels"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_game_level_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_lessons_update
  BEFORE UPDATE ON "lessons"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_activities_update
  BEFORE UPDATE ON "activities"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_worksheets_update
  BEFORE UPDATE ON "worksheets"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_curricula_update
  BEFORE UPDATE ON "curricula"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_completed_play_session_update
  BEFORE UPDATE ON "play_sessions"
  FOR EACH ROW EXECUTE FUNCTION prevent_completed_play_session_update();--> statement-breakpoint

-- ═══ §5. Quyền bảng ══════════════════════════════════════════════════════════
-- ALTER DEFAULT PRIVILEGES ở §1 đã phủ các bảng tạo sau nó; hai GRANT dưới đây là
-- lưới an toàn cho bảng nào lọt ra ngoài (vd. tạo bởi migration chạy dưới role khác).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mindkid_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mindkid_app;--> statement-breakpoint

-- BR-DM-05 + BR-SIB-06: bảng INSERT-only. Đây là bằng chứng pháp lý và vết điều
-- tra — ép bằng quyền DB, vì quy ước code không ép được gì.
REVOKE UPDATE, DELETE ON consent_logs FROM mindkid_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM mindkid_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM mindkid_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON telemetry_events FROM mindkid_app;--> statement-breakpoint

-- `payment_orders` sửa được (status chuyển trạng thái) nhưng không xoá được: đơn
-- đã tạo là chứng từ tiền.
REVOKE DELETE ON payment_orders FROM mindkid_app;
