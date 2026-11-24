const DEPRECATED_CUTOVER_MESSAGE =
  "Hệ thống đã chuẩn hoá hoàn toàn sang SQLite/D1. Lệnh verify-parity với PostgreSQL đã được gỡ bỏ.";

export interface CutoverParityReport {
  readonly passed: boolean;
  readonly checks: readonly { readonly table: string }[];
}

export function runCliVerifyParity(
  _coreSqlitePath: string,
  _logsSqlitePath: string | undefined,
  _databaseUrl: string
): Promise<CutoverParityReport> {
  return Promise.reject(new Error(DEPRECATED_CUTOVER_MESSAGE));
}

if (process.argv[1]?.endsWith("verify-parity.ts")) {
  console.error(`❌ [verify-parity] ${DEPRECATED_CUTOVER_MESSAGE}`);
  process.exit(1);
}
