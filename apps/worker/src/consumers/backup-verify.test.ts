import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import zlib from "node:zlib";
import { alert } from "@mindkid/queue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalBackupLog,
  findLatestLocalBackupLogByTypeAndStatus,
  updateLocalBackupLog,
} from "#src/backup/backup-log-store";
import { runVerifyBackup } from "./backup-verify.js";

vi.mock("@mindkid/queue", () => {
  return {
    alert: vi.fn(),
    QUEUE_NAME: "test",
  };
});

const ENCRYPTION_KEY = "12345678901234567890123456789012";

function writeEncryptedPayload(targetFile: string, plainBuffer: Buffer): void {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const compressed = zlib.gzipSync(plainBuffer);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();
  fs.writeFileSync(targetFile, Buffer.concat([iv, ciphertext, authTag]));
}

function createSqliteBuffer(rowCount: number): Buffer {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-verify-src-"));
  const dbPath = path.join(tempDir, "source.sqlite");
  try {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);");
      const stmt = db.prepare("INSERT INTO users (name) VALUES (?)");
      for (let idx = 0; idx < rowCount; idx++) {
        stmt.run(`user_${idx}`);
      }
    } finally {
      db.close();
    }
    return fs.readFileSync(dbPath);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe("apps/worker/backup/verify (SQLite)", () => {
  let verifyDir = "";

  beforeEach(() => {
    verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-verify-"));
    vi.clearAllMocks();
    const dumpLog = createLocalBackupLog(verifyDir, {
      backupType: "dump",
      status: "started",
      startedAt: new Date(),
    });
    updateLocalBackupLog(verifyDir, dumpLog.id, {
      status: "success",
      storagePath: "dummy-backup.sql.gz.enc",
      finishedAt: new Date(),
    });
    process.env.BACKUP_ENCRYPTION_KEY = ENCRYPTION_KEY;
    writeEncryptedPayload(
      path.join(verifyDir, "dummy-backup.sql.gz.enc"),
      createSqliteBuffer(10)
    );
  });

  afterEach(() => {
    fs.rmSync(verifyDir, { recursive: true, force: true });
  });

  it("fails if no successful backup found", async () => {
    fs.rmSync(path.join(verifyDir, ".backup-log.json"), { force: true });

    await expect(
      runVerifyBackup("test-job-verify", { directory: verifyDir })
    ).rejects.toThrow("No successful backup found to verify");
  });

  it("Ca âm BR-BAK-04: file không phải SQLite hợp lệ -> status = failed và alert critical", async () => {
    writeEncryptedPayload(
      path.join(verifyDir, "dummy-backup.sql.gz.enc"),
      Buffer.from("not a valid sqlite database")
    );

    await expect(
      runVerifyBackup("test-job-verify-fail", { directory: verifyDir })
    ).rejects.toThrow("Verify failed: invalid SQLite header");

    const failedVerify = findLatestLocalBackupLogByTypeAndStatus(
      verifyDir,
      "verify",
      "failed"
    );
    expect(failedVerify).not.toBeNull();
    expect(failedVerify?.errorMessage).toContain("invalid SQLite header");

    expect(alert).toHaveBeenCalledWith(
      "critical",
      "Backup verify failed",
      expect.any(Object)
    );
  });

  it("restored_rows = 0 là fail, gọi alert mức cao", async () => {
    writeEncryptedPayload(
      path.join(verifyDir, "dummy-backup.sql.gz.enc"),
      createSqliteBuffer(0)
    );

    await expect(
      runVerifyBackup("test-job-verify-fail-0", { directory: verifyDir })
    ).rejects.toThrow("Verify failed: restored 0 rows");

    expect(alert).toHaveBeenCalledWith(
      "critical",
      "Backup verify failed",
      expect.any(Object)
    );
  });

  it("Restore bản mã hoá mới nhất → kiểm tra header & PRAGMA integrity_check → đếm rows → ghi log", async () => {
    await runVerifyBackup("test-job-verify-success", { directory: verifyDir });

    const successVerify = findLatestLocalBackupLogByTypeAndStatus(
      verifyDir,
      "verify",
      "success"
    );
    expect(successVerify).not.toBeNull();
    expect(successVerify?.restoredRows).toBe(10);
  });
});
