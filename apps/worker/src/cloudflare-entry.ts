import { DurableObject } from "cloudflare:workers";
import { AuthCoordinatorEngine } from "@mindkid/cache";
import type { QueuedJobEnvelope } from "@mindkid/queue";
import {
  CloudflareJobQueueController,
  type CloudflareWorkerEnv,
  type DurableObjectStateLike,
  type JobQueueStub,
  QUEUE_DO_NAME,
  runUnifiedCronTick,
} from "#src/cloudflare-runtime";

/**
 * Entry Cloudflare của `mindkid-worker` (`BR-JOB-04`: không mở HTTP công khai —
 * chỉ DO RPC và cron). Cố ý KHÔNG import `bullmq`/`#src/worker` (`BR-JOB-11`).
 *

 * Chỉ export lớp DO và handler mặc định: workerd từ chối mọi export khác.
 *
 * Hai Durable Object dùng chung script này: `JobQueueDO` (một instance `queue-v1`)
 * và `AuthCoordinatorDO` (một instance `global-auth-v1`); `mindkid-web` gọi chúng
 * qua binding `script_name: "mindkid-worker"`.
 */
export class JobQueueDO extends DurableObject<CloudflareWorkerEnv> {
  private readonly controller: CloudflareJobQueueController;

  constructor(ctx: DurableObjectStateLike, env: CloudflareWorkerEnv) {
    super(ctx, env);
    this.controller = new CloudflareJobQueueController(ctx, env);
  }

  enqueueBatch(
    jobs: readonly QueuedJobEnvelope[]
  ): Promise<{ readonly accepted: number }> {
    return this.controller.enqueueBatch(jobs);
  }

  getStats(): Promise<{ readonly waiting: number; readonly failed: number }> {
    return this.controller.getStats();
  }

  alarm(): Promise<{ readonly processed: number; readonly failed: number }> {
    return this.controller.alarm();
  }
}

export class AuthCoordinatorDO extends DurableObject<CloudflareWorkerEnv> {
  private readonly engine: AuthCoordinatorEngine;

  constructor(ctx: DurableObjectStateLike, env: CloudflareWorkerEnv) {
    super(ctx, env);
    this.engine = new AuthCoordinatorEngine(ctx.storage.sql, ctx.storage);
  }

  kvGet(key: string): Promise<string | null> {
    return this.engine.kvGet(key);
  }

  kvGetDel(key: string): Promise<string | null> {
    return this.engine.kvGetDel(key);
  }

  kvSet(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<string | null> {
    return this.engine.kvSet(key, value, ttlSeconds);
  }

  kvDel(keys: readonly string[]): Promise<number> {
    return this.engine.kvDel(keys);
  }

  kvDeleteByPrefix(prefix: string): Promise<number> {
    return this.engine.kvDeleteByPrefix(prefix);
  }

  kvIncr(key: string): Promise<number> {
    return this.engine.kvIncr(key);
  }

  kvExpire(key: string, seconds: number): Promise<number> {
    return this.engine.kvExpire(key, seconds);
  }

  consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): ReturnType<AuthCoordinatorEngine["consumeRateLimit"]> {
    return this.engine.consumeRateLimit(input);
  }

  /** Dọn khoá/bucket hết hạn rồi tự hẹn lại khi còn dòng có hạn. */
  alarm(): Promise<number> {
    return this.engine.runAlarm();
  }
}

/** Phần của `ScheduledController` mà handler dùng. */
export interface ScheduledControllerLike {
  readonly scheduledTime: number;
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  scheduled(
    controller: ScheduledControllerLike,
    env: CloudflareWorkerEnv,
    ctx: ExecutionContextLike
  ): void {
    const namespace = env.JOB_QUEUE_DO;
    if (!namespace) {
      throw new Error("JOB_QUEUE_DO binding is missing on mindkid-worker");
    }
    // Stub lấy mới ở mỗi lần gọi, không giữ qua lần `scheduled()` khác (G9).
    const stub = (): JobQueueStub =>
      namespace.get(namespace.idFromName(QUEUE_DO_NAME));
    ctx.waitUntil(
      runUnifiedCronTick(controller.scheduledTime, env, {
        enqueueBatch: (jobs) => stub().enqueueBatch(jobs),
        getStats: () => stub().getStats(),
      })
    );
  },
};
