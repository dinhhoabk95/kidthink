/**
 * Which dumps stay on disk.
 * Contract: docs/specs/01-platform/backup-and-restore.md BR-BAK-05
 *
 * Three tiers thinning out rather than one window, because silent corruption
 * — a bug that writes wrong rows, a mistaken delete — usually surfaces weeks
 * after it started. Keeping only recent dumps means every dump you still have
 * is already poisoned by the time anyone notices.
 *
 * Pure over a list of names so the policy can be tested without a filesystem:
 * "which files survive" is the part that is easy to get wrong.
 */
import { BACKUP_RETENTION, backupTimestamp } from "@mindkid/config/backup";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Dated {
  name: string;
  at: Date;
}

function isoWeekKey(at: Date): string {
  // ISO week: Thursday of the same week decides the year, which is what makes
  // the last days of December fall into week 1 of the next year.
  const thursday = new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())
  );
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(at: Date): string {
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** Newest entry per bucket, at most `limit` buckets, newest buckets first. */
function newestPerBucket(
  dumps: Dated[],
  keyOf: (at: Date) => string,
  limit: number
): string[] {
  const seen = new Map<string, string>();
  for (const dump of dumps) {
    const key = keyOf(dump.at);
    if (!seen.has(key)) {
      seen.set(key, dump.name);
    }
  }
  return [...seen.values()].slice(0, limit);
}

/**
 * Returns the names to KEEP. Anything the caller holds that is not in this set
 * is expired — but a file whose name is not one of ours never enters the list
 * in the first place, so an operator's stray file is never deleted.
 */
export function selectRetained(filenames: string[]): Set<string> {
  const dumps: Dated[] = [];
  for (const name of filenames) {
    const at = backupTimestamp(name);
    if (at) {
      dumps.push({ name, at });
    }
  }
  dumps.sort((a, b) => b.at.getTime() - a.at.getTime());

  return new Set([
    ...dumps.slice(0, BACKUP_RETENTION.dailyCount).map((d) => d.name),
    ...newestPerBucket(dumps, isoWeekKey, BACKUP_RETENTION.weeklyCount),
    ...newestPerBucket(dumps, monthKey, BACKUP_RETENTION.monthlyCount),
  ]);
}

/** Names that are ours and are no longer covered by any tier. */
export function selectExpired(filenames: string[]): string[] {
  const keep = selectRetained(filenames);
  return filenames.filter(
    (name) => backupTimestamp(name) !== undefined && !keep.has(name)
  );
}

export const __testing = { isoWeekKey, monthKey, dayKey };
