import { runDailyRollup } from "@mindkid/db";

export async function runDailyRollupJob(
  jobId: string,
  data: { dateIct?: string }
): Promise<void> {
  const result = await runDailyRollup(data.dateIct);
  console.info(
    `[rollup:daily] Job ${jobId} completed for ${result.dateIct}: child=${result.childStatsCount}, level=${result.levelStatsCount}, skill=${result.skillStatsCount}`
  );
}
