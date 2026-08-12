import { sweepAbandonedSessions } from "@kidthink/db";

export async function runSweepAbandoned(jobId: string) {
  const count = await sweepAbandonedSessions();
  console.log(
    `[SWEEP_ABANDONED] Swept ${count} abandoned play sessions for job ${jobId}`
  );
  return { sweptCount: count };
}
