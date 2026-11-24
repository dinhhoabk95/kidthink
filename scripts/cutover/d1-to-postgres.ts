const DEPRECATED_CUTOVER_MESSAGE =
  "Hệ thống đã chuẩn hoá hoàn toàn sang SQLite/D1. Lệnh d1-to-postgres đã được gỡ bỏ.";

export function runCliD1ToPostgres(
  _coreSqlitePath: string,
  _logsSqlitePath: string | undefined,
  _databaseUrl: string
): Promise<number> {
  return Promise.reject(new Error(DEPRECATED_CUTOVER_MESSAGE));
}

if (process.argv[1]?.endsWith("d1-to-postgres.ts")) {
  console.error(`❌ [d1-to-postgres] ${DEPRECATED_CUTOVER_MESSAGE}`);
  process.exit(1);
}
