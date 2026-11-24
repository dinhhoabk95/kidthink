import { requireValkeyUrl } from "@mindkid/config";
import { alert, requireJob } from "@mindkid/queue";
import { disconnectQueue, QUEUE_NAME } from "@mindkid/queue/connection";
import { type Job, Worker } from "bullmq";
import { CONSUMERS } from "./consumers/index.js";
import { readErrorMessage } from "./errors.js";
import { runWithTimeout } from "./run-with-timeout.js";

/**
 * Worker chạy một tiến trình, nên song song là việc của hàng đợi, không phải
 * của process manager. Bản cũ không đặt gì cả nên BullMQ mặc định 1, và một
 * `backup:postgres` 30 phút chặn mọi `email:send` xếp sau nó.
 */
const WORKER_CONCURRENCY = 5;

/** Thời gian chờ tối đa cho worker tắt sạch. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

let worker: Worker | undefined;

// `async` để lỗi tra job và lỗi parse payload thành promise bị từ chối, không
// phải ném đồng bộ — BullMQ chờ một promise ở đây.
export async function processJob(job: Job): Promise<unknown> {
  const definition = requireJob(job.name);
  const name = definition.name;

  const jobId = job.id ?? `${name}:unknown`;
  const attempt = job.attemptsMade + 1;

  return await runWithTimeout(name, definition.timeoutSeconds, (signal) =>
    CONSUMERS[name](job.data, { jobId, attempt, signal })
  );
}

/**
 * `BR-JOB-05` — job fail hết retry Cấm bị bỏ im lặng.
 *
 * Bản cũ phát alert trong `catch` của `processJob`, tức mỗi lần retry một cái:
 * `email:send` fail đủ 5 lần là 5 alert cho cùng một sự việc, đánh nhau với
 * cửa sổ gộp 15 phút của `DeduplicatingAlertAdapter` và với `BR-MON-03`.
 */
export async function onJobFailed(
  job: Job | undefined,
  error: Error
): Promise<void> {
  if (!job) {
    await alert("error", "Job failed without a job reference", {
      error: readErrorMessage(error),
    });
    return;
  }

  const definition = requireJob(job.name);
  const maxAttempts = definition.retry.maxAttempts;
  const exhausted = job.attemptsMade >= maxAttempts;

  if (!(exhausted || definition.retry.alertOnFailImmediately)) {
    return;
  }

  await alert(
    definition.retry.alertOnFailImmediately ? "critical" : "error",
    `Job ${job.name} failed`,
    {
      jobId: job.id,
      jobName: job.name,
      attempt: job.attemptsMade,
      maxAttempts,
      error: readErrorMessage(error),
    }
  );
}

export function startWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = new Worker(QUEUE_NAME, processJob, {
    connection: { url: requireValkeyUrl() },
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on("failed", (job, error) => {
    onJobFailed(job, error).catch((alertError) => {
      // Nuốt lỗi ở đây là quay lại đúng chế độ hỏng mà BR-JOB-05 cấm.
      console.error(
        `[worker] Không phát được alert cho job thất bại: ${readErrorMessage(alertError)}`
      );
    });
  });

  return worker;
}

export async function closeWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = undefined;
  }
}

/**
 * Bản cũ chỉ đóng Worker rồi `process.exit(0)`: Queue và kết nối Redis phía
 * producer (do `syncJobSchedulers` mở) không bao giờ được đóng.
 */
export async function shutdown(signal: string): Promise<void> {
  console.info(`[worker] Nhận ${signal}, đang tắt.`);

  const forceExit = setTimeout(() => {
    console.error(
      `[worker] Không tắt xong trong ${SHUTDOWN_TIMEOUT_MS}ms, thoát cưỡng bức.`
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  await closeWorker();
  await disconnectQueue();
  clearTimeout(forceExit);
}
