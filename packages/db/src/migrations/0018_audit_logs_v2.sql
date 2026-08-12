ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "changes";
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "before_data" jsonb;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "after_data" jsonb;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "chk_audit_logs_actor" CHECK (
  ("actor_type" = 'system' AND "actor_id" IS NULL) OR
  ("actor_type" <> 'system' AND "actor_id" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_created" ON "audit_logs" ("entity_type", "entity_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action_created" ON "audit_logs" ("action", "created_at");
