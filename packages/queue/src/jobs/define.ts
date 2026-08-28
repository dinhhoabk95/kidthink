import type { z } from "zod";

/**
 * Một job = một file khai đúng một lần.
 *
 * Trước Task này, mỗi job được khai ở BA nơi: `JobPayloads` (kiểu payload),
 * `JOB_REGISTRY` (lịch + retry + timeout), và `switch` trong worker (consumer).
 * Ba danh sách lệch nhau — 15 / 12 / 13 tên — nên `account:purge` có handler mà
 * không có case, còn `entitlement:soft-unlock-expire` có case mà không có kiểu.
 * Gộp về một nguồn thì cả lớp lỗi đó biến mất chứ không phải được sửa từng cái.
 *
 * Hợp đồng: `docs/specs/01-platform/job-queue.md` §7.1 (danh sách + lịch +
 * idempotency key + timeout) và §7.2 (retry).
 */

export type BackoffType = "exponential" | "fixed" | "none";

export interface RetryPolicy {
  /** §7.2 — số lần thử tối đa, tính cả lần đầu. */
  maxAttempts: number;
  backoffType: BackoffType;
  backoffDelayMs: number;
  /**
   * `BR-JOB-05` — job phá huỷ dữ liệu phát alert ngay lần fail đầu thay vì đợi
   * cạn retry. Hiện chỉ `account:purge` bật cờ này (§7.2 "Purge dữ liệu").
   */
  alertOnFailImmediately?: boolean;
}

/**
 * Lịch chạy phải là dữ liệu máy đọc được. Trước Task này `schedule` là chuỗi
 * người đọc ("02:00 ICT") nên không cổng nào so được nó với cron thật — và
 * `cron.ts` đã trôi sang `0 2 * * *` cho một job spec ghi `01:00 ICT` mà
 * không ai phát hiện.
 *
 * `spec` giữ nguyên văn ô "Lịch" trong `job-queue.md` §7.1 để cổng đối chiếu.
 */
export type JobSchedule =
  | { kind: "event"; spec: string }
  | { kind: "cron"; pattern: string; tz: string; spec: string };

/** Hình dạng tác giả khai. `defineJob` bọc nó lại thành `JobDefinition`. */
export interface JobDefinitionInput<
  Name extends string = string,
  Schema extends z.ZodType = z.ZodType,
> {
  readonly name: Name;
  readonly schedule: JobSchedule;
  /** Ranh giới hệ thống → payload phải parse, không tin producer (AGENTS.md). */
  readonly payload: Schema;
  /**
   * `BR-JOB-02` — jobId xác định từ khoá nghiệp vụ. Bắt buộc với job sự kiện.
   * Job theo lịch không khai: BullMQ Job Scheduler tự sinh id duy nhất cho mỗi
   * lần chạy, và dùng chung một id cho mọi lần chạy sẽ khử luôn lần thứ hai.
   */
  readonly idempotencyKey?: (payload: z.infer<Schema>) => string | number;
  /** Nguyên văn ô "Idempotency key" trong §7.1, cho cổng đối chiếu. */
  readonly idempotencyKeyFormat: string;
  /** §7.1 ô "Timeout", tính bằng giây. Được ép lúc chạy trong worker. */
  readonly timeoutSeconds: number;
  readonly ownerStep: string;
  readonly retry: RetryPolicy;
}

/**
 * Định nghĩa job kèm hai cửa đã xoá generic. Chúng tồn tại để nơi tra cứu theo
 * tên (`enqueue`, scheduler, dispatcher của worker) gọi được trên kiểu hợp mà
 * không cần một ép kiểu nào — `idempotencyKey` nghịch biến theo payload nên
 * gọi thẳng nó trên kiểu hợp là không hợp lệ.
 */
export interface JobDefinition<
  Name extends string = string,
  Schema extends z.ZodType = z.ZodType,
> extends JobDefinitionInput<Name, Schema> {
  /** Parse payload, ném `ZodError` nếu sai hình dạng. */
  parse(input: unknown): unknown;
  /** Khoá idempotency đã parse; `undefined` với job theo lịch. */
  keyOf(input: unknown): string | number | undefined;
}

export function defineJob<const Name extends string, Schema extends z.ZodType>(
  definition: JobDefinitionInput<Name, Schema>
): JobDefinition<Name, Schema> {
  if (definition.schedule.kind === "event" && !definition.idempotencyKey) {
    throw new Error(
      `Job '${definition.name}' chạy theo sự kiện nên BẮT BUỘC khai idempotencyKey (BR-JOB-02).`
    );
  }
  if (definition.timeoutSeconds <= 0) {
    throw new Error(`Job '${definition.name}' phải có timeoutSeconds > 0.`);
  }
  if (definition.retry.maxAttempts <= 0) {
    throw new Error(`Job '${definition.name}' phải có maxAttempts > 0.`);
  }
  return {
    ...definition,
    parse: (input: unknown) => definition.payload.parse(input),
    keyOf: (input: unknown) =>
      definition.idempotencyKey?.(definition.payload.parse(input)),
  };
}

/** Mọi lịch trong `job-queue.md` §7.1 đều là giờ ICT, không phải giờ máy chủ. */
export const ICT = "Asia/Ho_Chi_Minh";

/** §7.2 "Rollup, sweep" — mặc định của phần lớn job. */
export const RETRY_STANDARD: RetryPolicy = {
  maxAttempts: 3,
  backoffType: "exponential",
  backoffDelayMs: 5000,
};

/** §7.2 "Backup" — thưa và lâu, vì chạy lại tốn hàng chục phút. */
export const RETRY_BACKUP: RetryPolicy = {
  maxAttempts: 2,
  backoffType: "fixed",
  backoffDelayMs: 300_000,
};
