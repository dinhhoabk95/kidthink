import {
  type AuthCoordinatorRpcPort,
  registerAuthCoordinatorPort,
} from "@mindkid/auth";
import {
  type CacheKvPort,
  type RateLimitCheckResult,
  type RateLimitCoordinatorPort,
  registerCloudflareCachePort,
  registerCloudflareRateLimitPort,
} from "@mindkid/cache";
import { DB, type MinimalD1Database } from "@mindkid/db";
import {
  alert,
  CLOUDFLARE_SKIPPED_JOBS,
  type JobName,
  JobQueueSqlEngine,
  type MinimalDoSqlStorage,
  type QueuedJobEnvelope,
  registerCloudflareQueuePort,
  requireJob,
  runWithCloudflareQueuePort,
  scheduledEnvelopesAt,
} from "@mindkid/queue";
import {
  createD1BlobSqlPort,
  D1BlobObjectStorageDriver,
  setActiveObjectStorageDriver,
} from "@mindkid/storage";
import { CONSUMERS } from "#src/consumers/index";
import { checkGraduationReadiness } from "#src/graduation-sensor";
import { runWithTimeout } from "#src/run-with-timeout";

/** DO queue duy nhất, không sharding (`BR-JOB-11`). */
export const QUEUE_DO_NAME = "queue-v1";
export const AUTH_DO_NAME = "global-auth-v1";

export type WorkerAuthCoordinatorStub = AuthCoordinatorRpcPort & {
  kvDeleteByPrefix?(prefix: string): Promise<number>;
  consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): Promise<RateLimitCheckResult>;
};

export interface DurableObjectNamespaceBinding<TStub> {
  idFromName(name: string): object;
  get(id: object): TStub;
}

export interface JobQueueStub {
  enqueueBatch(
    jobs: readonly QueuedJobEnvelope[]
  ): Promise<{ readonly accepted: number }>;
  getStats(): Promise<{ readonly waiting: number; readonly failed: number }>;
}

export interface CloudflareWorkerEnv {
  readonly DB_CORE: MinimalD1Database;
  readonly DB_LOGS: MinimalD1Database;
  readonly DB_BLOBS?: MinimalD1Database;
  readonly MINDKID_RUNTIME?: string;
  readonly AUTH_COORDINATOR?: DurableObjectNamespaceBinding<WorkerAuthCoordinatorStub>;
  readonly JOB_QUEUE_DO?: DurableObjectNamespaceBinding<JobQueueStub>;
}

export interface DurableObjectStateLike {
  readonly storage: {
    readonly sql: MinimalDoSqlStorage;
    getAlarm(): Promise<number | null>;
    setAlarm(scheduledTimeMs: number): Promise<void>;
  };
}

/**
 * Binding ổn định theo isolate nên nối port bằng `register*` toàn cục (một lần
 * cho mỗi `env`), không dùng `AsyncLocalStorage.enterWith` — workerd không bảo
 * đảm giữ store qua ranh giới await của handler DO.
 */
const wiredEnvs = new WeakSet<object>();

export function wireCloudflareIsolatePorts(env: CloudflareWorkerEnv): void {
  // Đóng-khi-lỗi (`BR-JOB-12`): kiểm binding trước, đánh dấu `env` đã nối sau cùng.
  const blobs = requireWorkerBinding(env.DB_BLOBS, "DB_BLOBS");
  const authNamespace = requireWorkerBinding(
    env.AUTH_COORDINATOR,
    "AUTH_COORDINATOR"
  );

  DB.registerD1Bindings(env.DB_CORE);
  setActiveObjectStorageDriver(
    new D1BlobObjectStorageDriver(createD1BlobSqlPort(blobs))
  );
  if (wiredEnvs.has(env)) {
    return;
  }

  const authStub = authNamespace.get(authNamespace.idFromName(AUTH_DO_NAME));
  registerAuthCoordinatorPort(authStub);

  const cachePort: CacheKvPort = {
    get: (key) => authStub.kvGet(key),
    set: async (key, value, ttlSeconds) => {
      await authStub.kvSet(key, value, ttlSeconds);
    },
    del: (...keys) => authStub.kvDel(keys),
    deleteByPrefix: (prefix) =>
      authStub.kvDeleteByPrefix
        ? authStub.kvDeleteByPrefix(prefix)
        : Promise.resolve(0),
  };
  registerCloudflareCachePort(cachePort);

  const rateLimitPort: RateLimitCoordinatorPort = {
    consumeRateLimit: (input) => authStub.consumeRateLimit(input),
  };
  registerCloudflareRateLimitPort(rateLimitPort);
  wiredEnvs.add(env);
}

function requireWorkerBinding<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(
      `Cloudflare binding ${name} is missing on mindkid-worker (BR-JOB-12)`
    );
  }
  return value;
}

function isCloudflareSkippedJob(name: string): boolean {
  return (CLOUDFLARE_SKIPPED_JOBS as readonly string[]).includes(name);
}

/**
 * Logic của `JobQueueDO` (vỏ `DurableObject` nằm ở `cloudflare-entry.ts`).
 * Tuân thủ `BR-JOB-04`: `apps/worker` chỉ xử lý job nền & Cron, KHÔNG mở bất kỳ HTTP API công khai nào.
 */
export class CloudflareJobQueueController {
  private readonly engine: JobQueueSqlEngine;
  private readonly env: CloudflareWorkerEnv;

  constructor(state: DurableObjectStateLike, env: CloudflareWorkerEnv) {
    this.env = env;
    this.engine = new JobQueueSqlEngine({
      sql: state.storage.sql,
      alarms: {
        getAlarm: () => state.storage.getAlarm(),
        setAlarm: (ms) => state.storage.setAlarm(ms),
      },
      handler: async ({ jobId, name, payload, attempt, timeoutSeconds }) => {
        if (isCloudflareSkippedJob(name)) {
          // `BR-JOB-10`: sao lưu D1 do `.github/workflows/backup-d1-nightly.yml`
          // (`wrangler d1 export` + AES-256-GCM) và D1 Time Travel 7 ngày đảm nhiệm.
          return;
        }
        wireCloudflareIsolatePorts(this.env);
        const def = requireJob(name);
        const validated = def.parse(payload);
        // Engine của DO chỉ hiệu lực trong ngữ cảnh async của consumer, không đăng ký toàn cục.
        await runWithCloudflareQueuePort(this.engine, () =>
          runWithTimeout(name, timeoutSeconds, async (signal) => {
            await CONSUMERS[name](validated, { jobId, attempt, signal });
          })
        );
      },
      onDeadLetter: async (info) => {
        await alert(
          info.critical ? "critical" : "error",
          `Job ${info.name} failed on Cloudflare JobQueueDO`,
          {
            jobId: info.jobId,
            attempts: info.attempts,
            maxAttempts: info.maxAttempts,
            error: info.errorMessage,
          }
        );
      },
    });
  }

  enqueueBatch(
    jobs: readonly QueuedJobEnvelope[]
  ): Promise<{ readonly accepted: number }> {
    return this.engine.enqueueBatch(jobs);
  }

  getStats(): Promise<{ readonly waiting: number; readonly failed: number }> {
    return this.engine.getStats();
  }

  alarm(): Promise<{ readonly processed: number; readonly failed: number }> {
    return this.engine.drainBatch();
  }
}

/**
 * Tick `scheduled()` 5 phút (`BR-JOB-09`): đẩy mọi job đến hạn theo lịch ICT của
 * `JOB_DEFINITIONS` vào `JobQueueDO` duy nhất, và chạy cảm biến graduation lúc 02:00 ICT.
 */
export async function runUnifiedCronTick(
  scheduledTimeMs: number,
  env: CloudflareWorkerEnv,
  queueStub: JobQueueStub
): Promise<{ readonly dispatchedJobs: JobName[] }> {
  wireCloudflareIsolatePorts(env);
  // Ngoài DO, hàng đợi luôn đi qua STUB của `JobQueueDO` (idFromName("queue-v1")).
  registerCloudflareQueuePort(queueStub);

  const envelopes = scheduledEnvelopesAt(scheduledTimeMs);
  if (envelopes.length > 0) {
    await queueStub.enqueueBatch(envelopes);
  }

  const ict = new Date(scheduledTimeMs + 7 * 3600 * 1000);
  if (ict.getUTCHours() === 2 && ict.getUTCMinutes() < 5) {
    try {
      await checkGraduationReadiness(new Date(scheduledTimeMs));
    } catch (error) {
      await alert("error", "ops:graduation-check failed on Cloudflare cron", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { dispatchedJobs: envelopes.map((e) => e.name) };
}
