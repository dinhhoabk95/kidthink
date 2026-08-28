import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getOwnerDb } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import postgres from "postgres";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runVerifyBackup } from "./backup-verify.js";

const psqlRestoreFailedRegex = /psql restore failed/;

// Mock child_process and others
vi.mock("child_process", () => {
  const EventEmitter = require("node:events");
  const { PassThrough } = require("node:stream");
  return {
    spawn: vi.fn((_command, args) => {
      const p: any = new EventEmitter();
      p.stdin = new PassThrough();
      p.stdout = new EventEmitter();
      p.stderr = new EventEmitter();
      p.stderr.on = vi.fn();

      // Emit close based on command args to simulate success or failure
      setTimeout(() => {
        if (args[0]?.includes("invalid")) {
          p.emit("close", 1);
        } else {
          p.emit("close", 0);
        }
      }, 10);
      return p;
    }),
  };
});

vi.mock("postgres", () => {
  return {
    default: vi.fn(() => ({
      unsafe: vi.fn().mockResolvedValue([{ count: "10" }]),
      end: vi.fn().mockResolvedValue(true),
    })),
  };
});

// Remove crypto and zlib mocks, we will use real ones

vi.mock("@mindkid/queue", () => {
  return {
    alert: vi.fn(),
    QUEUE_NAME: "test",
  };
});

// We need to mock drizzle db inserts/updates
vi.mock("@mindkid/db", () => ({
  getOwnerDb: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                storagePath: "dummy-backup.sql.gz.enc",
              },
            ]),
          }),
        }),
      }),
    }),
  }),
  backupLog: {
    id: "id",
    backupType: "backupType",
    startedAt: "startedAt",
  },
}));

// Remove fs mock, we will write a real dummy file in beforeEach

describe("apps/worker/backup/verify", () => {
  // A temporary directory, never the real /var/lib path: a unit test must not
  // read or write where the host keeps production dumps.
  let verifyDir = "";

  afterEach(() => {
    fs.rmSync(verifyDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-verify-"));
    vi.clearAllMocks();
    process.env.BACKUP_ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 chars
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/mindkid";

    // Create dummy backup file to satisfy fs checks
    const storageDir = verifyDir;
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const dummyFile = path.join(storageDir, "dummy-backup.sql.gz.enc");

    // Write a properly encrypted dummy file
    const crypto = require("node:crypto");
    const zlib = require("node:zlib");
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY, "utf8");
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const plainText = zlib.gzipSync(Buffer.from("dummy sql data"));
    const ciphertext = Buffer.concat([
      cipher.update(plainText),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    fs.writeFileSync(dummyFile, Buffer.concat([iv, ciphertext, authTag]));
  });

  it("fails if no successful backup found", async () => {
    (getOwnerDb().select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    await expect(
      runVerifyBackup("test-job-verify", { directory: verifyDir })
    ).rejects.toThrow("No successful backup found to verify");
  });

  it("Ca âm BR-BAK-04: psql restore fail -> status = failed (via DB update)", async () => {
    process.env.DATABASE_URL = "postgres://invalid:5432/bad";

    await expect(
      runVerifyBackup("test-job-verify-fail", { directory: verifyDir })
    ).rejects.toThrow("psql restore failed");

    expect(getOwnerDb().update).toHaveBeenCalled();
    const updateSetArg = (getOwnerDb().update as any)().set.mock.calls[0][0];
    expect(updateSetArg.status).toBe("failed");
    expect(updateSetArg.errorMessage).toMatch(psqlRestoreFailedRegex);

    expect(alert).toHaveBeenCalledWith(
      "critical",
      "Backup verify failed",
      expect.any(Object)
    );
  });

  it("restored_rows = 0 là fail, gọi alert mức cao", async () => {
    // Modify the postgres mock to return 0 count for this test
    const pgMock = postgres as unknown as any;
    pgMock.mockImplementation(() => ({
      unsafe: vi.fn((query: string) => {
        if (query.includes("information_schema.tables")) {
          return Promise.resolve([{ count: "0" }]);
        }
        return Promise.resolve([]);
      }),
      end: vi.fn().mockResolvedValue(true),
    }));

    await expect(
      runVerifyBackup("test-job-verify-fail-0", { directory: verifyDir })
    ).rejects.toThrow("Verify failed: restored 0 rows");

    expect(alert).toHaveBeenCalledWith(
      "critical",
      "Backup verify failed",
      expect.any(Object)
    );
  });

  it("Restore bản mã hoá mới nhất → verify schema → select count → xoá → ghi log", async () => {
    // Reset the postgres mock to return 10 count for this test
    const pgMock = postgres as unknown as any;
    pgMock.mockImplementation(() => ({
      unsafe: vi.fn().mockResolvedValue([{ count: "10" }]),
      end: vi.fn().mockResolvedValue(true),
    }));

    await runVerifyBackup("test-job-verify-success", { directory: verifyDir });

    expect(getOwnerDb().update).toHaveBeenCalled();
    const updateSetArg = (getOwnerDb().update as any)().set.mock.calls[0][0];
    expect(updateSetArg.status).toBe("success");
    expect(updateSetArg.restoredRows).toBe(10);
  });
});
