import { requireEnv } from "@mindkid/config";
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
  postgres(requireEnv("DATABASE_URL"), POOL_OPTIONS)
);

export const getAppSql = lazy(() =>
  postgres(requireEnv("DATABASE_URL_APP"), POOL_OPTIONS)
);

export const getOwnerDb = lazy(() => drizzle(getOwnerSql()));

export const getAppDb = lazy(() => drizzle(getAppSql()));

export const getDb = getOwnerDb;

export type AppDb = ReturnType<typeof getAppDb>;
export type OwnerDb = ReturnType<typeof getOwnerDb>;
