import { runPdfCleanupJob } from "@mindkid/db";

export async function runSweepPdfCleanupJob(
  _jobId: string,
  _payload?: Record<string, unknown>
): Promise<void> {
  await runPdfCleanupJob();
}
