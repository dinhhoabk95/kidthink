import type { RetryPolicy } from "./jobs/define.js";
import { findJob, JOB_DEFINITIONS } from "./jobs/index.js";

export type { RetryPolicy } from "./jobs/define.js";

/**
 * Hình chiếu phẳng của `JOB_DEFINITIONS` — không phải nguồn sự thật.
 * Nguồn nằm ở `packages/queue/src/jobs/`, một file một job.
 *
 * Giữ lại vì hợp đồng nghiệp vụ đọc registry theo dạng bảng (`job-queue.md`
 * §7.1) và các cổng đối chiếu spec dựa vào đúng sáu trường này.
 */
export interface JobRegistryEntry {
  name: string;
  /** Nguyên văn ô "Lịch" trong §7.1. Cron thật nằm ở `schedule.pattern`. */
  schedule: string;
  idempotencyKeyFormat: string;
  timeoutSeconds: number;
  ownerStep: string;
  retryPolicy: RetryPolicy;
}

export const JOB_REGISTRY: readonly JobRegistryEntry[] = JOB_DEFINITIONS.map(
  (job) => ({
    name: job.name,
    schedule: job.schedule.spec,
    idempotencyKeyFormat: job.idempotencyKeyFormat,
    timeoutSeconds: job.timeoutSeconds,
    ownerStep: job.ownerStep,
    retryPolicy: job.retry,
  })
);

export type RegisteredJobName = (typeof JOB_DEFINITIONS)[number]["name"];

export function getJobDefinition(name: string): JobRegistryEntry | undefined {
  return JOB_REGISTRY.find((job) => job.name === name);
}

/**
 * `BR-JOB-02` — jobId xác định từ khoá nghiệp vụ.
 */
export function buildDeterministicJobId(
  name: string,
  businessKey: string | number
): string {
  if (!findJob(name)) {
    throw new Error(`Job ${name} is not registered in JOB_REGISTRY`);
  }
  return `${name}:${businessKey}`;
}
