import { describe, expect, it } from "vitest";
import {
  assertRecentVerifiedBackup,
  type BackupVerifyLogEntry,
  evaluateBackupVerifyGate,
} from "./verify-gate.js";

const NOW = new Date("2026-10-18T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const ERR_BAK_06 = /BR-BAK-06 VIOLATION/;

describe("BR-BAK-06 Backup Verification Gate (7-day window)", () => {
  it("passes when backup_log has a successful verify record with restoredRows > 0 within 7 days", () => {
    const entries: BackupVerifyLogEntry[] = [
      {
        backupType: "dump",
        status: "success",
        restoredRows: null,
        startedAt: new Date(NOW.getTime() - 1 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 1 * DAY_MS + 60_000),
      },
      {
        backupType: "verify",
        status: "success",
        restoredRows: 58,
        startedAt: new Date(NOW.getTime() - 3 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 3 * DAY_MS + 120_000),
      },
    ];

    const res = evaluateBackupVerifyGate(entries, NOW);
    expect(res.ok).toBe(true);
    expect(res.reason).toBe("OK");
    expect(res.restoredRows).toBe(58);
    expect(assertRecentVerifiedBackup(entries, NOW)).toEqual(
      new Date(NOW.getTime() - 3 * DAY_MS + 120_000)
    );
  });

  it("Ca âm BR-BAK-06: fails when backup_log has only dump records and no verify record", () => {
    const entries: BackupVerifyLogEntry[] = [
      {
        backupType: "dump",
        status: "success",
        restoredRows: null,
        startedAt: new Date(NOW.getTime() - 1 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 1 * DAY_MS + 30_000),
      },
    ];

    const res = evaluateBackupVerifyGate(entries, NOW);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("NO_VERIFY_RECORD");
    expect(() => assertRecentVerifiedBackup(entries, NOW)).toThrowError(
      ERR_BAK_06
    );
  });

  it("Ca âm BR-BAK-06: fails when latest verify record has status = failed", () => {
    const entries: BackupVerifyLogEntry[] = [
      {
        backupType: "verify",
        status: "failed",
        restoredRows: 0,
        startedAt: new Date(NOW.getTime() - 1 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 1 * DAY_MS + 30_000),
      },
    ];

    const res = evaluateBackupVerifyGate(entries, NOW);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("VERIFY_FAILED");
    expect(() => assertRecentVerifiedBackup(entries, NOW)).toThrowError(
      ERR_BAK_06
    );
  });

  it("Ca âm BR-BAK-06: fails when verify record succeeded with restoredRows = 0", () => {
    const entries: BackupVerifyLogEntry[] = [
      {
        backupType: "verify",
        status: "success",
        restoredRows: 0,
        startedAt: new Date(NOW.getTime() - 2 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 2 * DAY_MS + 30_000),
      },
    ];

    const res = evaluateBackupVerifyGate(entries, NOW);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("VERIFY_ZERO_ROWS");
    expect(() => assertRecentVerifiedBackup(entries, NOW)).toThrowError(
      ERR_BAK_06
    );
  });

  it("Ca âm BR-BAK-06: fails when latest successful verify is older than 7 days", () => {
    const entries: BackupVerifyLogEntry[] = [
      {
        backupType: "verify",
        status: "success",
        restoredRows: 58,
        startedAt: new Date(NOW.getTime() - 8 * DAY_MS),
        finishedAt: new Date(NOW.getTime() - 8 * DAY_MS + 60_000),
      },
    ];

    const res = evaluateBackupVerifyGate(entries, NOW);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("VERIFY_STALE_OVER_7_DAYS");
    expect(() => assertRecentVerifiedBackup(entries, NOW)).toThrowError(
      ERR_BAK_06
    );
  });
});
