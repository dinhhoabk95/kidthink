DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mastery_state' AND column_name = 'attempts_count') THEN
    ALTER TABLE "mastery_state" RENAME COLUMN "attempts_count" TO "attempts_total";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mastery_state' AND column_name = 'last_practiced_at') THEN
    ALTER TABLE "mastery_state" RENAME COLUMN "last_practiced_at" TO "last_seen_at";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "mastery_state" DROP COLUMN IF EXISTS "p_guess";
--> statement-breakpoint
ALTER TABLE "mastery_state" DROP COLUMN IF EXISTS "p_slip";
--> statement-breakpoint
ALTER TABLE "mastery_state" DROP COLUMN IF EXISTS "p_transit";
--> statement-breakpoint
ALTER TABLE "mastery_state" ADD COLUMN IF NOT EXISTS "hint_rate" numeric(5, 4) DEFAULT '0.0000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "mastery_state" ADD COLUMN IF NOT EXISTS "best_p_learn" numeric(5, 4) DEFAULT '0.1000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "mastery_state" ADD COLUMN IF NOT EXISTS "params_version" varchar(20) DEFAULT 'v1' NOT NULL;
--> statement-breakpoint
ALTER TABLE "mastery_state" DROP CONSTRAINT IF EXISTS "check_mastery_state_hint_rate";
--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "check_mastery_state_hint_rate" CHECK ("hint_rate" >= 0 AND "hint_rate" <= 1);
--> statement-breakpoint
ALTER TABLE "mastery_state" DROP CONSTRAINT IF EXISTS "check_mastery_state_best_p_learn";
--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "check_mastery_state_best_p_learn" CHECK ("best_p_learn" >= 0 AND "best_p_learn" <= 1);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "child_badges" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "child_badges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_profile_id" bigint NOT NULL,
	"badge_code" varchar(50) NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_ref" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_badges_child_profile_id_badge_code_unique" UNIQUE("child_profile_id","badge_code")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'child_badges_child_profile_id_child_profiles_id_fk'
  ) THEN
    ALTER TABLE "child_badges" ADD CONSTRAINT "child_badges_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
