import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import zlib from "node:zlib";
import { flushKvCachePrefixes } from "@mindkid/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAccountPurgeSweep } from "#src/consumers/account-purge";
import {
  flushPostRestoreAuthAndCache,
  restoreSqliteBackupFile,
} from "./restore.js";

vi.mock("@mindkid/cache", () => ({
  flushKvCachePrefixes: vi.fn(async () => 4),
}));

vi.mock("#src/consumers/account-purge", () => ({
  runAccountPurgeSweep: vi.fn(async () => ({
    purgedCount: 2,
    purgedChildren: 0,
    remaining: false,
  })),
}));

const ENCRYPTION_KEY = "12345678901234567890123456789012";

function createEncryptedSqliteBackup(
  encryptedPath: string,
  plainBytes: Buffer
): void {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );
  const compressed = zlib.gzipSync(plainBytes);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();
  fs.writeFileSync(encryptedPath, Buffer.concat([iv, ciphertext, authTag]));
}

function createValidSqliteBytes(marker: string): Buffer {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-restore-src-"));
  const dbPath = path.join(dir, "src.sqlite");
  try {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec(
        "CREATE TABLE restore_check (id INTEGER PRIMARY KEY, note TEXT);"
      );
      db.prepare("INSERT INTO restore_check (note) VALUES (?)").run(marker);
    } finally {
      db.close();
    }
    return fs.readFileSync(dbPath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("apps/worker/backup/restore (SQLite)", () => {
  let workDir = "";

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-restore-test-"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it("flushPostRestoreAuthAndCache targets auth & entitlement prefixes without FLUSHALL", async () => {
    const count = await flushPostRestoreAuthAndCache();
    expect(count).toBe(4);
    expect(flushKvCachePrefixes).toHaveBeenCalledWith([
      "ba:v1:user:",
      "ba:v1:manager:",
      "user:entitlements:",
    ]);
  });

  it("restores encrypted SQLite backup, verifies integrity, flushes caches, and reapplies account purges", async () => {
    const encryptedFilePath = path.join(workDir, "backup.sql.gz.enc");
    const targetSqlitePath = path.join(workDir, "target.sqlite");
    createEncryptedSqliteBackup(
      encryptedFilePath,
      createValidSqliteBytes("restored-ok")
    );

    const result = await restoreSqliteBackupFile({
      encryptedFilePath,
      targetSqlitePath,
      encryptionKey: ENCRYPTION_KEY,
    });

    expect(result.flushedKeys).toBe(4);
    expect(result.purgedAccounts).toBe(2);
    expect(flushKvCachePrefixes).toHaveBeenCalledTimes(1);
    expect(runAccountPurgeSweep).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(`${targetSqlitePath}.sqlite.restore.tmp`)).toBe(false);

    const restoredDb = new DatabaseSync(targetSqlitePath, { readOnly: true });
    try {
      const row = restoredDb
        .prepare("SELECT note FROM restore_check WHERE id = 1")
        .get() as { readonly note?: string } | undefined;
      expect(row?.note).toBe("restored-ok");
    } finally {
      restoredDb.close();
    }
  });

  it("aborts if target SQLite DB holds an active write lock", async () => {
    const encryptedFilePath = path.join(workDir, "backup.sql.gz.enc");
    const targetSqlitePath = path.join(workDir, "locked.sqlite");
    fs.writeFileSync(targetSqlitePath, createValidSqliteBytes("before-lock"));
    createEncryptedSqliteBackup(
      encryptedFilePath,
      createValidSqliteBytes("after-lock")
    );

    const locker = new DatabaseSync(targetSqlitePath);
    locker.exec("BEGIN IMMEDIATE;");
    try {
      await expect(
        restoreSqliteBackupFile({
          encryptedFilePath,
          targetSqlitePath,
          encryptionKey: ENCRYPTION_KEY,
        })
      ).rejects.toThrow("active write lock");
    } finally {
      locker.exec("ROLLBACK;");
      locker.close();
    }

    const checkDb = new DatabaseSync(targetSqlitePath, { readOnly: true });
    try {
      const row = checkDb
        .prepare("SELECT note FROM restore_check WHERE id = 1")
        .get() as { readonly note?: string } | undefined;
      expect(row?.note).toBe("before-lock");
    } finally {
      checkDb.close();
    }
  });
});
