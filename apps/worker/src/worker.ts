import { alert, type JobName, QUEUE_NAME } from "@kidthink/queue";
import { type Job, Worker } from "bullmq";
import { runAccountPurgeJob } from "./account/purge.js";
import { runPostgresBackup } from "./backup/postgres.js";
import { runVerifyBackup } from "./backup/verify.js";
import { runSendEmail } from "./email/send.js";
import { runEntitlementExpireJob } from "./entitlement/expire.js";
import { runDailyRollupJob } from "./rollup/daily.js";
import { runSessionRollup } from "./rollup/session.js";
import { runSweepAbandoned } from "./sweep/abandoned.js";

let worker: Worker | undefined;

export async function processJob(job: Job) {
  try {
    const name = job.name as JobName;

    switch (name) {
      case "account:purge":
        await runAccountPurgeJob(job.id as string);
        break;
      case "backup:postgres":
        await runPostgresBackup(job.id as string);
        break;
      case "backup:verify":
        await runVerifyBackup(job.id as string);
        break;
      case "email:send":
        await runSendEmail(job.id as string, job.data);
        break;
      case "rollup:session":
        await runSessionRollup(job.id as string, job.data);
        break;
      case "rollup:daily":
        await runDailyRollupJob(job.id as string, job.data);
        break;
      case "entitlement:expire":
        await runEntitlementExpireJob(job.id as string, job.data);
        break;
      case "sweep:abandoned":
        await runSweepAbandoned(job.id as string);
        break;
      default:
        // Tên job không đăng ký → fail rõ ràng
        throw new Error(`Unknown job name: ${job.name}`);
    }
  } catch (error: unknown) {
    alert("error", "Job failed", {
      jobId: job.id,
      jobName: job.name,
      error: error.message || String(error),
    });
    throw error; // Re-throw so BullMQ marks it as failed
  }
}

export function startWorker() {
  if (worker) {
    return worker;
  }

  const connectionOpts = process.env.VALKEY_URL
    ? { url: process.env.VALKEY_URL, maxRetriesPerRequest: null as unknown }
    : { host: "localhost", port: 6379, maxRetriesPerRequest: null as unknown };

  worker = new Worker(QUEUE_NAME, processJob, { connection: connectionOpts });

  // Handle graceful shutdown
  process.on("SIGTERM", async () => {
    await closeWorker();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await closeWorker();
    process.exit(0);
  });

  return worker;
}

export async function closeWorker() {
  if (worker) {
    await worker.close();
    worker = undefined;
  }
}
