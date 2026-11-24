import {
  type AuthCoordinatorRpcPort,
  enterAuthCoordinatorPort,
} from "@mindkid/auth";
import { type CacheKvPort, enterCloudflareCachePort } from "@mindkid/cache";
import { DB, type MinimalD1Database } from "@mindkid/db";
import {
  alert,
  type JobName,
  JobQueueSqlEngine,
  type MinimalDoSqlStorage,
  type QueuedJobEnvelope,
  requireJob,
} from "@mindkid/queue";
import { CONSUMERS } from "#src/consumers/index";
import { checkGraduationReadiness } from "#src/graduation-sensor";
import { runWithTimeout } from "#src/worker";

export type WorkerAuthCoordinatorStub = AuthCoordinatorRpcPort & {
  kvDeleteByPrefix?(prefix: string): Promise<number>;
};

export interface DurableObjectNamespaceBinding<TStub> {
  idFromName(name: string): object;
  get(id: object): TStub;
}

export interface CloudflareWorkerEnv {
  readonly DB_CORE: MinimalD1Database;
  readonly DB_LOGS: MinimalD1Database;
  readonly DB_BLOBS: MinimalD1Database;
  readonly MINDKID_RUNTIME?: string;
  readonly AUTH_COORDINATOR?: DurableObjectNamespaceBinding<WorkerAuthCoordinatorStub>;
}

export interface DurableObjectStateLike {
  readonly storage: {
    readonly sql: MinimalDoSqlStorage;
    getAlarm(): Promise<number | null>;
    setAlarm(scheduledTimeMs: number): Promise<void>;
  };
}

function bindCloudflareAuthAndCachePorts(env: CloudflareWorkerEnv): void {
  if (!env.AUTH_COORDINATOR) {
    return;
  }

  const authStub = env.AUTH_COORDINATOR.get(
    env.AUTH_COORDINATOR.idFromName("global-auth-v1")
  );
  enterAuthCoordinatorPort(authStub);

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
  enterCloudflareCachePort(cachePort);
}

/**
 * Durable Object xử lý hàng đợi > 50.000-200.000+ jobs/ngày trên gói Cloudflare Free.
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
        if (name === "backup:postgres" || name === "backup:verify") {
          // Trên Giai đoạn 1 Cloudflare Free, sao lưu thực hiện qua `.github/workflows/backup-d1-nightly.yml`
          // (`wrangler d1 export` + AES-256-GCM) và D1 Time Travel 7 ngày.
          return;
        }
        DB.registerD1Bindings(this.env.DB_CORE);
        bindCloudflareAuthAndCachePorts(this.env);
        const def = requireJob(name);
        const validated = def.parse(payload);
        await runWithTimeout(name, timeoutSeconds, async (signal) => {
          await CONSUMERS[name](validated, { jobId, attempt, signal });
        });
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
 * 1 Cron Dispatcher duy nhất (mỗi 15 phút - chỉ dùng 1/5 slot Cron miễn phí của tài khoản Cloudflare)
 * điều phối toàn bộ lịch quét định kỳ theo giờ Việt Nam (ICT = UTC+7).
 */
export async function runUnifiedCronTick(
  scheduledTimeMs: number,
  env: CloudflareWorkerEnv,
  enqueueToDo: (jobs: readonly QueuedJobEnvelope[]) => Promise<void>
): Promise<{ readonly dispatchedJobs: JobName[] }> {
  DB.registerD1Bindings(env.DB_CORE);
  bindCloudflareAuthAndCachePorts(env);

  const ictDate = new Date(scheduledTimeMs + 7 * 3600 * 1000);
  const ictHour = ictDate.getUTCHours();
  const ictMinute = ictDate.getUTCMinutes();
  const dateIct = ictDate.toISOString().slice(0, 10);
  const hourKey = `${dateIct}T${String(ictHour).padStart(2, "0")}`;

  const toDispatch: {
    name: JobName;
    key: string;
    payload: Record<string, string>;
  }[] = [
    {
      name: "sweep:abandoned",
      key: `sweep:abandoned:${Math.floor(scheduledTimeMs / (15 * 60 * 1000))}`,
      payload: { windowStart: new Date(scheduledTimeMs).toISOString() },
    },
  ];

  if (ictMinute < 15) {
    toDispatch.push({
      name: "order:expire",
      key: `order:expire:${hourKey}`,
      payload: { hour: hourKey },
    });
  }

  if (ictHour === 0 && ictMinute < 15) {
    toDispatch.push({
      name: "entitlement:expire",
      key: `entitlement:expire:${dateIct}`,
      payload: { dateIct },
    });
  }

  if (ictHour === 2 && ictMinute < 15) {
    toDispatch.push({
      name: "rollup:daily",
      key: `rollup:daily:${dateIct}`,
      payload: { dateIct },
    });
    await checkGraduationReadiness(new Date(scheduledTimeMs));
  }

  if (ictHour === 3 && ictMinute < 15) {
    toDispatch.push({
      name: "account:purge",
      key: `account:purge:${dateIct}`,
      payload: { dateIct },
    });
  }

  const envelopes: QueuedJobEnvelope[] = toDispatch.map((item) => {
    const def = requireJob(item.name);
    return {
      jobId: item.key,
      name: item.name,
      payloadJson: JSON.stringify(item.payload),
      maxAttempts: def.retry.maxAttempts,
      backoffType: def.retry.backoffType,
      backoffDelayMs: def.retry.backoffDelayMs,
      timeoutSeconds: def.timeoutSeconds,
      alertOnFailImmediately: def.retry.alertOnFailImmediately,
    };
  });

  await enqueueToDo(envelopes);
  return { dispatchedJobs: toDispatch.map((d) => d.name) };
}
