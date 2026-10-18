/**
 * Backup verification gate — BR-BAK-06.
 * Contract: docs/specs/01-platform/backup-and-restore.md §6 BR-BAK-06
 *
 * A backup that has not been restored and verified is not a backup.
 * For production readiness, `backup_log` must contain at least one `verify`
 * record with `status = "success"`, `restoredRows > 0`, and timestamp within
 * the last 7 days relative to `now`.
 */
import { backupLog, getOwnerDb } from "@mindkid/db";
import { desc, eq } from "drizzle-orm";

export const BACKUP_VERIFY_MAX_AGE_DAYS = 7;
export const BACKUP_VERIFY_MAX_AGE_MS =
  BACKUP_VERIFY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export interface BackupVerifyLogEntry {
  readonly backupType: string;
  readonly status: string;
  readonly restoredRows: number | null;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
}

export type BackupVerifyFailureReason =
  | "OK"
  | "NO_VERIFY_RECORD"
  | "VERIFY_FAILED"
  | "VERIFY_ZERO_ROWS"
  | "VERIFY_STALE_OVER_7_DAYS";

export interface BackupVerifyGateResult {
  readonly ok: boolean;
  readonly latestVerifiedAt: Date | null;
  readonly restoredRows: number;
  readonly reason: BackupVerifyFailureReason;
}

function resolveVerifyTimestamp(entry: BackupVerifyLogEntry): Date {
  return entry.finishedAt ?? entry.startedAt;
}

/**
 * Pure evaluation of `backup_log` entries against BR-BAK-06 (7-day window).
 */
export function evaluateBackupVerifyGate(
  entries: readonly BackupVerifyLogEntry[],
  now: Date
): BackupVerifyGateResult {
  const verifyEntries = entries
    .filter((e) => e.backupType === "verify")
    .sort(
      (a, b) =>
        resolveVerifyTimestamp(b).getTime() -
        resolveVerifyTimestamp(a).getTime()
    );

  if (verifyEntries.length === 0) {
    return {
      ok: false,
      latestVerifiedAt: null,
      restoredRows: 0,
      reason: "NO_VERIFY_RECORD",
    };
  }

  const cutoffMs = now.getTime() - BACKUP_VERIFY_MAX_AGE_MS;
  const successfulEntries = verifyEntries.filter((e) => e.status === "success");

  const firstSuccessful = successfulEntries[0];
  if (!firstSuccessful) {
    return {
      ok: false,
      latestVerifiedAt: null,
      restoredRows: 0,
      reason: "VERIFY_FAILED",
    };
  }

  const nonZeroRowEntries = successfulEntries.filter(
    (e) => (e.restoredRows ?? 0) > 0
  );

  const latestValid = nonZeroRowEntries[0];
  if (!latestValid) {
    return {
      ok: false,
      latestVerifiedAt: resolveVerifyTimestamp(firstSuccessful),
      restoredRows: 0,
      reason: "VERIFY_ZERO_ROWS",
    };
  }

  const verifiedAt = resolveVerifyTimestamp(latestValid);
  const ageMs = now.getTime() - verifiedAt.getTime();

  if (verifiedAt.getTime() < cutoffMs || ageMs < 0) {
    return {
      ok: false,
      latestVerifiedAt: verifiedAt,
      restoredRows: latestValid.restoredRows ?? 0,
      reason: "VERIFY_STALE_OVER_7_DAYS",
    };
  }

  return {
    ok: true,
    latestVerifiedAt: verifiedAt,
    restoredRows: latestValid.restoredRows ?? 0,
    reason: "OK",
  };
}

/**
 * Throws if `backup_log` does not have a verified backup within the last 7 days (BR-BAK-06).
 */
export function assertRecentVerifiedBackup(
  entries: readonly BackupVerifyLogEntry[],
  now: Date
): Date {
  const res = evaluateBackupVerifyGate(entries, now);
  if (!(res.ok && res.latestVerifiedAt)) {
    throw new Error(
      `BR-BAK-06 VIOLATION: Backup verification gate failed (${res.reason}). Must have a successful verify record within 7 days.`
    );
  }
  return res.latestVerifiedAt;
}

/**
 * Queries `backup_log` in Postgres and evaluates the BR-BAK-06 7-day verify gate.
 */
export async function checkDatabaseBackupVerifyGate(
  now: Date
): Promise<BackupVerifyGateResult> {
  const db = getOwnerDb();
  const rows = await db
    .select()
    .from(backupLog)
    .where(eq(backupLog.backupType, "verify"))
    .orderBy(desc(backupLog.startedAt))
    .limit(20);

  return evaluateBackupVerifyGate(rows, now);
}
