import { getQueue } from "./connection.js";
import { JOB_DEFINITIONS } from "./jobs/index.js";

/**
 * Lịch chạy nền, `job-queue.md` §2 ("Scheduler | Repeatable job của BullMQ").
 *
 * `enqueue` cố ý KHÔNG nhận `repeat` — hợp đồng §8 chỉ có `{ jobId, delay }`.
 * Bản cũ đẩy `repeat` qua `enqueue` bằng một ép kiểu `as unknown`; `enqueue`
 * chỉ chuyển tiếp `{jobId, attempts, backoff}` nên `repeat` bị vứt lặng lẽ và
 * hai job backup thành one-shot lúc boot. Lịch giờ đi đường riêng.
 */
export interface SyncJobSchedulersResult {
  upserted: string[];
  removed: string[];
}

export async function syncJobSchedulers(): Promise<SyncJobSchedulersResult> {
  const queue = getQueue();
  const scheduled = JOB_DEFINITIONS.filter(
    (job) => job.schedule.kind === "cron"
  );

  const upserted: string[] = [];
  for (const job of scheduled) {
    if (job.schedule.kind !== "cron") {
      continue;
    }
    const { retry } = job;
    await queue.upsertJobScheduler(
      job.name,
      { pattern: job.schedule.pattern, tz: job.schedule.tz },
      {
        name: job.name,
        data: {},
        opts: {
          attempts: retry.maxAttempts,
          backoff:
            retry.backoffType === "none"
              ? undefined
              : { type: retry.backoffType, delay: retry.backoffDelayMs },
        },
      }
    );
    upserted.push(job.name);
  }

  // Job đổi từ theo lịch sang theo sự kiện (hoặc bị xoá) mà không gỡ scheduler
  // thì nó chạy mãi trên Valkey, không còn nguồn nào trong code nhắc tới.
  const wanted = new Set(upserted);
  const existing = await queue.getJobSchedulers(0, -1, true);
  const removed: string[] = [];
  for (const scheduler of existing) {
    if (scheduler.key && !wanted.has(scheduler.key)) {
      await queue.removeJobScheduler(scheduler.key);
      removed.push(scheduler.key);
    }
  }

  return { upserted, removed };
}
