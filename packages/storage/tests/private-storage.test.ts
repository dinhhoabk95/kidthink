import { PayloadTooLargeError, ServiceUnavailableError } from "@mindkid/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type BlobD1Database,
  createD1BlobSqlPort,
  D1_MAX_BLOB_BYTES,
  D1BlobObjectStorageDriver,
  deleteExpiredPrivateAssets,
  deletePrivateAsset,
  readPrivateAsset,
  resetDefaultObjectStorageDriver,
  STORED_BLOBS_DDL,
  setActiveObjectStorageDriver,
  uploadPrivateAsset,
} from "#src/index";

type BindValue = string | number | null | Uint8Array;

interface FakeRow {
  bucket: string;
  key: string;
  content_type: string;
  body: Uint8Array;
  expires_at: string | null;
}

function createFakeD1(): { db: BlobD1Database; rows: Map<string, FakeRow> } {
  const rows = new Map<string, FakeRow>();
  const db: BlobD1Database = {
    prepare(query: string) {
      let args: BindValue[] = [];
      const stmt = {
        bind(...values: BindValue[]) {
          args = values;
          return stmt;
        },
        raw() {
          const [bucket, key] = args;
          const row = rows.get(`${bucket}:${key}`);
          return Promise.resolve(
            row ? [[row.content_type, row.body, row.expires_at]] : []
          );
        },
        run() {
          if (query.startsWith("INSERT")) {
            const [bucket, key, contentType, , body, expires] = args;
            rows.set(`${bucket}:${key}`, {
              bucket: String(bucket),
              key: String(key),
              content_type: String(contentType),
              body: body instanceof Uint8Array ? body : new Uint8Array(),
              expires_at: typeof expires === "string" ? expires : null,
            });
            return Promise.resolve({ meta: { changes: 1 } });
          }
          if (query.includes("expires_at IS NOT NULL")) {
            let count = 0;
            for (const [k, row] of rows) {
              if (
                row.expires_at !== null &&
                row.expires_at <= String(args[0])
              ) {
                rows.delete(k);
                count += 1;
              }
            }
            return Promise.resolve({ meta: { changes: count } });
          }
          const removed = rows.delete(`${args[0]}:${args[1]}`);
          return Promise.resolve({ meta: { changes: removed ? 1 : 0 } });
        },
      };
      return stmt;
    },
  };
  return { db, rows };
}

const UNEXPECTED_CELL_RE = /unexpected blob cell type/;

describe("private asset storage via active driver (BR-IMG-11)", () => {
  beforeEach(() => {
    setActiveObjectStorageDriver(undefined);
    resetDefaultObjectStorageDriver();
  });
  afterEach(() => {
    setActiveObjectStorageDriver(undefined);
    resetDefaultObjectStorageDriver();
  });

  it("default in-memory driver round-trips upload/read/delete", async () => {
    await uploadPrivateAsset({
      key: "proofs/a.webp",
      body: new Uint8Array([1, 2, 3]),
      contentType: "image/webp",
    });
    const loaded = await readPrivateAsset("proofs/a.webp");
    expect(loaded?.contentType).toBe("image/webp");
    expect(Array.from(loaded?.body ?? [])).toEqual([1, 2, 3]);
    expect(await deletePrivateAsset("proofs/a.webp")).toBe(true);
    expect(await readPrivateAsset("proofs/a.webp")).toBeUndefined();
  });

  it("rejects unsafe paths", async () => {
    await expect(readPrivateAsset("../etc/passwd")).rejects.toThrow(
      "BR-IMG-05"
    );
  });

  it("upload, read and delete all go through the active driver", async () => {
    const calls: string[] = [];
    const table = new Map<string, { contentType: string; body: Uint8Array }>();
    setActiveObjectStorageDriver(
      new D1BlobObjectStorageDriver({
        upsertBlob(row) {
          calls.push("put");
          table.set(row.key, row);
          return Promise.resolve();
        },
        readBlob(_bucket, key) {
          calls.push("get");
          const row = table.get(key);
          return Promise.resolve(
            row ? { ...row, expiresAtIso: null } : undefined
          );
        },
        removeBlob(_bucket, key) {
          calls.push("del");
          return Promise.resolve(table.delete(key));
        },
        removeExpiredBlobs() {
          return Promise.resolve(0);
        },
      })
    );
    await uploadPrivateAsset({
      key: "x/y.pdf",
      body: new Uint8Array([9]),
      contentType: "application/pdf",
    });
    expect((await readPrivateAsset("x/y.pdf"))?.contentType).toBe(
      "application/pdf"
    );
    expect(await deletePrivateAsset("x/y.pdf")).toBe(true);
    expect(calls).toEqual(["put", "get", "del"]);
  });
});

describe("Cloudflare chưa có driver (BR-IMG-16)", () => {
  beforeEach(() => {
    setActiveObjectStorageDriver(undefined);
    resetDefaultObjectStorageDriver();
    vi.stubEnv("MINDKID_RUNTIME", "cloudflare");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("upload/read/delete ném ServiceUnavailableError, không rơi về in-memory", async () => {
    await expect(
      uploadPrivateAsset({
        key: "proofs/a.webp",
        body: new Uint8Array([1]),
        contentType: "image/webp",
      })
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
    await expect(readPrivateAsset("proofs/a.webp")).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
    await expect(deletePrivateAsset("proofs/a.webp")).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });

  it("có driver thì chạy bình thường", async () => {
    const { db } = createFakeD1();
    setActiveObjectStorageDriver(
      new D1BlobObjectStorageDriver(createD1BlobSqlPort(db))
    );
    await uploadPrivateAsset({
      key: "proofs/a.webp",
      body: new Uint8Array([1]),
      contentType: "image/webp",
    });
    expect(await readPrivateAsset("proofs/a.webp")).toBeDefined();
  });
});

describe("hạn lưu private asset (BR-IMG-15)", () => {
  beforeEach(() => {
    setActiveObjectStorageDriver(undefined);
    resetDefaultObjectStorageDriver();
  });

  it("uploadPrivateAsset chuyển expiresAt xuống driver; đọc quá hạn trả undefined", async () => {
    await uploadPrivateAsset({
      key: "exports/old.csv",
      body: new Uint8Array([1]),
      contentType: "text/csv",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await readPrivateAsset("exports/old.csv")).toBeUndefined();
  });

  it("deleteExpiredPrivateAssets (in-memory) chỉ xoá mục quá hạn", async () => {
    await uploadPrivateAsset({
      key: "exports/a.csv",
      body: new Uint8Array([1]),
      contentType: "text/csv",
      expiresAt: new Date(Date.now() + 1000),
    });
    await uploadPrivateAsset({
      key: "proofs/keep.webp",
      body: new Uint8Array([2]),
      contentType: "image/webp",
    });
    const later = new Date(Date.now() + 60_000);
    expect(await deleteExpiredPrivateAssets(later)).toBe(1);
    expect(await readPrivateAsset("proofs/keep.webp")).toBeDefined();
  });

  it("D1: deleteExpired xoá các dòng expires_at <= now, giữ dòng không hạn", async () => {
    const { db, rows } = createFakeD1();
    const driver = new D1BlobObjectStorageDriver(createD1BlobSqlPort(db));
    await driver.putObject({
      bucket: "private",
      key: "exports/x.csv",
      body: new Uint8Array([1]),
      contentType: "text/csv",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await driver.putObject({
      bucket: "private",
      key: "exports/y.csv",
      body: new Uint8Array([1]),
      contentType: "text/csv",
      expiresAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    await driver.putObject({
      bucket: "private",
      key: "proofs/z.webp",
      body: new Uint8Array([1]),
      contentType: "image/webp",
    });
    const removed = await driver.deleteExpired(
      new Date("2026-02-01T00:00:00.000Z")
    );
    expect(removed).toBe(1);
    expect([...rows.keys()].sort()).toEqual([
      "private:exports/y.csv",
      "private:proofs/z.webp",
    ]);
  });
});

describe("createD1BlobSqlPort", () => {
  it("round-trips through D1 prepared statements and expires", async () => {
    const { db, rows } = createFakeD1();
    const driver = new D1BlobObjectStorageDriver(createD1BlobSqlPort(db));
    await driver.putObject({
      bucket: "private",
      key: "proofs/b.webp",
      body: new Uint8Array([7, 8]),
      contentType: "image/webp",
    });
    expect(rows.size).toBe(1);
    expect(Array.from(rows.get("private:proofs/b.webp")?.body ?? [])).toEqual([
      7, 8,
    ]);
    const loaded = await driver.getObject("private", "proofs/b.webp");
    expect(Array.from(loaded?.body ?? [])).toEqual([7, 8]);

    await driver.putObject({
      bucket: "private",
      key: "old.pdf",
      body: new Uint8Array([1]),
      contentType: "application/pdf",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await driver.getObject("private", "old.pdf")).toBeUndefined();
    expect(rows.has("private:old.pdf")).toBe(false);

    expect(await driver.deleteObject("private", "proofs/b.webp")).toBe(true);
    expect(await driver.deleteObject("private", "proofs/b.webp")).toBe(false);
  });

  it("BR-IMG-14: round-trips all 256 byte values through BLOB", async () => {
    const { db } = createFakeD1();
    const driver = new D1BlobObjectStorageDriver(createD1BlobSqlPort(db));
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    await driver.putObject({
      bucket: "private",
      key: "bin.bin",
      body: all,
      contentType: "application/octet-stream",
    });
    const loaded = await driver.getObject("private", "bin.bin");
    expect(Array.from(loaded?.body ?? [])).toEqual(Array.from(all));
  });

  it("BR-IMG-14: reads BLOB returned as number[] (D1 raw shape)", async () => {
    const port = createD1BlobSqlPort({
      prepare() {
        const stmt = {
          bind() {
            return stmt;
          },
          raw() {
            return Promise.resolve([["image/webp", [1, 2, 3], null]]);
          },
          run() {
            return Promise.resolve({ meta: { changes: 0 } });
          },
        };
        return stmt;
      },
    });
    const row = await port.readBlob("private", "k");
    expect(Array.from(row?.body ?? [])).toEqual([1, 2, 3]);
  });

  it.each([
    ["string", "aGVsbG8="],
    ["null", null],
    ["number", 7],
    ["boolean", true],
  ])(
    "BR-IMG-14: cell body kiểu lạ (%s) ném lỗi rõ ràng, không trả byte rỗng",
    async (_label, cell) => {
      const port = createD1BlobSqlPort({
        prepare() {
          const stmt = {
            bind() {
              return stmt;
            },
            raw() {
              return Promise.resolve([["image/webp", cell, null]]);
            },
            run() {
              return Promise.resolve({ meta: { changes: 0 } });
            },
          };
          return stmt;
        },
      });
      await expect(port.readBlob("private", "k")).rejects.toThrow(
        UNEXPECTED_CELL_RE
      );
    }
  );

  it("BR-IMG-14: rejects bodies above D1_MAX_BLOB_BYTES with PayloadTooLargeError", async () => {
    const { db, rows } = createFakeD1();
    const driver = new D1BlobObjectStorageDriver(createD1BlobSqlPort(db));
    await expect(
      driver.putObject({
        bucket: "private",
        key: "big.pdf",
        body: new Uint8Array(D1_MAX_BLOB_BYTES + 1),
        contentType: "application/pdf",
      })
    ).rejects.toBeInstanceOf(PayloadTooLargeError);
    expect(rows.size).toBe(0);
    await driver.putObject({
      bucket: "private",
      key: "ok.pdf",
      body: new Uint8Array(D1_MAX_BLOB_BYTES),
      contentType: "application/pdf",
    });
    expect(rows.size).toBe(1);
  });

  it("exposes DDL for private_blobs", () => {
    expect(STORED_BLOBS_DDL).toContain(
      "CREATE TABLE IF NOT EXISTS private_blobs"
    );
    expect(STORED_BLOBS_DDL).toContain("PRIMARY KEY (bucket, key)");
    expect(STORED_BLOBS_DDL).toContain("body BLOB NOT NULL");
    expect(STORED_BLOBS_DDL).not.toContain("body_base64");
  });
});
