import { enqueue } from "@mindkid/queue";

export async function setupCronJobs() {
  await enqueue("backup:postgres", {}, {
    jobId: "cron-backup-postgres",
    repeat: { pattern: "0 2 * * *" },
  } as unknown);

  await enqueue("backup:verify", {}, {
    jobId: "cron-backup-verify",
    repeat: { pattern: "0 3 * * *" },
  } as unknown);

  console.log("Cron jobs configured");
}
