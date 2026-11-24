import { SqliteLocalDriver } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import {
  AuthCoordinatorEngine,
  type DoSqlCell,
  type MinimalCoordinatorSql,
} from "#src/durable-objects/auth-coordinator";

type RawSqliteHandle = ReturnType<SqliteLocalDriver["getRawDatabase"]>;

function createCoordinatorSql(rawDb: RawSqliteHandle): MinimalCoordinatorSql {
  return {
    exec(query: string, ...bindings: DoSqlCell[]) {
      const stmt = rawDb.prepare(query);
      const rows = stmt.all(...bindings);
      const normalized: Record<string, DoSqlCell>[] = rows.map((row) => {
        const record: Record<string, DoSqlCell> = {};
        for (const [key, value] of Object.entries(row)) {
          if (
            value === null ||
            typeof value === "string" ||
            typeof value === "number"
          ) {
            record[key] = value;
          } else if (typeof value === "bigint") {
            record[key] = Number(value);
          } else {
            record[key] = String(value);
          }
        }
        return record;
      });
      return {
        toArray: () => normalized,
      };
    },
  };
}

describe("NEW-6: AuthCoordinatorEngine SQLite persistence & safe prefix deletion", () => {
  it("persists rate_limits counts in SQLite across new AuthCoordinatorEngine instances", async () => {
    const driver = new SqliteLocalDriver({ dataDir: ":memory:" });
    try {
      const rawDb = driver.getRawDatabase();
      const sql = createCoordinatorSql(rawDb);
      const key = "rl:ip:auth:login:203.0.113.10";

      const engine1 = new AuthCoordinatorEngine(sql);
      const first = await engine1.consumeRateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      });
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(2);

      const second = await engine1.consumeRateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      });
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(1);

      const storedRows = sql
        .exec("SELECT count FROM rate_limits WHERE k = ?", key)
        .toArray();
      expect(storedRows).toHaveLength(1);
      expect(storedRows[0]?.count).toBe(2);

      const engine2 = new AuthCoordinatorEngine(sql);
      const third = await engine2.consumeRateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      });
      expect(third.allowed).toBe(true);
      expect(third.remaining).toBe(0);

      const fourth = await engine2.consumeRateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      });
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
    } finally {
      await driver.disconnect();
    }
  });

  it("escapes SQL LIKE wildcards _ and % in kvDeleteByPrefix", async () => {
    const driver = new SqliteLocalDriver({ dataDir: ":memory:" });
    try {
      const sql = createCoordinatorSql(driver.getRawDatabase());
      const engine = new AuthCoordinatorEngine(sql);

      await engine.kvSet("ba:v1:user:sess_1", "v1", 300);
      await engine.kvSet("ba:v1:user:sess_2", "v2", 300);
      await engine.kvSet("ba:v1:user:sessX1", "vX", 300);
      await engine.kvSet("ba:v1:user:sess%1", "vPct", 300);
      await engine.kvSet("ba:v1:user:rate%limit:a", "rA", 300);
      await engine.kvSet("ba:v1:user:rateXYZ:b", "rB", 300);

      const deletedUnderscore =
        await engine.kvDeleteByPrefix("ba:v1:user:sess_");
      expect(deletedUnderscore).toBe(2);
      expect(await engine.kvGet("ba:v1:user:sess_1")).toBeNull();
      expect(await engine.kvGet("ba:v1:user:sess_2")).toBeNull();
      expect(await engine.kvGet("ba:v1:user:sessX1")).toBe("vX");
      expect(await engine.kvGet("ba:v1:user:sess%1")).toBe("vPct");

      const deletedPercent = await engine.kvDeleteByPrefix(
        "ba:v1:user:rate%limit:"
      );
      expect(deletedPercent).toBe(1);
      expect(await engine.kvGet("ba:v1:user:rate%limit:a")).toBeNull();
      expect(await engine.kvGet("ba:v1:user:rateXYZ:b")).toBe("rB");
    } finally {
      await driver.disconnect();
    }
  });
});
