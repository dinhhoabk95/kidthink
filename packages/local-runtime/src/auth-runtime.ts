import { registerAuthCoordinatorPort } from "@mindkid/auth";
import {
  AuthCoordinatorEngine,
  registerCachePort,
  registerRateLimitPort,
} from "@mindkid/cache";
import { createLocalDoSqlStorage } from "@mindkid/db";
import { createTimerAlarmStorage } from "./timer-alarm.js";

export interface LocalAuthRuntime {
  /** Xoá handle SQLite, huỷ alarm và gỡ port đã nối. */
  close(): void;
  readonly engine: AuthCoordinatorEngine;
  /** Xoá toàn bộ keyspace auth + cache + bộ đếm rate limit. */
  reset(): void;
}

/**
 * Chạy `AuthCoordinatorEngine` — engine của `AuthCoordinatorDO` — trong tiến
 * trình trên SQLite, rồi nối nó vào ba port mà `packages/auth` và
 * `packages/cache` dùng (D15). `filePath` là file SQLite hoặc `":memory:"`.
 */
export function startLocalAuthRuntime(filePath: string): LocalAuthRuntime {
  const sql = createLocalDoSqlStorage(filePath);
  const alarms = createTimerAlarmStorage(() => engine.runAlarm());
  const engine = new AuthCoordinatorEngine(sql, alarms);

  registerAuthCoordinatorPort({
    kvGet: (key) => engine.kvGet(key),
    kvGetDel: (key) => engine.kvGetDel(key),
    kvSet: (key, value, ttlSeconds) => engine.kvSet(key, value, ttlSeconds),
    kvDel: (keys) => engine.kvDel(keys),
    kvIncr: (key) => engine.kvIncr(key),
    kvExpire: (key, seconds) => engine.kvExpire(key, seconds),
    kvDeleteByPrefix: (prefix) => engine.kvDeleteByPrefix(prefix),
  });
  registerCachePort({
    get: (key) => engine.kvGet(key),
    set: async (key, value, ttlSeconds) => {
      await engine.kvSet(key, value, ttlSeconds);
    },
    del: (...keys) => engine.kvDel(keys),
    deleteByPrefix: (prefix) => engine.kvDeleteByPrefix(prefix),
  });
  registerRateLimitPort({
    consumeRateLimit: (input) => engine.consumeRateLimit(input),
    clearRateLimits: () => engine.clearRateLimits(),
  });

  return {
    engine,
    reset: () => engine.clearAll(),
    close() {
      alarms.cancel();
      registerAuthCoordinatorPort(undefined);
      registerCachePort(undefined);
      registerRateLimitPort(undefined);
      sql.close();
    },
  };
}
