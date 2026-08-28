/**
 * Where database dumps live, and how long they are kept.
 * Contract: docs/specs/01-platform/backup-and-restore.md §4, BR-BAK-05
 *
 * The directory is a constant here rather than a `process.cwd()` join in the
 * job, because the worker's working directory is `/opt/mindkid/current` — a
 * symlink that moves on every release, into a tree that release retention
 * deletes after five deploys. Dumps outlive both.
 */

export const BACKUP_DIR = "/var/lib/mindkid/backups";

/** BR-BAK-05 — three tiers thinning out, trading disk for depth in time. */
export const BACKUP_RETENTION = {
  dailyCount: 30,
  weeklyCount: 12,
  monthlyCount: 24,
} as const;

/** Encrypted, compressed SQL dump: `db-backup-<ISO timestamp>.sql.gz.enc`. */
export const BACKUP_FILENAME_PATTERN =
  /^db-backup-(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.sql\.gz\.enc$/;

export function backupFilename(at: Date): string {
  return `db-backup-${at.toISOString().replace(/[:.]/g, "-")}.sql.gz.enc`;
}

/**
 * Reads the instant back out of a filename. Returns undefined for anything that
 * is not one of our dumps, which is how the pruner avoids deleting a file some
 * operator left in the directory.
 */
const TRAILING_Z = /Z$/;

export function backupTimestamp(filename: string): Date | undefined {
  const match = BACKUP_FILENAME_PATTERN.exec(filename);
  if (!match?.[1]) {
    return undefined;
  }
  // Undo the ISO mangling: date part keeps its dashes, time part gets colons
  // back and the last dash before the milliseconds becomes the decimal point.
  const [date, time] = match[1].split("T");
  if (!(date && time)) {
    return undefined;
  }
  const parts = time.replace(TRAILING_Z, "").split("-");
  if (parts.length !== 4) {
    return undefined;
  }
  const parsed = new Date(
    `${date}T${parts[0]}:${parts[1]}:${parts[2]}.${parts[3]}Z`
  );
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
