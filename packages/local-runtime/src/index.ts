import path from "node:path";
import { resolveSqliteDatabasePath } from "@mindkid/db";

export * from "./auth-runtime.js";
export * from "./queue-runtime.js";
export * from "./timer-alarm.js";

export type LocalEngineName = "auth" | "queue";

/**
 * File SQLite của engine local cạnh DB dev (`SQLITE_DATA_DIR`, mặc định
 * `.data/sqlite/`); `":memory:"` khi `SQLITE_DATA_DIR=":memory:"`. Web và worker
 * dev phân giải cùng đường dẫn nên chia sẻ một file queue (D15).
 */
export function resolveLocalEnginePath(name: LocalEngineName): string {
  const resolved = resolveSqliteDatabasePath();
  if (resolved.isMemory) {
    return ":memory:";
  }
  return path.join(resolved.dataDir, `do-${name}.sqlite`);
}
