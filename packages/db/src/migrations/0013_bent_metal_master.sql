ALTER TABLE "telemetry_events" ADD COLUMN "child_uuid" uuid;--> statement-breakpoint
ALTER TABLE "telemetry_events" ADD COLUMN "game_level_id" bigint;--> statement-breakpoint
ALTER TABLE "telemetry_events" ADD COLUMN "content_version" integer;--> statement-breakpoint
ALTER TABLE "telemetry_events" ADD COLUMN "template_id" bigint;--> statement-breakpoint
ALTER TABLE "telemetry_events" ADD COLUMN "occurred_at_ms" integer;--> statement-breakpoint
ALTER TABLE "telemetry_events" ADD COLUMN "ingested_at" timestamp with time zone DEFAULT now() NOT NULL;