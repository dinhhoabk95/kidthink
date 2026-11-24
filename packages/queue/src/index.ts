import { getQueueDriverKind } from "@mindkid/config";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import type { Job } from "bullmq";
import {
  getCloudflareQueuePort,
  type JobQueueCoordinatorPort,
  type QueuedJobEnvelope,
} from "./do-queue-driver.js";
import { type JobName, type JobPayloads, requireJob } from "./jobs/index.js";
import { buildDeterministicJobId } from "./registry.js";

export * from "./alert.js";
export * from "./cron-match.js";
export * from "./do-queue-driver.js";
export * from "./jobs/define.js";
export * from "./jobs/index.js";
export * from "./registry.js";

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
function buildEnvelope<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): QueuedJobEnvelope {
  const def = requireJob(name);
  const parsed = def.parse(payload);
  const resolvedId =
    resolveJobId(name, parsed, options) ??
    `${name}:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    jobId: resolvedId,
    name,
    payloadJson: JSON.stringify(parsed),
    delayMs: options?.delay,
    maxAttempts: def.retry.maxAttempts,
    backoffType: def.retry.backoffType,
    backoffDelayMs: def.retry.backoffDelayMs,
    timeoutSeconds: def.timeoutSeconds,
    alertOnFailImmediately: def.retry.alertOnFailImmediately,
  };
}

/**
 * Đóng-khi-lỗi (BR-JOB-12): driver `cloudflare-do` mà chưa nối port thì KHÔNG rơi về BullMQ
 * (Workers không có Valkey, job sẽ mất im lặng) — trả 503 để caller biết.
 */
function resolveCloudflareQueuePort(): JobQueueCoordinatorPort | undefined {
  if (getQueueDriverKind() !== "cloudflare-do") {
    return undefined;
  }
  const port = getCloudflareQueuePort();
  if (!port) {
    throw new ServiceUnavailableError();
  }
  return port;
}

export async function enqueue<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): Promise<Job | { id: string; name: T }> {
  const cfPort = resolveCloudflareQueuePort();
  if (cfPort) {
    const envelope = buildEnvelope(name, payload, options);
    await cfPort.enqueueBatch([envelope]);
    return { id: envelope.jobId, name };
  }

  const parsed = requireJob(name).parse(payload);
  const { getQueue } = await import("./connection.js");
  return await getQueue().add(name, parsed, {
    jobId: resolveJobId(name, parsed, options),
    delay: options?.delay,
    ...resolveRetryOptions(name),
  });
}

export async function enqueueBatch(
  items: readonly {
    readonly name: JobName;
    readonly payload: JobPayloads[JobName];
    readonly options?: EnqueueOptions;
  }[]
): Promise<{ readonly accepted: number }> {
  if (items.length === 0) {
    return { accepted: 0 };
  }
  const cfPort = resolveCloudflareQueuePort();
  if (cfPort) {
    const envelopes = items.map((item) =>
      buildEnvelope(item.name, item.payload, item.options)
    );
    await cfPort.enqueueBatch(envelopes);
    return { accepted: envelopes.length };
  }

  for (const item of items) {
    await enqueue(item.name, item.payload, item.options);
  }
  return { accepted: items.length };
}

export async function getWaitingCount(): Promise<number> {
  const cfPort = resolveCloudflareQueuePort();
  if (cfPort) {
    const stats = await cfPort.getStats();
    return stats.waiting;
  }
  const { getQueue } = await import("./connection.js");
  return await getQueue().getWaitingCount();
}

export async function getFailedCount(): Promise<number> {
  const cfPort = resolveCloudflareQueuePort();
  if (cfPort) {
    const stats = await cfPort.getStats();
    return stats.failed;
  }
  const { getQueue } = await import("./connection.js");
  return await getQueue().getFailedCount();
}
