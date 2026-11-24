import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  createDurableObjectRedisClient,
  createRedisSecondaryStorage,
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "#src/index";

describe("Dual-Runtime Password Crypto & Durable Object Auth Store", () => {
  it("hash luôn là PBKDF2 ở cả hai runtime và verify chéo không cần rehash", async () => {
    const prev = process.env.MINDKID_RUNTIME;
    try {
      process.env.MINDKID_RUNTIME = "cloudflare";
      const cfHash = await hashPassword("MatKhauAnToan!2026");
      expect(cfHash.startsWith("pbkdf2$100000$")).toBe(true);
      expect(await verifyPassword("MatKhauAnToan!2026", cfHash)).toBe(true);
      expect(await verifyPassword("SaiMatKhau123!", cfHash)).toBe(false);
      expect(needsPasswordRehash(cfHash)).toBe(false);

      process.env.MINDKID_RUNTIME = "vps";
      expect(await verifyPassword("MatKhauAnToan!2026", cfHash)).toBe(true);
      expect(needsPasswordRehash(cfHash)).toBe(false);

      const vpsHash = await hashPassword("MatKhauAnToan!2026");
      expect(vpsHash.startsWith("pbkdf2$100000$")).toBe(true);
      expect(await verifyPassword("MatKhauAnToan!2026", vpsHash)).toBe(true);
      expect(needsPasswordRehash(vpsHash)).toBe(false);
    } finally {
      process.env.MINDKID_RUNTIME = prev;
    }
  });

  it("supports Better Auth secondaryStorage over SQLite Durable Object RPC port", async () => {
    const sqlite = new DatabaseSync(":memory:");
    sqlite.exec(
      "CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER);"
    );

    const doClient = createDurableObjectRedisClient({
      kvGet(key) {
        const row = sqlite
          .prepare("SELECT v, exp FROM kv WHERE k = ?")
          .get(key) as { v?: string; exp?: number | null } | undefined;
        if (!row) {
          return Promise.resolve(null);
        }
        if (typeof row.exp === "number" && row.exp <= Date.now()) {
          sqlite.prepare("DELETE FROM kv WHERE k = ?").run(key);
          return Promise.resolve(null);
        }
        return Promise.resolve(row.v ?? null);
      },
      kvGetDel(key) {
        const row = sqlite.prepare("SELECT v FROM kv WHERE k = ?").get(key) as
          | { v?: string }
          | undefined;
        sqlite.prepare("DELETE FROM kv WHERE k = ?").run(key);
        return Promise.resolve(row?.v ?? null);
      },
      kvSet(key, value, ttl) {
        const exp = ttl ? Date.now() + ttl * 1000 : null;
        sqlite
          .prepare(
            "INSERT INTO kv (k, v, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, exp = excluded.exp"
          )
          .run(key, value, exp);
        return Promise.resolve("OK");
      },
      kvDel(keys) {
        let deleted = 0;
        for (const k of keys) {
          const res = sqlite.prepare("DELETE FROM kv WHERE k = ?").run(k);
          deleted += Number(res.changes);
        }
        return Promise.resolve(deleted);
      },
      kvIncr(key) {
        const cur = sqlite.prepare("SELECT v FROM kv WHERE k = ?").get(key) as
          | { v?: string }
          | undefined;
        const next = (cur?.v ? Number(cur.v) : 0) + 1;
        sqlite
          .prepare(
            "INSERT INTO kv (k, v, exp) VALUES (?, ?, NULL) ON CONFLICT(k) DO UPDATE SET v = excluded.v"
          )
          .run(key, String(next));
        return Promise.resolve(next);
      },
      kvExpire(key, seconds) {
        const res = sqlite
          .prepare("UPDATE kv SET exp = ? WHERE k = ?")
          .run(Date.now() + seconds * 1000, key);
        return Promise.resolve(Number(res.changes));
      },
    });

    const userSecondary = createRedisSecondaryStorage(doClient, "user");
    const managerSecondary = createRedisSecondaryStorage(doClient, "manager");

    await userSecondary.set("sess-1", JSON.stringify({ uid: 42 }), 3600);
    expect(await userSecondary.get("sess-1")).toBe('{"uid":42}');
    // Tách biệt tuyệt đối namespace giữa user và manager
    expect(await managerSecondary.get("sess-1")).toBeNull();

    await userSecondary.delete("sess-1");
    expect(await userSecondary.get("sess-1")).toBeNull();
  });
});
