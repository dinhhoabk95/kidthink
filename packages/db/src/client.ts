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

const DEFAULT_POOL_MAX = 5;
const resolvedPoolMax = Number(process.env.DB_POOL_MAX ?? DEFAULT_POOL_MAX);

const POOL_OPTIONS = {
  max:
    Number.isFinite(resolvedPoolMax) && resolvedPoolMax > 0
      ? resolvedPoolMax
      : DEFAULT_POOL_MAX,
  idle_timeout: 30,
  connect_timeout: 5,
  // Notice của postgres không được nuốt: `DO $$ ... EXCEPTION` trong migration
  // báo lỗi qua đúng đường này. Hạ mức ồn, không bịt miệng.
  onnotice: (notice: { severity?: string; message?: string }) => {
    if (notice.severity && notice.severity !== "NOTICE") {
      console.warn(`[pg:${notice.severity}] ${notice.message ?? ""}`);
    }
  },
} as const;

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

export const getDb = getAppDb;

export type AppDb = ReturnType<typeof getAppDb>;
export type OwnerDb = ReturnType<typeof getOwnerDb>;
