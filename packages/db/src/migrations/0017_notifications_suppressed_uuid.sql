ALTER TYPE "public"."notification_status" ADD VALUE IF NOT EXISTS 'suppressed';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "suppressed_reason" text;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "provider_message_id" varchar(100);
