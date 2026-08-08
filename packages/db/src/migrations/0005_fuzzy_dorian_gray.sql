CREATE TYPE "public"."tag_axis" AS ENUM('what', 'thinking', 'mechanic', 'theme');--> statement-breakpoint
CREATE TYPE "public"."tag_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TABLE "content_skill_map" (
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"skill_id" bigint NOT NULL,
	"weight" numeric(3, 2) NOT NULL,
	CONSTRAINT "content_skill_map_entity_type_entity_id_skill_id_pk" PRIMARY KEY("entity_type","entity_id","skill_id"),
	CONSTRAINT "check_content_skill_map_weight" CHECK ("content_skill_map"."weight" > 0 AND "content_skill_map"."weight" <= 1)
);
--> statement-breakpoint
CREATE TABLE "content_tag_map" (
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	CONSTRAINT "content_tag_map_entity_type_entity_id_tag_id_pk" PRIMARY KEY("entity_type","entity_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"axis" "tag_axis" NOT NULL,
	"label_vi" varchar(100) NOT NULL,
	"status" "tag_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "content_tags_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"label" varchar(100) NOT NULL,
	CONSTRAINT "user_tags_user_id_label_unique" UNIQUE("user_id","label")
);
--> statement-breakpoint
ALTER TABLE "content_skill_map" ADD CONSTRAINT "content_skill_map_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tag_map" ADD CONSTRAINT "content_tag_map_tag_id_content_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."content_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;