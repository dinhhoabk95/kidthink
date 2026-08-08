CREATE TABLE "curricula" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curricula_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"title_vi" varchar(200) NOT NULL,
	"description_vi" text,
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
	CONSTRAINT "check_curricula_code_format" CHECK ("curricula"."code" ~ '^CUR-\d{3}$')
);
--> statement-breakpoint
CREATE TABLE "curriculum_enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_id" bigint NOT NULL,
	"curriculum_id" bigint NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_item_progress" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_item_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"child_id" bigint NOT NULL,
	"curriculum_item_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"curriculum_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_items_curriculum_id_position_unique" UNIQUE("curriculum_id","position")
);
--> statement-breakpoint
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_enrollments" ADD CONSTRAINT "curriculum_enrollments_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_enrollment_id_curriculum_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."curriculum_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_curriculum_item_id_curriculum_items_id_fk" FOREIGN KEY ("curriculum_item_id") REFERENCES "public"."curriculum_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_curriculum_id_curricula_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_curricula_published_code" ON "curricula" USING btree ("code") WHERE "curricula"."status" = 'published';--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_curricula_update
BEFORE UPDATE ON curricula
FOR EACH ROW
EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;