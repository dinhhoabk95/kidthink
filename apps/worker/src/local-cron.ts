import {
  type JobName,
  type QueuedJobEnvelope,
  scheduledEnvelopesAt,
} from "@mindkid/queue";
import { readErrorMessage } from "./errors.js";

/** Cùng nhịp tick 5 phút với cron trigger của Cloudflare (`BR-JOB-09`). */
export const LOCAL_CRON_TICK_MS = 5 * 60 * 1000;

/**
 * Một tick cron: đẩy mọi job đến hạn (theo lịch ICT của `JOB_DEFINITIONS`) vào
 * hàng đợi. Cùng `scheduledEnvelopesAt` mà `runUnifiedCronTick` dùng trên
 * Cloudflare, nên `jobId` xác định và khử trùng y hệt (`BR-JOB-02`, `BR-JOB-14`).
 */
export async function dispatchScheduledJobs(
  scheduledTimeMs: number,
  enqueueBatch: (
    jobs: readonly QueuedJobEnvelope[]
  ) => Promise<{ readonly accepted: number }>
): Promise<JobName[]> {
  const envelopes = scheduledEnvelopesAt(scheduledTimeMs);
  if (envelopes.length > 0) {
    await enqueueBatch(envelopes);
  }
  return envelopes.map((envelope) => envelope.name);
}

/** Hẹn tick ở mỗi mốc 5 phút tròn; trả hàm huỷ. Thay cho `triggers.crons` của Cloudflare. */
export function startLocalCron(
  enqueueBatch: (
    jobs: readonly QueuedJobEnvelope[]
  ) => Promise<{ readonly accepted: number }>
): () => void {
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  function arm(): void {
    const now = Date.now();
    const nextTick =
      (Math.floor(now / LOCAL_CRON_TICK_MS) + 1) * LOCAL_CRON_TICK_MS;
    timer = setTimeout(() => {
      dispatchScheduledJobs(nextTick, enqueueBatch)
        .catch((error) => {
          console.error(
            `[worker] Tick cron thất bại: ${readErrorMessage(error)}`
          );
        })
        .finally(() => {
          if (!stopped) {
            arm();
          }
        });
    }, nextTick - now);
    timer.unref();
  }

  arm();
  return () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
    }
  };
}
