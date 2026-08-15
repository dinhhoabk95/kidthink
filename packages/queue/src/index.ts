import { type Job, Queue } from "bullmq";
import { Redis } from "ioredis";
import { buildDeterministicJobId, getJobDefinition } from "./registry.js";

export * from "./alert.js";
export * from "./registry.js";

export interface JobPayloads {
  "backup:postgres": { dateIct?: string };
  "backup:verify": { source?: string; week?: string };
  "email:send": {
    notificationId: number;
    to: string;
    code: string;
    payload: Record<string, unknown>;
    recipientStatus?: "active" | "deleted";
    userOptOut?: boolean;
    isBouncing?: boolean;
  };
  "rollup:session": {
    sessionUuid: string;
  };
  "rollup:daily": {
    dateIct: string;
  };
  "sweep:abandoned": {
    windowStart: string;
  };
  "entitlement:expire": {
    dateIct: string;
  };
  "order:expire": {
    hour: string;
  };
  "account:purge": {
    dateIct: string;
    userId?: number;
  };
  "image:cleanup-orphan": {
    week: string;
  };
  "pdf:render": {
    exportJobUuid: string;
    userId: number;
    kind: "lesson_plan" | "worksheet" | "curriculum_plan";
    refId: string;
  };
  "sweep:pdf-cleanup": {
    dateIct?: string;
  };
}

export type JobName = keyof JobPayloads;

let queue: Queue | undefined;
let connection: Redis | undefined;

export const QUEUE_NAME = "kidthink-jobs";

function getQueue() {
  if (!queue) {
    connection = new Redis(process.env.VALKEY_URL || "redis://localhost:6380", {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

export interface EnqueueOptions {
  jobId?: string;
  businessKey?: string | number;
}

function extractKeyFromPayload(payload: unknown): string | number | undefined {
  const p = payload as Record<string, unknown>;
  if (p.exportJobUuid) {
    return p.exportJobUuid as string;
  }
  if (p.dateIct) {
    return p.dateIct as string;
  }
  if (p.sessionUuid) {
    return p.sessionUuid as string;
  }
  if (p.notificationId) {
    return p.notificationId as number;
  }
  if (p.windowStart) {
    return p.windowStart as string;
  }
  if (p.hour) {
    return p.hour as string;
  }
  if (p.week) {
    return p.week as string;
  }
  return undefined;
}

function resolveJobId(
  name: string,
  payload: unknown,
  options?: EnqueueOptions
): string {
  if (options?.jobId) {
    return options.jobId;
  }
  if (options?.businessKey !== undefined) {
    return buildDeterministicJobId(name, options.businessKey);
  }
  const key = extractKeyFromPayload(payload);
  if (key !== undefined) {
    return buildDeterministicJobId(name, key);
  }
  return `${name}:default`;
}

function resolveRetryOptions(name: JobName) {
  const def = getJobDefinition(name);
  const attempts = def ? def.retryPolicy.maxAttempts : 3;
  const backoff =
    def && def.retryPolicy.backoffType !== "none"
      ? {
          type: def.retryPolicy.backoffType,
          delay: def.retryPolicy.backoffDelayMs,
        }
      : undefined;
  return { attempts, backoff };
}

export function enqueue<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): Promise<Job | undefined> {
  const q = getQueue();
  const jobId = resolveJobId(name, payload, options);
  const { attempts, backoff } = resolveRetryOptions(name);

  return q.add(name, payload, {
    jobId,
    attempts,
    backoff,
  });
}

export const enqueueJob = enqueue;

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

export function getFailedCount(): Promise<number> {
  const q = getQueue();
  return q.getFailedCount();
}
