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

  const appPassword =
    process.env.MINDKID_APP_DB_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : "mindkid_app_password");
  if (!appPassword) {
    throw new Error(
      "MINDKID_APP_DB_PASSWORD is required in production for role mindkid_app"
    );
  }
  const escapedAppPassword = appPassword.replace(/'/g, "''");

  const sql = getOwnerSql();
  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mindkid_app') THEN
        CREATE ROLE mindkid_app WITH LOGIN PASSWORD '${escapedAppPassword}';
      END IF;
    END
    $$;
    GRANT USAGE ON SCHEMA public TO mindkid_app;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mindkid_app;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mindkid_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mindkid_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mindkid_app;
    REVOKE UPDATE, DELETE, TRUNCATE ON TABLE consent_logs FROM mindkid_app;
    REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM mindkid_app;

    CREATE OR REPLACE FUNCTION prevent_insert_only_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'BR-DM-05 / BR-SIB-06: Table % is INSERT-only; UPDATE and DELETE are forbidden', TG_TABLE_NAME;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE TRIGGER trg_prevent_consent_logs_mutation
      BEFORE UPDATE OR DELETE ON consent_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_insert_only_mutation();

    CREATE OR REPLACE TRIGGER trg_prevent_audit_logs_mutation
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_insert_only_mutation();

    CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.completion_status = 'completed' THEN
        RAISE EXCEPTION 'BR-SPT-07: Cannot update completed play session';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

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
