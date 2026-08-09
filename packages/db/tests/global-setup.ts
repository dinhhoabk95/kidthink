import postgres from "postgres";

/**
 * Vitest globalSetup cho packages/db — chạy đúng một lần trước mỗi `vitest run`,
 * không phải trước mỗi test/file.
 *
 * Fix D-BX (Task #15, gate P0.8): integration test insert
 * dữ liệu nhưng không dọn, nên mỗi lần `vitest run` cộng dồn vào database thay vì bắt
 * đầu sạch. Với các trường random trong keyspace nhỏ (vd. `seq` 1000-9999 ở
 * game.test.ts), số dòng rác tích luỹ đủ lớn thì random tự đụng độ — đúng lỗi đã đo
 * được 2026-08-09: `game_levels` có 456 dòng rác trước fix này, và
 * `game_levels_code_version_unique` báo duplicate key ở lần chạy tiếp theo.
 *
 * Dọn bằng TRUNCATE liệt kê rõ tên bảng (không dùng toàn schema). Database Docker local
 * được xem là disposable khi chạy test; guard BR-TST-05 từ chối mọi host không phải
 * loopback để không thể chạm DB từ xa. Ca âm nằm ở `tests/global-setup.test.ts`.
 */

const TABLES = [
  "active_sessions",
  "activities",
  "audit_logs",
  "backup_log",
  "child_daily_stats",
  "child_profiles",
  "child_session_summaries",
  "competencies",
  "consent_logs",
  "content_images",
  "content_review_log",
  "content_skill_map",
  "content_tag_map",
  "content_tags",
  "curricula",
  "curriculum_enrollments",
  "curriculum_item_progress",
  "curriculum_items",
  "entitlement_keys",
  "entitlements",
  "game_levels",
  "game_templates",
  "learning_objectives",
  "lesson_activities",
  "lessons",
  "level_daily_stats",
  "level_params",
  "managers",
  "mastery_state",
  "mfa_recovery_codes",
  "mfa_settings",
  "notifications",
  "package_entitlements",
  "packages",
  "payment_orders",
  "play_sessions",
  "quota_usage",
  "skill_daily_stats",
  "skill_prerequisites",
  "skills",
  "social_identities",
  "strands",
  "telemetry_events",
  "user_tags",
  "users",
  "verification_tokens",
  "worksheets",
] as const;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** BR-TST-05: destructive test cleanup may only target this machine. */
export function assertDisposableDatabaseUrl(databaseUrl: string): void {
  const { hostname } = new URL(databaseUrl);
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      "Refusing destructive test cleanup: DATABASE_URL must use a loopback host"
    );
  }
}

/**
 * `tables` cho phép test tiêm một danh sách bảng nhỏ, tách biệt để kiểm cơ chế mà
 * không đụng bảng chia sẻ với các integration test khác đang chạy song song. Mặc định
 * (không truyền) dùng đúng danh sách thật `TABLES` ở trên — đường chạy production.
 */
export async function truncateAllTestTables(
  databaseUrl?: string,
  tables: readonly string[] = TABLES
): Promise<void> {
  const url =
    databaseUrl ??
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5433/kidthink";
  assertDisposableDatabaseUrl(url);
  const sql = postgres(url);
  try {
    await sql`truncate table ${sql(tables)} restart identity cascade`;
  } finally {
    await sql.end();
  }
}

export default async function setup(): Promise<void> {
  await truncateAllTestTables();
}
