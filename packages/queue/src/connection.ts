import { requireValkeyUrl } from "@mindkid/config";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const QUEUE_NAME = "mindkid-jobs";

let queue: Queue | undefined;
let connection: Redis | undefined;

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
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

export async function disconnectQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
  if (connection) {
    connection.disconnect();
    connection = undefined;
  }
}
