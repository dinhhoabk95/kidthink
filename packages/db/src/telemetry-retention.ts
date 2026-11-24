import { sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { telemetryEvents } from "#src/schema/play";

export interface CleanupResult {
  deletedCount: number;
  cutoffDate: string;
}

const RETENTION_DELETE_BATCH_SIZE = 10_000;

export async function runRawEventRetentionCleanup(
  retentionDays = 90
): Promise<CleanupResult> {
  const db = getOwnerDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffMs = cutoffDate.getTime();

  let deletedCount = 0;

  while (true) {
    const res = await db.delete(telemetryEvents).where(
      sql`rowid IN (
        SELECT rowid FROM ${telemetryEvents}
        WHERE ${telemetryEvents.createdAt} < ${cutoffMs}
        LIMIT ${RETENTION_DELETE_BATCH_SIZE}
      )`
    );

    const batchCount = res.changes;
    deletedCount += batchCount;
    if (batchCount < RETENTION_DELETE_BATCH_SIZE) {
      break;
    }
  }

  return {
    deletedCount,
    cutoffDate: cutoffDate.toISOString(),
  };
}
