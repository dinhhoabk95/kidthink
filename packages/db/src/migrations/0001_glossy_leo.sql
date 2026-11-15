CREATE TABLE "child_mascot_gear" (
	"child_profile_id" bigint PRIMARY KEY NOT NULL,
	"equipped_gear_code" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_sticker_placements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_sticker_placements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"theme_code" varchar(30) NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"instance_index" smallint NOT NULL,
	"norm_x" double precision NOT NULL,
	"norm_y" double precision NOT NULL,
	"scale" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_child_sticker_placements_item" UNIQUE("child_profile_id","theme_code","emoji","instance_index"),
	CONSTRAINT "check_child_sticker_placements_instance" CHECK ("child_sticker_placements"."instance_index" >= 0 AND "child_sticker_placements"."instance_index" <= 23),
	CONSTRAINT "check_child_sticker_placements_norm_x" CHECK ("child_sticker_placements"."norm_x" >= 0.05 AND "child_sticker_placements"."norm_x" <= 0.95),
	CONSTRAINT "check_child_sticker_placements_norm_y" CHECK ("child_sticker_placements"."norm_y" >= 0.05 AND "child_sticker_placements"."norm_y" <= 0.95),
	CONSTRAINT "check_child_sticker_placements_scale" CHECK ("child_sticker_placements"."scale" >= 0.75 AND "child_sticker_placements"."scale" <= 1.35)
);
--> statement-breakpoint
ALTER TABLE "child_mascot_gear" ADD CONSTRAINT "child_mascot_gear_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_sticker_placements" ADD CONSTRAINT "child_sticker_placements_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_child_sticker_placements_child_theme" ON "child_sticker_placements" USING btree ("child_profile_id","theme_code");