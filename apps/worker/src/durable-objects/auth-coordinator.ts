import type { AuthCoordinatorRpcPort } from "@mindkid/auth";
import type {
  RateLimitCheckResult,
  RateLimitCoordinatorPort,
} from "@mindkid/cache";

export type DoSqlCell = string | number | null;

export interface MinimalCoordinatorSql {
  exec(
    query: string,
    ...bindings: DoSqlCell[]
  ): {
    toArray(): Record<string, DoSqlCell>[];
  };
}

/**
 * Lõi lưu trữ nhất quán mạnh cho `AuthCoordinatorDO` trên Cloudflare Workers Free:
 * - Giữ toàn bộ khóa `ba:v1:user:*` và `ba:v1:manager:*` của Better Auth trong SQLite nội bộ của DO
 *   (thay thế Valkey `secondaryStorage` mà không đụng hạn mức 1.000 KV writes/ngày).
 * - Quản lý bộ đếm Token Bucket Rate Limit hai trục (IP + Account) trong RAM + SQLite.
 */
export class AuthCoordinatorEngine
  implements AuthCoordinatorRpcPort, RateLimitCoordinatorPort
{
  private readonly sql: MinimalCoordinatorSql;
  private initialized = false;

  constructor(sql: MinimalCoordinatorSql) {
    this.sql = sql;
  }

  private ensureSchema(): void {
    if (this.initialized) {
      return;
    }
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS auth_kv (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL,
        expires_at_ms INTEGER
      );
    `);
    this.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_auth_kv_exp ON auth_kv (expires_at_ms);"
    );
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        k TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        reset_at_ms INTEGER NOT NULL
      );
    `);
    this.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits (reset_at_ms);"
    );
    this.initialized = true;
  }

  private readLiveValue(key: string): string | null {
    this.ensureSchema();
    const row = this.sql
      .exec("SELECT v, expires_at_ms FROM auth_kv WHERE k = ?", key)
      .toArray()[0];
    if (!row) {
      return null;
    }
    const exp = row.expires_at_ms;
    if (typeof exp === "number" && exp <= Date.now()) {
      this.sql.exec("DELETE FROM auth_kv WHERE k = ?", key);
      return null;
    }
    return typeof row.v === "string" ? row.v : String(row.v ?? "");
  }

  kvGet(key: string): Promise<string | null> {
    return Promise.resolve(this.readLiveValue(key));
  }

  kvGetDel(key: string): Promise<string | null> {
    const val = this.readLiveValue(key);
    if (val !== null) {
      this.sql.exec("DELETE FROM auth_kv WHERE k = ?", key);
    }
    return Promise.resolve(val);
  }

  kvSet(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<string | null> {
    this.ensureSchema();
    const expiresAtMs =
      typeof ttlSeconds === "number" && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1000
        : null;
    this.sql.exec(
      `INSERT INTO auth_kv (k, v, expires_at_ms) VALUES (?, ?, ?)
       ON CONFLICT(k) DO UPDATE SET v = excluded.v, expires_at_ms = excluded.expires_at_ms`,
      key,
      value,
      expiresAtMs
    );
    return Promise.resolve("OK");
  }

  kvDel(keys: readonly string[]): Promise<number> {
    this.ensureSchema();
    if (keys.length === 0) {
      return Promise.resolve(0);
    }
    const placeholders = keys.map(() => "?").join(", ");
    const beforeCount = Number(
      this.sql
        .exec(
          `SELECT COUNT(*) AS cnt FROM auth_kv WHERE k IN (${placeholders})`,
          ...keys
        )
        .toArray()[0]?.cnt ?? 0
    );
    this.sql.exec(`DELETE FROM auth_kv WHERE k IN (${placeholders})`, ...keys);
    return Promise.resolve(beforeCount);
  }

  kvDeleteByPrefix(prefix: string): Promise<number> {
    this.ensureSchema();
    const likePattern = `${prefix
      .replaceAll("\\", "\\\\")
      .replaceAll("%", "\\%")
      .replaceAll("_", "\\_")}%`;
    const beforeCount = Number(
      this.sql
        .exec(
          "SELECT COUNT(*) AS cnt FROM auth_kv WHERE k LIKE ? ESCAPE '\\'",
          likePattern
        )
        .toArray()[0]?.cnt ?? 0
    );
    if (beforeCount > 0) {
      this.sql.exec(
        "DELETE FROM auth_kv WHERE k LIKE ? ESCAPE '\\'",
        likePattern
      );
    }
    return Promise.resolve(beforeCount);
  }

  kvIncr(key: string): Promise<number> {
    const existing = this.readLiveValue(key);
    const nextVal = (existing ? Number(existing) || 0 : 0) + 1;
    const expRow = this.sql
      .exec("SELECT expires_at_ms FROM auth_kv WHERE k = ?", key)
      .toArray()[0];
    const keepExp =
      typeof expRow?.expires_at_ms === "number" ? expRow.expires_at_ms : null;
    this.sql.exec(
      `INSERT INTO auth_kv (k, v, expires_at_ms) VALUES (?, ?, ?)
       ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
      key,
      String(nextVal),
      keepExp
    );
    return Promise.resolve(nextVal);
  }

  kvExpire(key: string, seconds: number): Promise<number> {
    const existing = this.readLiveValue(key);
    if (existing === null) {
      return Promise.resolve(0);
    }
    this.sql.exec(
      "UPDATE auth_kv SET expires_at_ms = ? WHERE k = ?",
      Date.now() + seconds * 1000,
      key
    );
    return Promise.resolve(1);
  }

  consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): Promise<RateLimitCheckResult> {
    this.ensureSchema();
    const nowMs = Date.now();
    const windowMs = input.windowSeconds * 1000;
    const row = this.sql
      .exec("SELECT count, reset_at_ms FROM rate_limits WHERE k = ?", input.key)
      .toArray()[0];

    const currentCount =
      typeof row?.count === "number" ? row.count : Number(row?.count ?? 0);
    const currentResetAtMs =
      typeof row?.reset_at_ms === "number"
        ? row.reset_at_ms
        : Number(row?.reset_at_ms ?? 0);

    if (!row || currentResetAtMs <= nowMs) {
      const resetAtMs = nowMs + windowMs;
      this.sql.exec(
        `INSERT INTO rate_limits (k, count, reset_at_ms) VALUES (?, ?, ?)
         ON CONFLICT(k) DO UPDATE SET count = excluded.count, reset_at_ms = excluded.reset_at_ms`,
        input.key,
        1,
        resetAtMs
      );
      return Promise.resolve({
        allowed: input.limit > 0,
        remaining: Math.max(0, input.limit - 1),
        resetSeconds: input.windowSeconds,
      });
    }

    if (currentCount >= input.limit) {
      return Promise.resolve({
        allowed: false,
        remaining: 0,
        resetSeconds: Math.max(1, Math.ceil((currentResetAtMs - nowMs) / 1000)),
      });
    }

    const updatedCount = currentCount + 1;
    this.sql.exec(
      "UPDATE rate_limits SET count = ? WHERE k = ?",
      updatedCount,
      input.key
    );
    return Promise.resolve({
      allowed: true,
      remaining: Math.max(0, input.limit - updatedCount),
      resetSeconds: Math.max(1, Math.ceil((currentResetAtMs - nowMs) / 1000)),
    });
  }

  pruneExpired(): number {
    this.ensureSchema();
    const nowMs = Date.now();
    const expiredKvCount = Number(
      this.sql
        .exec(
          "SELECT COUNT(*) AS cnt FROM auth_kv WHERE expires_at_ms IS NOT NULL AND expires_at_ms <= ?",
          nowMs
        )
        .toArray()[0]?.cnt ?? 0
    );
    if (expiredKvCount > 0) {
      this.sql.exec(
        "DELETE FROM auth_kv WHERE expires_at_ms IS NOT NULL AND expires_at_ms <= ?",
        nowMs
      );
    }
    const expiredRateCount = Number(
      this.sql
        .exec(
          "SELECT COUNT(*) AS cnt FROM rate_limits WHERE reset_at_ms <= ?",
          nowMs
        )
        .toArray()[0]?.cnt ?? 0
    );
    if (expiredRateCount > 0) {
      this.sql.exec("DELETE FROM rate_limits WHERE reset_at_ms <= ?", nowMs);
    }
    return expiredKvCount + expiredRateCount;
  }
}
