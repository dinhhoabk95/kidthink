import type {
  RateLimitCheckResult,
  RateLimitCoordinatorPort,
} from "./token-bucket.js";

export type DoSqlCell = string | number | null;

export interface MinimalCoordinatorSql {
  exec(
    query: string,
    ...bindings: DoSqlCell[]
  ): {
    toArray(): Record<string, DoSqlCell>[];
  };
}

/** Phần của `DurableObjectStorage` mà engine dùng để hẹn dọn rác (alarm). */
export interface CoordinatorAlarmStorage {
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTimeMs: number): Promise<void>;
}

/** Không đánh thức DO dày hơn mức này: dọn hạn chỉ để giữ gọn, đọc đã tự xoá khoá hết hạn. */
export const PRUNE_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Lõi lưu trữ nhất quán mạnh cho `AuthCoordinatorDO` trên Cloudflare Workers Free, và cho
 * port dev/test chạy trong tiến trình trên SQLite (`@mindkid/local-runtime`, D15) — cùng một engine:
 * - Giữ toàn bộ khóa `ba:v1:user:*` và `ba:v1:manager:*` của Better Auth trong SQLite nội bộ của DO
 *   (thay thế Valkey `secondaryStorage` mà không đụng hạn mức 1.000 KV writes/ngày).
 * - Quản lý bộ đếm Token Bucket Rate Limit hai trục (IP + Account) trong RAM + SQLite.
 */
export class AuthCoordinatorEngine implements RateLimitCoordinatorPort {
  private readonly sql: MinimalCoordinatorSql;
  private readonly alarms: CoordinatorAlarmStorage | null;
  private initialized = false;

  constructor(sql: MinimalCoordinatorSql, alarms?: CoordinatorAlarmStorage) {
    this.sql = sql;
    this.alarms = alarms ?? null;
  }

  /** Hẹn alarm dọn hạn nếu chưa có alarm nào; không đặt lại alarm đang chờ. */
  private async ensureAlarm(expiresAtMs: number): Promise<void> {
    if (!this.alarms) {
      return;
    }
    const existing = await this.alarms.getAlarm();
    if (existing !== null) {
      return;
    }
    await this.alarms.setAlarm(
      Math.max(expiresAtMs, Date.now() + PRUNE_MIN_INTERVAL_MS)
    );
  }

  /**
   * Handler của `alarm()`: dọn khoá hết hạn rồi hẹn lại nếu còn dòng có hạn, để `pruneExpired`
   * thực sự chạy định kỳ thay vì chỉ tồn tại trên giấy.
   */
  async runAlarm(): Promise<number> {
    const pruned = this.pruneExpired();
    if (!this.alarms) {
      return pruned;
    }
    const next = this.sql
      .exec(
        `SELECT MIN(t) AS next FROM (
           SELECT MIN(expires_at_ms) AS t FROM auth_kv WHERE expires_at_ms IS NOT NULL
           UNION ALL
           SELECT MIN(reset_at_ms) AS t FROM rate_limits
         )`
      )
      .toArray()[0]?.next;
    if (typeof next === "number") {
      await this.alarms.setAlarm(
        Math.max(next, Date.now() + PRUNE_MIN_INTERVAL_MS)
      );
    }
    return pruned;
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

  async kvSet(
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
    if (expiresAtMs !== null) {
      await this.ensureAlarm(expiresAtMs);
    }
    return "OK";
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

  async kvExpire(key: string, seconds: number): Promise<number> {
    const existing = this.readLiveValue(key);
    if (existing === null) {
      return 0;
    }
    const expiresAtMs = Date.now() + seconds * 1000;
    this.sql.exec(
      "UPDATE auth_kv SET expires_at_ms = ? WHERE k = ?",
      expiresAtMs,
      key
    );
    await this.ensureAlarm(expiresAtMs);
    return 1;
  }

  async consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): Promise<RateLimitCheckResult> {
    const result = this.consumeRateLimitSync(input);
    await this.ensureAlarm(Date.now() + input.windowSeconds * 1000);
    return result;
  }

  private consumeRateLimitSync(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): RateLimitCheckResult {
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
      return {
        allowed: input.limit > 0,
        remaining: Math.max(0, input.limit - 1),
        resetSeconds: input.windowSeconds,
      };
    }

    if (currentCount >= input.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.max(1, Math.ceil((currentResetAtMs - nowMs) / 1000)),
      };
    }

    const updatedCount = currentCount + 1;
    this.sql.exec(
      "UPDATE rate_limits SET count = ? WHERE k = ?",
      updatedCount,
      input.key
    );
    return {
      allowed: true,
      remaining: Math.max(0, input.limit - updatedCount),
      resetSeconds: Math.max(1, Math.ceil((currentResetAtMs - nowMs) / 1000)),
    };
  }

  /** Xoá mọi bộ đếm rate limit (reset giữa các test, `clearRateLimitBuckets`). */
  clearRateLimits(): void {
    this.ensureSchema();
    this.sql.exec("DELETE FROM rate_limits");
  }

  /** Xoá toàn bộ keyspace và bộ đếm (reset runtime dev/test). */
  clearAll(): void {
    this.ensureSchema();
    this.sql.exec("DELETE FROM auth_kv");
    this.sql.exec("DELETE FROM rate_limits");
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
