CREATE TABLE IF NOT EXISTS "content_audio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" varchar(50) NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"path" varchar(255) NOT NULL,
	"duration_ms" integer NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"uploaded_by_manager_id" bigint NOT NULL REFERENCES "public"."managers"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_audio_owner" ON "content_audio" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_play_sessions_session_uuid" ON "play_sessions" USING btree ("session_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_play_sessions_child_started_at" ON "play_sessions" USING btree ("child_profile_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_play_sessions_guest_status" ON "play_sessions" USING btree ("guest_device_id","completion_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_telemetry_events_created_at" ON "telemetry_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_tag_map_tag_entity" ON "content_tag_map" USING btree ("tag_id","entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_skill_map_skill_entity" ON "content_skill_map" USING btree ("skill_id","entity_type");
