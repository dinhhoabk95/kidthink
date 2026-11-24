const DEPRECATED_CUTOVER_MESSAGE =
  "Hệ thống đã chuẩn hoá hoàn toàn sang SQLite/D1. Luồng cutover sang PostgreSQL đã được gỡ bỏ.";

export function runCutoverCfToVps(): Promise<never> {
  return Promise.reject(new Error(DEPRECATED_CUTOVER_MESSAGE));
}

if (process.argv[1]?.endsWith("cf-to-vps.ts")) {
  console.error(`❌ [cutover] ${DEPRECATED_CUTOVER_MESSAGE}`);
  process.exit(1);
}
