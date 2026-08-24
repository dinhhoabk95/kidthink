import { requireEnv } from "@mindkid/config";
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

export default async function setup(): Promise<void> {
  if (process.env.DB_TRUNCATE_ON_SETUP !== "1") {
    return;
  }
  try {
    await truncateAllTestTables();
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
