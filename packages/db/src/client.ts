import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Hai kết nối, hai role khác nhau — không phải hai bản sao của một thứ.
 *
 * `owner` chạy migration/seed và các thao tác cần vượt quyền; `app` là role
 * `mindkid_app` đã bị REVOKE UPDATE/DELETE trên bảng INSERT-only (BR-DM-05).
 * Đường ghi của ứng dụng phải đi qua `getAppDb()` thì REVOKE mới có tác dụng —
 * chạy mọi thứ bằng owner làm cho ràng buộc đó thành trang trí.
 */

const DEFAULT_OWNER_URL = "postgres://postgres:postgres@localhost:5433/mindkid";
const DEFAULT_APP_URL =
  "postgres://mindkid_app:mindkid_app_password@localhost:5433/mindkid";

/** `max: 1` — mỗi tiến trình Node giữ đúng một connection, khớp t3.small. */
const POOL_OPTIONS = { max: 1 } as const;

function lazy<T>(create: () => T): () => T {
  let instance: T | undefined;
  return () => {
    instance ??= create();
    return instance;
  };
}

export const getOwnerSql = lazy(() =>
  postgres(process.env.DATABASE_URL ?? DEFAULT_OWNER_URL, POOL_OPTIONS)
);

export const getAppSql = lazy(() =>
  postgres(process.env.DATABASE_URL_APP ?? DEFAULT_APP_URL, POOL_OPTIONS)
);

export const getOwnerDb = lazy(() => drizzle(getOwnerSql()));

export const getAppDb = lazy(() => drizzle(getAppSql()));

export const getDb = getOwnerDb;
