import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { DB } from "@mindkid/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type LocalBackupLogEntry,
  listRecentLocalBackupLogs,
} from "#src/backup/backup-log-store";
import {
  RETENTION_DAYS_POSTGRES,
  runPostgresBackup,
} from "./backup-postgres.js";

vi.mock("@mindkid/queue", () => ({ alert: vi.fn().mockResolvedValue({}) }));

function lastBackupLogUpdate(dir: string): LocalBackupLogEntry | undefined {
  return listRecentLocalBackupLogs(dir, 5, { backupType: "dump" })[0];
}

function createSampleSqliteSnapshot(snapshotPath: string): Promise<void> {
  const rawDb = DB.getSqliteDriver().getRawDatabase();
  rawDb.prepare("VACUUM INTO ?").run(snapshotPath);
  return Promise.resolve();
}

function decryptBackupPayload(
  encryptedPath: string,
  encryptionKey: string
): Buffer {
  const raw = fs.readFileSync(encryptedPath);
  const iv = raw.subarray(0, 16);
  const authTag = raw.subarray(raw.length - 16);
  const ciphertext = raw.subarray(16, raw.length - 16);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "utf8"),
    iv
  );
  decipher.setAuthTag(authTag);
  const compressed = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return zlib.gunzipSync(compressed);
}

const DUMP_FILENAME = /^db-backup-.*\.sql\.gz\.enc$/;
const BUCKET_REFUSED = /bucket refused/;
const ENCRYPTION_KEY = "12345678901234567890123456789012";

describe("apps/worker/backup/sqlite", () => {
  let directory = "";
  let uploadSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BACKUP_ENCRYPTION_KEY = ENCRYPTION_KEY;
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-backup-"));
    uploadSpy = vi.fn().mockResolvedValue({ key: "sqlite/x", bytes: 1 });
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("RETENTION_DAYS_POSTGRES is 30", () => {
    expect(RETENTION_DAYS_POSTGRES).toBe(30);
  });

  it("fails if BACKUP_ENCRYPTION_KEY is not 32 chars", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = "short";
    await expect(
      runPostgresBackup("test-job", {
        directory,
        upload: uploadSpy,
        createSnapshot: createSampleSqliteSnapshot,
      })
    ).rejects.toThrow("BACKUP_ENCRYPTION_KEY must be a 32-character string");
  });

  it("Ca âm BR-BAK-04: snapshot fail -> status = failed and error is thrown", async () => {
    await expect(
      runPostgresBackup("test-job-fail", {
        directory,
        upload: uploadSpy,
        createSnapshot: () =>
          Promise.reject(new Error("SQLite snapshot error")),
      })
    ).rejects.toThrow("SQLite snapshot error");

    expect(lastBackupLogUpdate(directory)?.status).toBe("failed");
  });

  it("Ca âm BR-BAK-04: người phải biết khi sao lưu hỏng", async () => {
    await expect(
      runPostgresBackup("test-job-alert", {
        directory,
        upload: uploadSpy,
        createSnapshot: () =>
          Promise.reject(new Error("SQLite snapshot error")),
      })
    ).rejects.toThrow("SQLite snapshot error");

    const { alert } = await import("@mindkid/queue");
    const alertMock = vi.mocked(alert);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]?.[0]).toBe("critical");
  });

  it("Ca âm BR-BAK-02: dump rời khỏi máy, và khoá thì không", async () => {
    await runPostgresBackup("test-job-success", {
      directory,
      upload: uploadSpy,
      createSnapshot: createSampleSqliteSnapshot,
    });

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const call = uploadSpy.mock.calls[0]?.[0];
    expect(call.filename).toMatch(DUMP_FILENAME);
    expect(JSON.stringify(call)).not.toContain(ENCRYPTION_KEY);
  });

  it("Ca âm BR-BAK-04: tải lên hỏng thì ghi failed, không ghi success", async () => {
    uploadSpy.mockRejectedValueOnce(new Error("bucket refused: HTTP 403"));

    await expect(
      runPostgresBackup("test-job-upload-fail", {
        directory,
        upload: uploadSpy,
        createSnapshot: createSampleSqliteSnapshot,
      })
    ).rejects.toThrow(BUCKET_REFUSED);

    expect(lastBackupLogUpdate(directory)?.status).toBe("failed");

    const left = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".sql.gz.enc"));
    expect(left.length).toBe(1);
  });

  it("Ca âm BR-BAK-07: dump ghi ngoài cây release, không dưới process.cwd()", async () => {
    await runPostgresBackup("test-job-path", {
      directory,
      upload: uploadSpy,
      createSnapshot: createSampleSqliteSnapshot,
    });

    const { BACKUP_DIR } = await import("@mindkid/config/backup");
    expect(BACKUP_DIR.startsWith("/var/lib/")).toBe(true);
    expect(BACKUP_DIR.startsWith(process.cwd())).toBe(false);
    expect(BACKUP_DIR).not.toContain("/releases/");
  });

  it("BR-BAK-02: nội dung tệp không đọc được nếu không có khoá, giải mã ra SQLite hợp lệ", async () => {
    await runPostgresBackup("test-job-cipher", {
      directory,
      upload: uploadSpy,
      createSnapshot: createSampleSqliteSnapshot,
    });

    const files = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".sql.gz.enc"));
    expect(files.length).toBeGreaterThan(0);

    const newest = files.at(-1);
    expect(newest).toBeDefined();
    const fullPath = path.join(directory, String(newest));
    const content = fs.readFileSync(fullPath);

    expect(() => {
      zlib.gunzipSync(content.subarray(16, content.length - 16));
    }).toThrow();

    const plainSqlite = decryptBackupPayload(fullPath, ENCRYPTION_KEY);
    expect(plainSqlite.subarray(0, 16).toString("utf8")).toBe(
      "SQLite format 3\0"
    );
  });
});
