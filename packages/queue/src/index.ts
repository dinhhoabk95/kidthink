import { type Job, Queue } from "bullmq";

export * from "./alert.js";

import { Redis } from "ioredis"; // ioredis is the default export, but we can also import Redis

export interface JobPayloads {
  "backup:postgres": Record<string, never>;
  "backup:verify": { source?: string };
  "email:send": {
    notificationId: number;
    to: string;
    code: string;
    payload: Record<string, unknown>;
    recipientStatus?: "active" | "deleted";
    userOptOut?: boolean;
    isBouncing?: boolean;
  };
}

export type JobName = keyof JobPayloads;

let queue: Queue | undefined;
let connection: Redis | undefined;

export const QUEUE_NAME = "kidthink-jobs";

function getQueue() {
  if (!queue) {
    connection = new Redis(process.env.VALKEY_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

export interface EnqueueOptions {
  jobId: string;
}

export function enqueue<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options: EnqueueOptions
): Promise<Job | undefined> {
  const q = getQueue();
  return q.add(name, payload, {
    jobId: options.jobId,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
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

export function getWaitingCount(): Promise<number> {
  const q = getQueue();
  return q.getWaitingCount();
}
