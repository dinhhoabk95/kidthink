import type { Job } from "bullmq";
import { getQueue } from "./connection.js";
import { type JobName, type JobPayloads, requireJob } from "./jobs/index.js";
import { buildDeterministicJobId } from "./registry.js";

export * from "./alert.js";
export * from "./connection.js";
export * from "./jobs/define.js";
export * from "./jobs/index.js";
export * from "./registry.js";
export * from "./scheduler.js";

export interface EnqueueOptions {
  jobId?: string;
  delay?: number;
}

/**
 * `BR-JOB-02` — jobId xác định từ khoá nghiệp vụ, producer không tự bịa.
 *
 * Trả `undefined` cho job theo lịch không khai khoá: BullMQ Job Scheduler sinh
 * id riêng cho mỗi lần chạy. Dùng một id cố định ở đó là cách khử luôn mọi lần
 * chạy sau lần đầu — đúng lỗi mà `cron.ts` cũ mắc phải.
 */
function resolveJobId(
  name: JobName,
  payload: unknown,
  options?: EnqueueOptions
): string | undefined {
  if (options?.jobId) {
    return options.jobId;
  }

  const key = requireJob(name).keyOf(payload);
  return key === undefined ? undefined : buildDeterministicJobId(name, key);
}

function resolveRetryOptions(name: JobName) {
  const { retry } = requireJob(name);
  const backoff =
    retry.backoffType === "none"
      ? undefined
      : { type: retry.backoffType, delay: retry.backoffDelayMs };

  return { attempts: retry.maxAttempts, backoff };
}

/**
 * Hàng đợi là ranh giới hệ thống, nên payload được parse ở cả hai đầu: tại đây
 * lúc đẩy, và trong dispatcher của worker lúc nhận. Trước Task này không đầu
 * nào parse, nên bốn route đẩy `email:send` với hình dạng consumer không đọc
 * được suốt nhiều tháng mà không cổng nào đỏ.
 */
export function enqueue<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): Promise<Job> {
  const parsed = requireJob(name).parse(payload);

  return getQueue().add(name, parsed, {
    jobId: resolveJobId(name, parsed, options),
    delay: options?.delay,
    ...resolveRetryOptions(name),
  });
}

export const enqueueJob = enqueue;

export function getWaitingCount(): Promise<number> {
  return getQueue().getWaitingCount();
}

export function getFailedCount(): Promise<number> {
  return getQueue().getFailedCount();
}
