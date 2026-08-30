import { requireValkeyUrl } from "@mindkid/config";
import { type DefaultJobOptions, Queue } from "bullmq";
import { Redis } from "ioredis";

/**
 * Tên hàng đợi. `VALKEY_QUEUE_PREFIX` cho phép một lượt chạy test dùng hàng đợi
 * RIÊNG.
 *
 * Vì sao cần: `mindkid-jobs` dùng chung với **mọi** thứ nối cùng Valkey — kể cả
 * một `pnpm dev` đang chạy trên máy người viết code. Một phép thử tích hợp từng
 * gọi `obliterate({ force: true })` trên đúng hàng đợi đó, tức xoá sạch việc
 * đang bay của worker thật; và một worker thật thì nhặt mất job mà phép thử vừa
 * đẩy, làm phép thử đỏ vì môi trường chứ không vì hành vi.
 */
export const QUEUE_NAME = process.env.VALKEY_QUEUE_PREFIX
  ? `mindkid-jobs-${process.env.VALKEY_QUEUE_PREFIX}`
  : "mindkid-jobs";

/**
 * BullMQ giữ lại **mọi** job hoàn tất và thất bại nếu không khai gì. Hai hậu quả:
 * Valkey phình vô hạn (riêng cron đã là 10 job/ngày, vĩnh viễn), và
 * `getFailedCount()` trở thành tổng trọn đời chứ không phải số trong cửa sổ —
 * `apps/worker/src/monitor.ts` đọc nó như một bộ đếm có cửa sổ.
 *
 * Job thất bại giữ lâu hơn job thành công vì nó là thứ người ta quay lại đọc.
 */
export const QUEUE_DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};

interface ErrorEmitter {
  on(event: "error", listener: (error: unknown) => void): unknown;
}

let queue: Queue | undefined;
let connection: Redis | undefined;

/**
 * `Queue` và `Redis` đều là EventEmitter, và một EventEmitter **không có**
 * listener `"error"` thì `emit("error")` ném `ERR_UNHANDLED_ERROR` — giết cả
 * tiến trình.
 *
 * Điều đó không chỉ chạm `apps/worker`. `getQueue()` chạy cả trong `apps/web`
 * qua `dispatchTransactionalEmail`, và `apps/web` Cấm — NEVER có handler
 * `uncaughtException` như worker, lại chạy `instances: "max"`. Trước hàm này,
 * một lần Valkey khởi động lại là mất toàn bộ web tier cùng lúc.
 *
 * `enableOfflineQueue: false` bên dưới làm chuyện đó dễ xảy ra hơn, không phải
 * khó hơn: nó biến lệnh đang đệm thành lỗi phát ngay.
 */
export function attachErrorLogger(
  emitter: ErrorEmitter,
  label: string,
  log: (line: string) => void = console.error
): void {
  emitter.on("error", (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`[queue] ${label}: ${message}`);
  });
}

/**
 * `packages/queue` giữ vai producer (`job-queue.md` §2). Consumer sống ở
 * `apps/worker/src/consumers/` — `BR-JOB-04` cấm consumer trong package này.
 *
 * Tách khỏi `index.ts` để `scheduler.ts` dùng chung một Queue mà không tạo
 * vòng import (cổng `no-circular` của dependency-cruiser).
 */
export function getQueue(): Queue {
  if (!queue) {
    connection = new Redis(requireValkeyUrl(), {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    attachErrorLogger(connection, "Redis");

    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS,
    });
    attachErrorLogger(queue, "BullMQ Queue");
  }
  return queue;
}

export async function disconnectQueue(): Promise<void> {
  // `finally`: nếu `close()` ném thì socket vẫn phải được thả, và cả hai tham
  // chiếu module-level phải rỗng — nếu không, `getQueue()` lần sau trả về một
  // Queue đã hỏng còn Redis client thì rò.
  try {
    if (queue) {
      await queue.close();
    }
  } finally {
    queue = undefined;
    if (connection) {
      connection.disconnect();
      connection = undefined;
    }
  }
}
