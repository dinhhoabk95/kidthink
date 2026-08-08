CREATE TYPE "public"."entitlement_group" AS ENUM('content', 'account', 'report', 'creator', 'ai');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('package_order', 'manual_grant', 'trial', 'promo');--> statement-breakpoint
CREATE TYPE "public"."entitlement_status" AS ENUM('pending', 'soft_unlock', 'active', 'grace_period', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."payment_order_status" AS ENUM('pending_proof', 'submitted', 'approved', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "entitlement_keys" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"group" "entitlement_group" NOT NULL,
	"label_vi" varchar(100) NOT NULL,
	"description_vi" text,
	"is_mvp" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	CONSTRAINT "package_entitlements_package_code_entitlement_key_pk" PRIMARY KEY("package_code","entitlement_key")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"code" varchar(40) PRIMARY KEY NOT NULL,
	"name_vi" varchar(100) NOT NULL,
	"audience_vi" varchar(100) NOT NULL,
	"description_vi" text,
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
	"status" "payment_order_status" DEFAULT 'pending_proof' NOT NULL,
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
	CONSTRAINT "payment_orders_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "quota_usage" (
	"user_id" bigint NOT NULL,
	"quota_key" varchar(60) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"limit_snapshot" integer NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_usage_user_id_quota_key_period_start_pk" PRIMARY KEY("user_id","quota_key","period_start")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_entitlement_key_entitlement_keys_key_fk" FOREIGN KEY ("entitlement_key") REFERENCES "public"."entitlement_keys"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_granted_by_manager_id_managers_id_fk" FOREIGN KEY ("granted_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_package_code_packages_code_fk" FOREIGN KEY ("package_code") REFERENCES "public"."packages"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_entitlement_key_entitlement_keys_key_fk" FOREIGN KEY ("entitlement_key") REFERENCES "public"."entitlement_keys"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_package_code_packages_code_fk" FOREIGN KEY ("package_code") REFERENCES "public"."packages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_entitlements_user_status_expires" ON "entitlements" USING btree ("user_id","status","expires_at");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;