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

import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
// biome-ignore lint/performance/noNamespaceImport: dynamically iterates all schema tables
import * as schema from "#src/schema/index";

export function extractTableNamesFromSchema(schemaObj: object): string[] {
  const tableNames = new Set<string>();
  for (const value of Object.values(schemaObj)) {
    if (is(value, PgTable)) {
      tableNames.add(getTableName(value));
    }
  }
  return Array.from(tableNames).sort();
}

export const TABLES = extractTableNamesFromSchema(schema);

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
      } catch (err) {
        const pgErr =
          err instanceof Error ? (err as Error & { code?: string }) : null;
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

    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mindkid_app') THEN
          CREATE ROLE mindkid_app WITH LOGIN PASSWORD 'mindkid_app_password';
        END IF;
      END
      $$;
      GRANT CONNECT ON DATABASE "${name}" TO mindkid_app;
      GRANT USAGE ON SCHEMA public TO mindkid_app;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mindkid_app;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mindkid_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mindkid_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mindkid_app;
      REVOKE UPDATE, DELETE ON TABLE consent_logs FROM mindkid_app;
      REVOKE UPDATE, DELETE ON TABLE audit_logs FROM mindkid_app;

      CREATE OR REPLACE FUNCTION prevent_published_update()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.status = 'published' AND NEW.status != 'archived' THEN
          IF TG_TABLE_NAME = 'lessons' THEN
            IF NEW.status = 'published' AND
               NEW.title IS NOT DISTINCT FROM OLD.title AND
               NEW.code IS NOT DISTINCT FROM OLD.code AND
               NEW.guide IS NOT DISTINCT FROM OLD.guide AND
               NEW.access_tier IS NOT DISTINCT FROM OLD.access_tier THEN
              RETURN NEW;
            END IF;
          END IF;
          RAISE EXCEPTION 'BR-SCT-05: Cannot update published content';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.completion_status = 'completed' THEN
          RAISE EXCEPTION 'BR-SPT-07: Cannot update completed play session';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_prevent_published_game_levels ON game_levels;
      CREATE TRIGGER trg_prevent_published_game_levels
        BEFORE UPDATE ON game_levels
        FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

      DROP TRIGGER IF EXISTS trg_prevent_published_lessons ON lessons;
      CREATE TRIGGER trg_prevent_published_lessons
        BEFORE UPDATE ON lessons
        FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

      DROP TRIGGER IF EXISTS trg_prevent_published_activities ON activities;
      CREATE TRIGGER trg_prevent_published_activities
        BEFORE UPDATE ON activities
        FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

      DROP TRIGGER IF EXISTS trg_prevent_published_curricula ON curricula;
      CREATE TRIGGER trg_prevent_published_curricula
        BEFORE UPDATE ON curricula
        FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

      DROP TRIGGER IF EXISTS trg_prevent_published_worksheets ON worksheets;
      CREATE TRIGGER trg_prevent_published_worksheets
        BEFORE UPDATE ON worksheets
        FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

      DROP TRIGGER IF EXISTS trg_prevent_completed_play_sessions ON play_sessions;
      CREATE TRIGGER trg_prevent_completed_play_sessions
        BEFORE UPDATE ON play_sessions
        FOR EACH ROW EXECUTE FUNCTION prevent_completed_play_session_update();
    `);
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
