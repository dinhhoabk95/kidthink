import { requireEnv } from "@mindkid/config";
import { alert, type JobName, QUEUE_NAME } from "@mindkid/queue";
import { type Job, Worker } from "bullmq";
import { runPostgresBackup } from "./backup/postgres.js";
import { runVerifyBackup } from "./backup/verify.js";
import { runSendEmail } from "./email/send.js";
import { runEntitlementExpireJob } from "./entitlement/expire.js";
import { runSoftUnlockExpireJob } from "./entitlement/soft-unlock-expire.js";
import { runOrphanImageCleanupJob } from "./image/cleanup-orphan.js";
import { runOrderExpireJob } from "./orders/expire.js";
import { runSweepPdfCleanupJob } from "./pdf/cleanup.js";
import { runPdfRenderJob } from "./pdf/render.js";
import { runManualGrantReportJob } from "./report/manual-grants-monthly.js";
import { runDailyRollupJob } from "./rollup/daily.js";
import { runSessionRollup } from "./rollup/session.js";
import { runSweepAbandoned } from "./sweep/abandoned.js";

let worker: Worker | undefined;

export async function processJob(job: Job) {
  try {
    const name = job.name as JobName;

    switch (name) {
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
      case "entitlement:soft-unlock-expire":
        await runSoftUnlockExpireJob(job.id as string);
        break;
      case "order:expire":
        await runOrderExpireJob(job.id as string);
        break;
      case "sweep:abandoned":
        await runSweepAbandoned(job.id as string);
        break;
      case "report:manual-grants-monthly":
        await runManualGrantReportJob(job.id as string, job.data);
        break;
      case "image:cleanup-orphan":
        await runOrphanImageCleanupJob(job.id as string, job.data);
        break;
      case "pdf:render":
        await runPdfRenderJob(job.id as string, job.data);
        break;
      case "sweep:pdf-cleanup":
        await runSweepPdfCleanupJob(job.id as string, job.data);
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

  const connectionOpts = {
    url: requireEnv("VALKEY_URL"),
    maxRetriesPerRequest: null as unknown,
  };

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
