CREATE TYPE "public"."skill_status" AS ENUM('seeded', 'deprecated');--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "competencies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name_vi" varchar(100) NOT NULL,
	"description_vi" text,
	"color_token" varchar(50) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "competencies_code_unique" UNIQUE("code"),
	CONSTRAINT "check_competencies_code_format" CHECK ("competencies"."code" ~ '^C[1-6]$')
);
--> statement-breakpoint
CREATE TABLE "learning_objectives" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "learning_objectives_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"skill_id" bigint NOT NULL,
	"behaviour_vi" text NOT NULL,
	"observable_criteria_vi" text,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "learning_objectives_code_unique" UNIQUE("code"),
	CONSTRAINT "check_learning_objectives_code_format" CHECK ("learning_objectives"."code" ~ '^LO-C[1-6]\.[A-Z]{2,5}\.\d{2}-\d{2}$')
);
--> statement-breakpoint
CREATE TABLE "skill_prerequisites" (
	"skill_id" bigint NOT NULL,
	"prerequisite_id" bigint NOT NULL,
	"strength" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	CONSTRAINT "skill_prerequisites_skill_id_prerequisite_id_pk" PRIMARY KEY("skill_id","prerequisite_id"),
	CONSTRAINT "check_skill_prerequisites_strength" CHECK ("skill_prerequisites"."strength" >= 0 AND "skill_prerequisites"."strength" <= 1)
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(40) NOT NULL,
	"strand_id" bigint NOT NULL,
	"name_vi" varchar(100) NOT NULL,
	"description_vi" text,
	"age_min" smallint NOT NULL,
	"age_max" smallint NOT NULL,
	"difficulty" smallint NOT NULL,
	"thinking_processes" text[],
	"what_axis" text[],
	"status" "skill_status" DEFAULT 'seeded' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "skills_code_unique" UNIQUE("code"),
	CONSTRAINT "check_skills_code_format" CHECK ("skills"."code" ~ '^C[1-6]\.[A-Z]{2,5}\.\d{2}$'),
	CONSTRAINT "check_skills_age_min" CHECK ("skills"."age_min" >= 3 AND "skills"."age_min" <= 6),
	CONSTRAINT "check_skills_age_max" CHECK ("skills"."age_max" >= 3 AND "skills"."age_max" <= 6),
	CONSTRAINT "check_skills_age_range" CHECK ("skills"."age_min" <= "skills"."age_max"),
	CONSTRAINT "check_skills_difficulty" CHECK ("skills"."difficulty" >= 1 AND "skills"."difficulty" <= 5)
);
--> statement-breakpoint
CREATE TABLE "strands" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "strands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(30) NOT NULL,
	"competency_id" bigint NOT NULL,
	"parent_strand_id" bigint,
	"name_vi" varchar(100) NOT NULL,
	"description_vi" text,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "strands_code_unique" UNIQUE("code"),
	CONSTRAINT "check_strands_code_format" CHECK ("strands"."code" ~ '^C[1-6]\.[A-Z]{2,5}$')
);
--> statement-breakpoint
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_id_skills_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_strand_id_strands_id_fk" FOREIGN KEY ("strand_id") REFERENCES "public"."strands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strands" ADD CONSTRAINT "strands_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strands" ADD CONSTRAINT "strands_parent_strand_id_strands_id_fk" FOREIGN KEY ("parent_strand_id") REFERENCES "public"."strands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;