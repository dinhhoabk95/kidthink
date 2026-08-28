import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getOwnerDb } from "@mindkid/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RETENTION_DAYS_POSTGRES,
  runPostgresBackup,
} from "./backup-postgres.js";

vi.mock("@mindkid/queue", () => ({ alert: vi.fn().mockResolvedValue({}) }));

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
// Hoisted so the spies are the same objects the mock hands to the code under
// test: reaching into `getOwnerDb().update` afterwards needs a cast, and a cast
// in a test is exactly what BR-TYP-08 counts.
const dbSpies = vi.hoisted(() => {
  const set = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(true),
  });
  return { set, update: vi.fn().mockReturnValue({ set }) };
});

vi.mock("@mindkid/db", () => ({
  getOwnerDb: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
    update: dbSpies.update,
  }),
  backupLog: {
    id: "id",
  },
}));

/** What the code last wrote into backup_log. */
function lastBackupLogUpdate(): Record<string, unknown> {
  return dbSpies.set.mock.calls.at(-1)?.[0] ?? {};
}

const DUMP_FILENAME = /^db-backup-.*\.sql\.gz\.enc$/;
const BUCKET_REFUSED = /bucket refused/;

describe("apps/worker/backup/postgres", () => {
  let directory = "";
  let uploadSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BACKUP_ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 chars
    // Never the real /var/lib path: a unit test must not write where the host
    // keeps production dumps.
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "mindkid-backup-"));
    uploadSpy = vi.fn().mockResolvedValue({ key: "postgres/x", bytes: 1 });
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
      runPostgresBackup("test-job", { directory, upload: uploadSpy })
    ).rejects.toThrow("BACKUP_ENCRYPTION_KEY must be a 32-character string");
  });

  it("Ca âm BR-BAK-04: pg_dump fail -> status = failed (via DB update) and error is thrown", async () => {
    // Bad URL will cause our mocked spawn to fail
    process.env.DATABASE_URL = "postgres://invalid:5432/bad";

    await expect(
      runPostgresBackup("test-job-fail", { directory, upload: uploadSpy })
    ).rejects.toThrow();

    expect(getOwnerDb().update).toHaveBeenCalled();
    expect(lastBackupLogUpdate().status).toBe("failed");
  });

  it("Ca âm BR-BAK-04: người phải biết khi sao lưu hỏng", async () => {
    process.env.DATABASE_URL = "postgres://invalid:5432/bad";

    await expect(
      runPostgresBackup("test-job-alert", { directory, upload: uploadSpy })
    ).rejects.toThrow();

    const { alert } = await import("@mindkid/queue");
    const alertMock = vi.mocked(alert);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]?.[0]).toBe("critical");
  });

  it("Ca âm BR-BAK-02: dump rời khỏi máy, và khoá thì không", async () => {
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/mindkid";

    await runPostgresBackup("test-job-success", {
      directory,
      upload: uploadSpy,
    });

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    const call = uploadSpy.mock.calls[0]?.[0];
    expect(call.filename).toMatch(DUMP_FILENAME);
    // The 32-character key never appears in anything handed to the bucket.
    expect(JSON.stringify(call)).not.toContain(
      "12345678901234567890123456789012"
    );
  });

  it("Ca âm BR-BAK-04: tải lên hỏng thì ghi failed, không ghi success", async () => {
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/mindkid";
    uploadSpy.mockRejectedValueOnce(new Error("bucket refused: HTTP 403"));

    await expect(
      runPostgresBackup("test-job-upload-fail", {
        directory,
        upload: uploadSpy,
      })
    ).rejects.toThrow(BUCKET_REFUSED);

    expect(lastBackupLogUpdate().status).toBe("failed");

    // The local file stays: if only the upload failed it is still a usable dump.
    const left = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".sql.gz.enc"));
    expect(left.length).toBe(1);
  });

  it("Ca âm BR-BAK-07: dump ghi ngoài cây release, không dưới process.cwd()", async () => {
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/mindkid";

    await runPostgresBackup("test-job-path", {
      directory,
      upload: uploadSpy,
    });

    // The default is an absolute path outside the deploy root; release
    // retention rm -rf's anything under it after five deploys.
    const { BACKUP_DIR } = await import("@mindkid/config/backup");
    expect(BACKUP_DIR.startsWith("/var/lib/")).toBe(true);
    expect(BACKUP_DIR.startsWith(process.cwd())).toBe(false);
    expect(BACKUP_DIR).not.toContain("/releases/");
  });

  it("BR-BAK-02: nội dung tệp không đọc được nếu không có khoá", async () => {
    process.env.DATABASE_URL =
      "postgres://postgres:postgres@localhost:5432/mindkid";

    await runPostgresBackup("test-job-cipher", {
      directory,
      upload: uploadSpy,
    });

    const files = fs
      .readdirSync(directory)
      .filter((f) => f.endsWith(".sql.gz.enc"));
    expect(files.length).toBeGreaterThan(0);

    const newest = files.at(-1);
    expect(newest).toBeDefined();
    const content = fs.readFileSync(path.join(directory, String(newest)));
    const zlib = await import("node:zlib");
    expect(() => {
      zlib.gunzipSync(content.subarray(16, content.length - 16));
    }).toThrow();
  });
});
