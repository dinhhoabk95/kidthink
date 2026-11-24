import { DB } from "#src/manager";

console.log(
  "[db:migrate] Initializing SQLite database and applying squashed migration..."
);

try {
  DB.setDefaultConnection("sqlite");
  const sqliteDriver = DB.getSqliteDriver();
  sqliteDriver.getOwnerDb();
  const paths = sqliteDriver.getPaths();
  console.log("✅ [db:migrate] SQLite schema ready at:", paths.dbPath);
  await DB.disconnectAll();
  process.exit(0);
} catch (err) {
  console.error("❌ [db:migrate] Migration failed:", err);
  process.exit(1);
}
