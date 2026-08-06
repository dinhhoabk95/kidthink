/**
 * check:services — verify PostgreSQL và Valkey kết nối được **từ Node**.
 *
 * repo-bootstrap.md §4 bước 5 yêu cầu đúng điều này trước khi viết schema.
 * `docker compose ps` chỉ nói container sống; nó không nói driver Node nối được.
 *
 * BR-RBS-07: major version phải khớp production — script khẳng định luôn, không
 * chỉ khẳng định "nối được".
 */

import Redis from "ioredis";
import postgres from "postgres";

const EXPECTED_POSTGRES_MAJOR = 17;
const EXPECTED_VALKEY_MAJOR = 9;

/**
 * Default port phải khớp host port ở `docker-compose.yml` (5433/6380, không
 * phải 5432/6379 mặc định của image).
 *
 * Đo được 2026-08-06: default 5432/6379 nối vào container của stack KHÁC trên
 * máy dev này (`hlo-api-postgres-1`, `hlo-api-valkey-1`) và in `✅ Valkey 9.1.0`
 * — xanh giả, vì nó khẳng định version của service không thuộc repo này.
 * Version thật của kidthink là 9.1.1.
 */
const PG_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/kidthink";
const VALKEY_HOST = process.env.VALKEY_HOST ?? "localhost";
const DEFAULT_VALKEY_PORT = 6380;
const MAX_PORT = 65_535;

const VALKEY_VERSION_PATTERN = /valkey_version:([\d.]+)/;

/**
 * `Number("abc")` → NaN, và ioredis nối vào NaN sẽ fail bằng lỗi mạng khó hiểu.
 * Fail ngay tại nguồn với tên biến môi trường sai.
 */
function envPort(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
    throw new Error(`${name}="${raw}" không phải port hợp lệ (1–${MAX_PORT})`);
  }
  return port;
}

/**
 * Khẳng định major version khớp production (BR-RBS-07).
 * Tách "không đọc được version" khỏi "version sai" — bản cũ để cả hai rơi vào
 * `Number("")` → 0 và báo "major 0", giấu mất nguyên nhân thật.
 */
function assertMajor(label: string, version: string, expected: number): void {
  const major = Number.parseInt(version.split(".")[0] ?? "", 10);
  if (!Number.isInteger(major)) {
    throw new Error(`${label}: không đọc được version từ "${version}"`);
  }
  if (major !== expected) {
    throw new Error(`${label} major ${major}, cần ${expected} (BR-RBS-07)`);
  }
}

async function checkPostgres(): Promise<string> {
  const sql = postgres(PG_URL, { max: 1, onnotice: () => undefined });
  try {
    const [row] = await sql<{ server_version: string }[]>`SHOW server_version`;
    const version = row?.server_version ?? "";
    assertMajor("PostgreSQL", version, EXPECTED_POSTGRES_MAJOR);
    return version;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function checkValkey(): Promise<string> {
  const redis = new Redis({
    host: VALKEY_HOST,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    port: envPort("VALKEY_PORT", DEFAULT_VALKEY_PORT),
    retryStrategy: () => null,
  });
  try {
    await redis.connect();
    const info = await redis.info("server");
    const version = VALKEY_VERSION_PATTERN.exec(info)?.[1] ?? "";
    assertMajor("Valkey", version, EXPECTED_VALKEY_MAJOR);
    return version;
  } finally {
    redis.disconnect();
  }
}

const results = await Promise.allSettled([checkPostgres(), checkValkey()]);
const labels = ["PostgreSQL", "Valkey"];
let failed = false;

for (const [index, result] of results.entries()) {
  if (result.status === "fulfilled") {
    process.stdout.write(`✅ ${labels[index]} ${result.value}\n`);
    continue;
  }
  failed = true;
  const reason =
    result.reason instanceof Error
      ? result.reason.message
      : String(result.reason);
  process.stdout.write(`❌ ${labels[index]}: ${reason}\n`);
}

if (failed) {
  process.stdout.write(
    "\n[check:services] Chạy `docker compose up -d` rồi thử lại.\n"
  );
  process.exit(1);
}
