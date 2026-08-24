import { lt } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { telemetryEvents } from "#src/schema/play";

export interface CleanupResult {
  deletedCount: number;
  cutoffDate: string;
}

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

  const deleted = await db
    .delete(telemetryEvents)
    .where(lt(telemetryEvents.createdAt, cutoffDate))
    .returning({
      sessionUuid: telemetryEvents.sessionUuid,
      seq: telemetryEvents.seq,
    });

  return {
    deletedCount: deleted.length,
    cutoffDate: cutoffDate.toISOString(),
  };
}
