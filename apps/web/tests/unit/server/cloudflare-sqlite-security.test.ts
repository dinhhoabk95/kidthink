import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { SqliteLocalDriver } from "@mindkid/db";
import { canonicalizeRequestPath } from "@mindkid/shared";
import { createEvent, type H3Event } from "h3";
import { afterEach, describe, expect, it, vi } from "vitest";
import managersAuthCatchAll from "#server/api/auth/managers/[...all]";
import usersAuthCatchAll from "#server/api/auth/users/[...all]";
import {
  AuthCoordinatorEngine,
  type DoSqlCell,
  type MinimalCoordinatorSql,
} from "#server/durable-objects/auth-coordinator-do";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { getManagerAuth, getUserAuth } from "#server/utils/better-auth";

type RawSqliteHandle = ReturnType<SqliteLocalDriver["getRawDatabase"]>;

function buildHttpEvent(options: {
  readonly url: string;
  readonly remoteAddress?: string;
  readonly headers?: Record<string, string>;
}): H3Event {
  const socket = new Socket();
  if (options.remoteAddress !== undefined) {
    Object.defineProperty(socket, "remoteAddress", {
      value: options.remoteAddress,
    });
  }
  const req = new IncomingMessage(socket);
  req.method = "GET";
  req.url = options.url;
  req.headers = {
    host: "localhost:3000",
    ...(options.headers ?? {}),
  };
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

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

function restoreEnv(key: string, prev: string | undefined): void {
  if (prev === undefined) {
    Reflect.deleteProperty(process.env, key);
  } else {
    process.env[key] = prev;
  }
}

describe("Cloudflare, SQLite DO & Path Canonicalization Security (NEW-1, NEW-6, #24)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("NEW-1: Cloudflare IP verification & Better Auth catch-all header sanitization", () => {
    it("reads cf-connecting-ip when MINDKID_RUNTIME=cloudflare and restores env in finally", () => {
      const prevRuntime = process.env.MINDKID_RUNTIME;
      try {
        process.env.MINDKID_RUNTIME = "cloudflare";

        const cfEvent = buildHttpEvent({
          url: "/api/guest/health",
          remoteAddress: "198.51.100.2",
          headers: {
            "cf-connecting-ip": " 203.0.113.45 ",
            "x-forwarded-for": "198.51.100.99",
            "x-real-ip": "198.51.100.98",
          },
        });
        expect(getVerifiedRemoteIp(cfEvent)).toBe("203.0.113.45");

        const mappedCfEvent = buildHttpEvent({
          url: "/api/guest/health",
          headers: {
            "cf-connecting-ip": "::ffff:203.0.113.46",
          },
        });
        expect(getVerifiedRemoteIp(mappedCfEvent)).toBe("203.0.113.46");

        const missingCfHeaderEvent = buildHttpEvent({
          url: "/api/guest/health",
          remoteAddress: "198.51.100.2",
          headers: {
            "x-forwarded-for": "198.51.100.99",
            "x-real-ip": "198.51.100.98",
          },
        });
        expect(getVerifiedRemoteIp(missingCfHeaderEvent)).toBe("unknown");
      } finally {
        restoreEnv("MINDKID_RUNTIME", prevRuntime);
      }
    });

    it("strips x-forwarded-for and cf-connecting-ip and overwrites x-real-ip in users and managers auth catch-all handlers", async () => {
      const prevRuntime = process.env.MINDKID_RUNTIME;
      let capturedUserReq: Request | undefined;
      let capturedManagerReq: Request | undefined;

      vi.spyOn(getUserAuth(), "handler").mockImplementation((req) => {
        capturedUserReq = req;
        return Promise.resolve(new Response("ok", { status: 200 }));
      });
      vi.spyOn(getManagerAuth(), "handler").mockImplementation((req) => {
        capturedManagerReq = req;
        return Promise.resolve(new Response("ok", { status: 200 }));
      });

      try {
        process.env.MINDKID_RUNTIME = "vps";
        await usersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/users/get-session",
            remoteAddress: "198.51.100.22",
            headers: {
              "x-forwarded-for": "1.2.3.4, 10.0.0.1",
              "cf-connecting-ip": "5.6.7.8",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedUserReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedUserReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedUserReq?.headers.get("x-real-ip")).toBe("198.51.100.22");

        process.env.MINDKID_RUNTIME = "cloudflare";
        await managersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/managers/get-session",
            remoteAddress: "198.51.100.22",
            headers: {
              "x-forwarded-for": "1.2.3.4",
              "cf-connecting-ip": "203.0.113.88",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedManagerReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedManagerReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedManagerReq?.headers.get("x-real-ip")).toBe(
          "203.0.113.88"
        );

        await usersAuthCatchAll(
          buildHttpEvent({
            url: "/api/auth/users/get-session",
            headers: {
              "x-forwarded-for": "1.2.3.4",
              "x-real-ip": "9.9.9.9",
            },
          })
        );
        expect(capturedUserReq?.headers.get("x-forwarded-for")).toBeNull();
        expect(capturedUserReq?.headers.get("cf-connecting-ip")).toBeNull();
        expect(capturedUserReq?.headers.get("x-real-ip")).toBeNull();
      } finally {
        restoreEnv("MINDKID_RUNTIME", prevRuntime);
      }
    });
  });

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

  describe("#24: canonicalizeRequestPath percent-decoding & normalization", () => {
    it("decodes percent-encoded path segments while preserving %25 and %2F/%2f", () => {
      expect(canonicalizeRequestPath("/api/%75sers/children")).toBe(
        "/api/users/children"
      );
      expect(canonicalizeRequestPath("/api/users/%65xports")).toBe(
        "/api/users/exports"
      );
      expect(canonicalizeRequestPath("/api/users/%2565xports")).toBe(
        "/api/users/%2565xports"
      );
      expect(canonicalizeRequestPath("/api/users/a%2Fb")).toBe(
        "/api/users/a%2Fb"
      );
      expect(canonicalizeRequestPath("/api/users/a%2fb")).toBe(
        "/api/users/a%2fb"
      );
      expect(
        canonicalizeRequestPath("/api//%75sers/children/?foo=1#fragment")
      ).toBe("/api/users/children");
    });
  });
});
