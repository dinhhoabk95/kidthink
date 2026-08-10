import { getOwnerDb } from "@kidthink/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RETENTION_DAYS_POSTGRES, runPostgresBackup } from "./postgres.js";

// Use vi.mock properly for child_process
vi.mock("child_process", () => {
  const EventEmitter = require("node:events");
  const { Readable } = require("node:stream");
  return {
    spawn: vi.fn((_command, args) => {
      const p: any = new EventEmitter();
      // If the arg is invalid url, fail it immediately
      if (args[0]?.includes("invalid")) {
        p.stdout = Readable.from([]);
        p.stderr = new EventEmitter();
        p.stderr.on = vi.fn();
        setTimeout(() => p.emit("close", 1), 10);
        return p;
      }

      // Success case
      p.stdout = Readable.from([Buffer.from("dummy dump data")]);
      p.stderr = new EventEmitter();
      p.stderr.on = vi.fn();

      setTimeout(() => p.emit("close", 0), 10);
      return p;
    }),
  };
});

// We need to mock drizzle db inserts/updates or test against real test db
// Since it's a unit test, we can use a mock or rely on the real DB (if running in check:services env)
// But let's mock the DB to be safe and fast unless we want an integration test.
// Actually, it's easier to mock child_process and let DB insert run? Or mock db?
// The instructions don't forbid mocking DB, but since we are using drizzle, let's mock it.
vi.mock("@kidthink/db", () => ({
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
  }),
  backupLog: {
    id: "id",
  },
}));

describe("apps/worker/backup/postgres", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BACKUP_ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 chars
  });

  it("RETENTION_DAYS_POSTGRES is 30", () => {
    expect(RETENTION_DAYS_POSTGRES).toBe(30);
  });

  it("fails if BACKUP_ENCRYPTION_KEY is not 32 chars", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = "short";
    await expect(runPostgresBackup("test-job")).rejects.toThrow(
      "BACKUP_ENCRYPTION_KEY must be a 32-character string"
    );
  });

  it("Ca âm BR-BAK-04: pg_dump fail -> status = failed (via DB update) and error is thrown", async () => {
    // Bad URL will cause our mocked spawn to fail
    process.env.DATABASE_URL = "postgres://invalid:5432/bad";

    await expect(runPostgresBackup("test-job-fail")).rejects.toThrow();

    // DB update should have been called with status: 'failed'
    expect(getOwnerDb().update).toHaveBeenCalled();
    const updateSetArg = (getOwnerDb().update as any)().set.mock.calls[0][0];
    expect(updateSetArg.status).toBe("failed");
  });

  it("Ca âm BR-BAK-02: mở file không có khoá thì không đọc được", async () => {
    // Restore valid DATABASE_URL for a successful run (our mocked spawn will succeed)
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/kidthink";

    await runPostgresBackup("test-job-success");

    // Check that we wrote a file to .backups
    const fs = require("node:fs");
    const path = require("node:path");
    const storageDir = path.join(process.cwd(), ".backups");
    const files = fs
      .readdirSync(storageDir)
      .filter((f: string) => f.endsWith(".sql.gz.enc"));
    expect(files.length).toBeGreaterThan(0);

    // Attempting to read it without key is literally just reading raw bytes,
    // which won't decompress with gzip natively because it's AES-GCM encrypted.
    const lastFile = path.join(storageDir, files.at(-1));
    const content = fs.readFileSync(lastFile);

    // The first 16 bytes are IV, then ciphertext, then 16 bytes auth tag
    // Reading it as gzip will throw error.
    const zlib = require("node:zlib");
    expect(() => {
      zlib.gunzipSync(content.slice(16, content.length - 16));
    }).toThrow();
  });
});
