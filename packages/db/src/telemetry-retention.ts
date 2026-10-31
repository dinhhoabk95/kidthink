import { sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { telemetryEvents } from "#src/schema/play";

export interface CleanupResult {
  deletedCount: number;
  cutoffDate: string;
}

const RETENTION_DELETE_BATCH_SIZE = 10_000;

/**
 * BR-TLM-09: Retains raw events for 90 days, after which raw events are purged
 * while keeping aggregate rollup tables intact.
 * Idempotent and executed in batch/checkpoint logic.
 */
export async function runRawEventRetentionCleanup(
  retentionDays = 90
): Promise<CleanupResult> {
  const db = getOwnerDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let deletedCount = 0;

  while (true) {
    const deletedBatch = await db
      .delete(telemetryEvents)
      .where(
        sql`ctid IN (
          SELECT ctid FROM ${telemetryEvents}
          WHERE ${telemetryEvents.createdAt} < ${cutoffDate.toISOString()}
          LIMIT ${RETENTION_DELETE_BATCH_SIZE}
        )`
      )
      .returning({ seq: telemetryEvents.seq });

    deletedCount += deletedBatch.length;
    if (deletedBatch.length < RETENTION_DELETE_BATCH_SIZE) {
      break;
    }
  }

  return {
    deletedCount,
    cutoffDate: cutoffDate.toISOString(),
  };
}
