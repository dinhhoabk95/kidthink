DO $$ BEGIN
 ALTER TYPE "public"."image_owner_type" ADD VALUE IF NOT EXISTS 'payment_order';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TYPE "public"."image_owner_type" ADD VALUE IF NOT EXISTS 'payment_proof';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TYPE "public"."image_owner_type" ADD VALUE IF NOT EXISTS 'custom_game';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."image_visibility" AS ENUM('public', 'private');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."image_status" AS ENUM('active', 'orphan', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "thumb_path" text;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "width" integer;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "height" integer;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "bytes" integer;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "mime" varchar(50);
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "visibility" "image_visibility" DEFAULT 'public' NOT NULL;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "status" "image_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "uploaded_by_manager_id" bigint REFERENCES "managers"("id");

CREATE TABLE IF NOT EXISTS "content_asset_refs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_asset_refs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"asset_kind" varchar(50) NOT NULL,
	"asset_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_asset_refs_unique" UNIQUE("entity_type","entity_id","asset_kind","asset_ref")
);

CREATE INDEX IF NOT EXISTS "idx_content_asset_refs_asset_ref" ON "content_asset_refs" USING btree ("asset_ref");
CREATE INDEX IF NOT EXISTS "idx_content_asset_refs_entity" ON "content_asset_refs" USING btree ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "idx_game_levels_content_pack_gin" ON "game_levels" USING gin ("content_pack");
-- Migration complete
