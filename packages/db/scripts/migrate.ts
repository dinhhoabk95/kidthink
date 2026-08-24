import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getOwnerDb } from "#src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "../src/migrations");

console.log("[db:migrate] Applying migrations from:", migrationsFolder);

try {
  const db = getOwnerDb();
  await migrate(db, { migrationsFolder });
  console.log("✅ [db:migrate] Migrations completed successfully");
  process.exit(0);
} catch (err) {
  console.error("❌ [db:migrate] Migration failed:", err);
  process.exit(1);
}
