import type { JobName, JobPayloads } from "@mindkid/queue";

export interface JobContext {
  /** Id BullMQ gán cho lần chạy này — khác nhau giữa các lần chạy theo lịch. */
  jobId: string;
  /** Lần thử thứ mấy, tính từ 1. */
  attempt: number;
  /** Huỷ khi vượt `timeoutSeconds` của job (`job-queue.md` §5 "Job treo"). */
  signal: AbortSignal;
}

/**
 * Payload đã được `enqueue` và dispatcher parse bằng schema của job, nên
 * consumer nhận kiểu hẹp thay vì `job.data` kiểu `any`.
 */
export type Consumer<Name extends JobName> = (
  payload: JobPayloads[Name],
  ctx: JobContext
) => Promise<unknown>;
