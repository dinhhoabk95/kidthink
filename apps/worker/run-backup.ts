import { runPostgresBackup } from "./src/backup/postgres.ts";

runPostgresBackup("manual")
  .catch(console.error)
  .finally(() => process.exit(0));
