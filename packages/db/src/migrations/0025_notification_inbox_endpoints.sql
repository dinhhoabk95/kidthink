ALTER TYPE "notification_channel" ADD VALUE IF NOT EXISTS 'fcm_web';

DO $$ BEGIN
  CREATE TYPE "notification_endpoint_provider" AS ENUM ('fcm_web');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_endpoint_status" AS ENUM ('active', 'invalid', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notification_reads" (
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_endpoints" (
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

DO $$ BEGIN
  ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_endpoints" ADD CONSTRAINT "notification_endpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_endpoints_user_installation" ON "notification_endpoints" ("user_id","client_installation_id");
