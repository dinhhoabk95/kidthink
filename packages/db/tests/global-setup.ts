import path from "node:path";
import { requireEnv } from "@mindkid/config";
import {
  databaseNameOf,
  maintenanceDatabaseUrl,
  TEST_DATABASE_SUFFIX,
  testDatabaseUrls,
} from "@mindkid/config/vitest/test-database";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
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
 *
 * Danh sách chép tay thì sẽ lệch: nó đứng yên ở 56 tên trong khi schema lên 78, nên 22
 * bảng thêm sau (`library_items`, `payment_transactions`, `error_logs`, …) chưa từng được
 * dọn — đúng lỗi D-BX tái diễn trên nhóm bảng mới, chỉ chưa ai đo. Danh sách vẫn viết tay
 * (giữ nguyên chủ ý "không TRUNCATE cả schema") nhưng nay có cổng:
 * `global-setup.test.ts` đối chiếu nó với `pg_tables` và đỏ ngay khi thiếu một tên.
 */

export const TABLES = [
  "active_sessions",
  "activities",
  "ai_credit_balance",
  "ai_credit_ledger",
  "ai_usage_log",
  "audit_logs",
  "backup_log",
  "child_badges",
  "child_daily_stats",
  "child_profiles",
  "child_session_summaries",
  "collections",
  "competencies",
  "consent_logs",
  "consent_requirements",
  "content_asset_refs",
  "content_embeddings",
  "content_images",
  "content_review_log",
  "content_seed_batches",
  "content_skill_map",
  "content_tag_map",
  "content_tags",
  "curricula",
  "curriculum_enrollments",
  "curriculum_item_progress",
  "curriculum_items",
  "curriculum_weeks",
  "custom_games",
  "emoji_registry",
  "entitlement_keys",
  "entitlements",
  "error_logs",
  "export_jobs",
  "feature_flags",
  "game_level_rounds",
  "game_levels",
  "game_templates",
  "learning_objectives",
  "lesson_activities",
  "lesson_plan_items",
  "lesson_plans",
  "lesson_run_observations",
  "lesson_run_steps",
  "lesson_runs",
  "lessons",
  "level_daily_stats",
  "level_params",
  "library_items",
  "managers",
  "mastery_state",
  "mfa_recovery_codes",
  "mfa_recovery_requests",
  "mfa_settings",
  "notification_deliveries",
  "notification_endpoints",
  "notification_reads",
  "notifications",
  "package_entitlements",
  "packages",
  "payment_orders",
  "payment_transactions",
  "personal_curricula",
  "personal_curriculum_enrollments",
  "personal_curriculum_item_progress",
  "personal_curriculum_items",
  "play_sessions",
  "quota_usage",
  "recurring_subscriptions",
  "seo_pages",
  "skill_action_suggestions",
  "skill_daily_stats",
  "skill_prerequisites",
  "skills",
  "social_identities",
  "strands",
  "telemetry_events",
  "user_tag_map",
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
    databaseUrl === undefined ? requireEnv("DATABASE_URL") : databaseUrl;
  assertDisposableDatabaseUrl(url);
  const sql = postgres(url, { max: 1 });
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sql`truncate table ${sql(tables)} restart identity cascade`;
        break;
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr?.code === "40P01" && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }
        throw err;
      }
    }
  } finally {
    await sql.end();
  }
}

/**
 * Dựng database test nếu chưa tồn tại, rồi chạy migration lên nó.
 *
 * `CREATE DATABASE` không chạy được trong transaction và không có dạng
 * `IF NOT EXISTS` trên mọi phiên bản, nên kiểm `pg_database` trước.
 */
async function ensureTestDatabase(url: string): Promise<void> {
  const name = databaseNameOf(url);
  if (!name.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `Từ chối dựng database test: '${name}' không có hậu tố '${TEST_DATABASE_SUFFIX}'. ` +
        "Đây là chốt chặn cuối để một lượt chạy test không TRUNCATE database dev."
    );
  }
  const admin = postgres(maintenanceDatabaseUrl(url), { max: 1 });
  try {
    const rows = await admin`
      select 1 from pg_database where datname = ${name}
    `;
    if (rows.length === 0) {
      await admin.unsafe(`create database "${name}"`);
      console.log(`[test-db] đã tạo database ${name}`);
    }
  } finally {
    await admin.end();
  }

  const sql = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(sql), {
      migrationsFolder: path.resolve(
        import.meta.dirname,
        "..",
        "src",
        "migrations"
      ),
    });
  } finally {
    await sql.end();
  }
}

/**
 * Cờ đánh dấu database test đã được dựng + dọn trong lượt chạy hiện tại.
 *
 * `globalSetup` được khai trong `defineWorkspaceTest`, nên nó gắn vào **mọi**
 * project vitest — `pnpm test` gọi hàm này 17 lần cho 17 project, và cả 17
 * cùng trỏ vào một database `mindkid_test`. Vitest chạy globalSetup của các
 * project trong cùng tiến trình chính nhưng không đợi hết mới bắt đầu test,
 * nên một `TRUNCATE` của project sau rơi vào giữa transaction của project
 * trước. Đo được 2026-08-31 trên `pnpm test`:
 *
 * ```
 * PostgresError: deadlock detected
 *   Process A waits for AccessShareLock on relation activities;
 *   Process B waits for AccessExclusiveLock on relation content_review_log.
 * ```
 *
 * Kèm theo là 4 phép thử khác đỏ vì hàng của chúng bị xoá giữa chừng
 * (`Key (user_id)=(3) is not present in table "users"`).
 *
 * Dọn **một lần cho cả lượt chạy** là đủ để giữ đúng hợp đồng "test bắt đầu từ
 * database sạch", và bỏ hẳn cửa sổ TRUNCATE-giữa-chừng. Cờ đi qua
 * `process.env` vì mọi globalSetup chia sẻ một tiến trình; nếu vitest đổi sang
 * chạy chúng ở tiến trình riêng thì cờ mất tác dụng và hành vi tụt về 17 lần
 * dọn — an toàn nhưng chậm, nên `global-setup.test.ts` chốt bằng ca âm.
 */
const PREPARED_FLAG = "MINDKID_TEST_DB_PREPARED";

/** Đúng một lần chuẩn bị cho mỗi `vitest run`, kể cả khi có nhiều project. */
export function claimDatabasePreparation(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env[PREPARED_FLAG] === "1") {
    return false;
  }
  env[PREPARED_FLAG] = "1";
  return true;
}

/**
 * Chạy một lần trước mỗi `vitest run` của **mọi** workspace.
 *
 * Trước 2026-08-30 hàm này chỉ dọn khi có `DB_TRUNCATE_ON_SETUP=1`, vì dọn mặc
 * định sẽ xoá database dev. Giờ test có database riêng
 * (`packages/config/vitest/test-database.ts`) nên dọn là mặc định, và cờ cũ
 * không còn ý nghĩa.
 */
export default async function setup(): Promise<void> {
  if (!claimDatabasePreparation()) {
    return;
  }
  // `test.env` của vitest chỉ áp cho worker chạy test, KHÔNG áp cho tiến trình
  // chạy `globalSetup`. Đọc `process.env.DATABASE_URL` ở đây sẽ lấy đúng
  // database dev từ `.env` — nên URL phải suy lại từ cùng một hàm mà
  // `defineWorkspaceTest` dùng.
  const url = testDatabaseUrls().owner;
  try {
    assertDisposableDatabaseUrl(url);
    await ensureTestDatabase(url);
    await truncateAllTestTables(url);
    // Đếm được từ log: dòng này phải xuất hiện ĐÚNG một lần cho mỗi `pnpm test`.
    console.log(
      `[test-db] đã dọn ${databaseNameOf(url)} — một lần cho cả lượt chạy`
    );
  } catch (err: unknown) {
    const errorObj = err as {
      code?: string;
      errors?: Array<{ code?: string }>;
    };
    if (
      errorObj?.code === "ECONNREFUSED" ||
      errorObj?.errors?.some((e) => e.code === "ECONNREFUSED")
    ) {
      console.warn(
        "⚠️ Postgres not running on port 5433 — skipping global DB cleanup."
      );
      return;
    }
    throw err;
  }
}
