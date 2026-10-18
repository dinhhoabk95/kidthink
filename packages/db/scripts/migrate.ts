import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getOwnerDb, getOwnerSql } from "#src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "../src/migrations");

console.log("[db:migrate] Applying migrations from:", migrationsFolder);

try {
  const db = getOwnerDb();
  await migrate(db, { migrationsFolder });

  const sql = getOwnerSql();
  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mindkid_app') THEN
        CREATE ROLE mindkid_app WITH LOGIN PASSWORD 'mindkid_app_password';
      END IF;
    END
    $$;
    GRANT USAGE ON SCHEMA public TO mindkid_app;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mindkid_app;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mindkid_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mindkid_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mindkid_app;
    REVOKE UPDATE, DELETE ON TABLE consent_logs FROM mindkid_app;
    REVOKE UPDATE, DELETE ON TABLE audit_logs FROM mindkid_app;

    CREATE OR REPLACE FUNCTION prevent_published_update()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status = 'published' THEN
        IF NEW.status = 'archived' AND
           (to_jsonb(NEW) - 'status' - 'archived_at' - 'updated_at') =
           (to_jsonb(OLD) - 'status' - 'archived_at' - 'updated_at') THEN
          RETURN NEW;
        END IF;
        IF TG_TABLE_NAME = 'lessons' AND NEW.status = 'published' AND
           (to_jsonb(NEW) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') =
           (to_jsonb(OLD) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') AND
           (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'BR-CLC-01 / BR-SCT-05: Cannot update published content';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.completion_status = 'completed' THEN
        RAISE EXCEPTION 'BR-SPT-07: Cannot update completed play session';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE TRIGGER trg_prevent_published_game_levels
      BEFORE UPDATE ON game_levels
      FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

    CREATE OR REPLACE TRIGGER trg_prevent_published_lessons
      BEFORE UPDATE ON lessons
      FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

    CREATE OR REPLACE TRIGGER trg_prevent_published_activities
      BEFORE UPDATE ON activities
      FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

    CREATE OR REPLACE TRIGGER trg_prevent_published_curricula
      BEFORE UPDATE ON curricula
      FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

    CREATE OR REPLACE TRIGGER trg_prevent_published_worksheets
      BEFORE UPDATE ON worksheets
      FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

    CREATE OR REPLACE TRIGGER trg_prevent_completed_play_sessions
      BEFORE UPDATE ON play_sessions
      FOR EACH ROW EXECUTE FUNCTION prevent_completed_play_session_update();
  `);

  console.log("✅ [db:migrate] Migrations completed successfully");
  process.exit(0);
} catch (err) {
  console.error("❌ [db:migrate] Migration failed:", err);
  process.exit(1);
}
