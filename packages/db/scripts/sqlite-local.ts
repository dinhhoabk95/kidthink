import type { SqliteDatabasePath } from "#src/drivers/types";
import { DB } from "#src/manager";
import { collectAllTables } from "#src/purge-scope";
import { seed } from "#src/seed";

export interface SqliteLocalSummary {
  readonly dataDir: string;
  readonly paths: SqliteDatabasePath;
  readonly schemaTableCount: number;
  readonly createdTableCount: number;
  readonly triggerCount: number;
}

function countSqliteMasterObjects(objectType: "table" | "trigger"): number {
  const db = DB.getSqliteDriver().getRawDatabase();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = ?1 AND name NOT LIKE 'sqlite_%';"
    )
    .get(objectType);
  const rawCount = row?.cnt;
  return typeof rawCount === "number" ? rawCount : Number(rawCount ?? 0);
}

export function initLocalSqlite(dataDir?: string): SqliteLocalSummary {
  process.env.DB_CONNECTION = "sqlite";
  if (dataDir !== undefined) {
    DB.configureSqlite({ dataDir });
  }
  DB.setDefaultConnection("sqlite");

  const sqliteDriver = DB.getSqliteDriver();
  sqliteDriver.getAppDb();
  const paths = sqliteDriver.getPaths();

  return {
    dataDir: paths.dataDir,
    paths,
    schemaTableCount: collectAllTables().length,
    createdTableCount: countSqliteMasterObjects("table"),
    triggerCount: countSqliteMasterObjects("trigger"),
  };
}

export async function seedLocalSqlite(
  dataDir?: string
): Promise<SqliteLocalSummary> {
  const summary = initLocalSqlite(dataDir);
  await seed();
  return summary;
}

async function runCli(): Promise<void> {
  const rawCommand = process.argv[2] ?? "init";
  if (rawCommand === "init" || rawCommand === "migrate") {
    const summary = initLocalSqlite();
    console.log(
      `[sqlite:local] Initialized SQLite at ${summary.paths.dbPath} (${summary.createdTableCount}/${summary.schemaTableCount} tables, ${summary.triggerCount} triggers).`
    );
    await DB.disconnectAll();
    return;
  }

  if (rawCommand === "seed") {
    const summary = await seedLocalSqlite();
    console.log(
      `[sqlite:local] Seeded local SQLite at ${summary.paths.dbPath}.`
    );
    await DB.disconnectAll();
    return;
  }

  throw new Error(
    `Unknown sqlite-local command '${rawCommand}'. Expected 'init', 'migrate', or 'seed'.`
  );
}

if (process.argv[1]?.endsWith("sqlite-local.ts")) {
  runCli()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[sqlite:local] Fatal error:", err);
      process.exit(1);
    });
}
