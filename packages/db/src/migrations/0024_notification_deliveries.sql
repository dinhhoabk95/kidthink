CREATE TABLE IF NOT EXISTS "notification_deliveries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_deliveries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"notification_id" bigint NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"suppressed_reason" text,
	"provider_message_id" varchar(100),
	"dispatched_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_deliveries_active_channel" ON "notification_deliveries" ("notification_id", "channel");

INSERT INTO "notification_deliveries" (
  "notification_id", "channel", "status", "suppressed_reason", "provider_message_id", "dispatched_at", "error", "created_at"
)
SELECT
  "id",
  COALESCE("channel", 'email'::notification_channel),
  COALESCE("status", 'queued'::notification_status),
  "suppressed_reason",
  "provider_message_id",
  "dispatched_at",
  "error",
  "created_at"
FROM "notifications"
ON CONFLICT ("notification_id", "channel") DO NOTHING;

ALTER TABLE "notifications" DROP COLUMN IF EXISTS "channel";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "status";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "suppressed_reason";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "provider_message_id";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "dispatched_at";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "error";
