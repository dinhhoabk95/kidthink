DO $$ BEGIN
 CREATE TYPE "public"."seo_page_type" AS ENUM('competency', 'skill', 'age_program', 'topic', 'static');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "seo_pages" (
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
	"created_by_manager_id" bigint REFERENCES "managers"("id"),
	"reviewed_by_manager_id" bigint REFERENCES "managers"("id"),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_slug_version_unique" UNIQUE("slug","content_version")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_seo_pages_published_slug" ON "seo_pages" USING btree ("slug") WHERE ("status" = 'published');
