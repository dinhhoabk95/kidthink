/**
 * Xoá toàn bộ nội dung trong database rồi để `pnpm db:seed` dựng lại từ corpus.
 *
 * Vì sao cần: `game_levels` của máy dev tích tụ 1.506 dòng trong khi corpus
 * seed chỉ có 166 — phần dư là fixture do bộ integration test ghi vào khi test
 * còn dùng chung database với dev. Seed là **idempotent theo `code` +
 * `content_version`**, nên nó không dọn được những dòng mang mã không thuộc
 * corpus, và cũng không cập nhật dòng cũ khi nội dung đổi mà version giữ
 * nguyên. Muốn database khớp corpus thì phải xoá trước.
 *
 * Từ 2026-08-30 test đã có database riêng (`mindkid_test`), nên đây là thao tác
 * một lần để dọn phần đã lỡ tích tụ.
 *
 * Chỉ chạy được trên host loopback (`BR-TST-05`), và bắt buộc `--yes`.
 */
import { requireEnv } from "@mindkid/config";
import postgres from "postgres";

/**
 * Bảng nội dung và bảng liên kết của chúng.
 *
 * `CASCADE` sẽ kéo theo `play_sessions`, `child_session_summaries`,
 * `lesson_activities`, `lesson_runs`, `lesson_run_steps`, `game_level_rounds`,
 * `level_params` — đó là dữ liệu phái sinh từ nội dung, không phải tài khoản.
 * `users`, `child_profiles`, `managers`, `packages`, `skills`, `emoji_registry`,
 * `game_templates`, `content_tags`, `curricula` KHÔNG nằm trong danh sách.
 */
const CONTENT_TABLES = [
  "game_levels",
  "activities",
  "lessons",
  "content_seed_batches",
  "content_skill_map",
  "content_tag_map",
  "content_review_log",
  "lesson_activities",
  "level_daily_stats",
  "curriculum_items",
  "play_sessions",
  "child_session_summaries",
  "game_level_rounds",
  "level_params",
  "lesson_runs",
  "lesson_run_steps",
] as const;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function assertLoopback(databaseUrl: string): void {
  const { hostname } = new URL(databaseUrl);
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      `Từ chối xoá nội dung: host '${hostname}' không phải loopback. ` +
        "Lệnh này chỉ dành cho database trên chính máy đang chạy."
    );
  }
}

async function main(): Promise<void> {
  if (!process.argv.includes("--yes")) {
    console.error(
      "Lệnh này XOÁ toàn bộ nội dung (level, activity, lesson, phiên chơi).\n" +
        "Chạy lại với --yes nếu đó đúng là điều bạn muốn."
    );
    process.exit(1);
  }

  const url = requireEnv("DATABASE_URL");
  assertLoopback(url);
  const sql = postgres(url, { max: 1 });
  try {
    const before = await sql`select count(*)::int as n from game_levels`;
    await sql`truncate table ${sql(CONTENT_TABLES)} restart identity cascade`;
    const after = await sql`select count(*)::int as n from game_levels`;
    console.log(
      `[db:reset-content] game_levels: ${before[0]?.n ?? "?"} → ${after[0]?.n ?? "?"}`
    );
    console.log("[db:reset-content] Chạy `pnpm db:seed` để dựng lại nội dung.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ [db:reset-content]", err);
  process.exit(1);
});
