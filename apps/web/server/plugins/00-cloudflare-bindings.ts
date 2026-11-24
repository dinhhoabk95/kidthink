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
import { isCloudflareRuntime } from "@mindkid/config";
import {
  type MinimalD1Database,
  registerCloudflareD1Bindings,
} from "@mindkid/db";
import {
  type JobQueueCoordinatorPort,
  registerCloudflareQueuePort,
} from "@mindkid/queue";
import {
  createD1BlobSqlPort,
  D1BlobObjectStorageDriver,
  setActiveObjectStorageDriver,
} from "@mindkid/storage";
import { defineNitroPlugin } from "nitropack/runtime";

interface DurableObjectNamespaceBinding<TStub> {
  idFromName(name: string): object;
  get(id: object): TStub;
}

type AuthDoStub = AuthCoordinatorRpcPort & {
  kvDeleteByPrefix(prefix: string): Promise<number>;
  consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): Promise<RateLimitCheckResult>;
};

interface CloudflareEnvBindings {
  readonly DB_CORE?: MinimalD1Database;
  readonly DB_BLOBS?: MinimalD1Database;
  readonly AUTH_COORDINATOR?: DurableObjectNamespaceBinding<AuthDoStub>;
  readonly JOB_QUEUE_DO?: DurableObjectNamespaceBinding<JobQueueCoordinatorPort>;
}

interface CloudflareRequestContext {
  readonly env?: CloudflareEnvBindings;
}

/** Tên DO phải khớp `AUTH_DO_NAME` / `QUEUE_DO_NAME` ở `apps/worker` (BR-JOB-11). */
const AUTH_DO_NAME = "global-auth-v1";
const QUEUE_DO_NAME = "queue-v1";

/**
 * Stub DO gắn với I/O context của request đã tạo ra nó: giữ stub ở module-level rồi dùng ở request
 * khác gây `Cannot perform I/O on behalf of a different request` (đã đo bằng `wrangler dev`, G9).
 * Vì vậy chỉ giữ NAMESPACE (binding ổn định theo isolate) và lấy stub mới ở MỖI lần gọi.
 */
function wireAuthCoordinator(
  namespace: DurableObjectNamespaceBinding<AuthDoStub>
): void {
  const stub = (): AuthDoStub =>
    namespace.get(namespace.idFromName(AUTH_DO_NAME));

  registerAuthCoordinatorPort({
    kvGet: (key) => stub().kvGet(key),
    kvGetDel: (key) => stub().kvGetDel(key),
    kvSet: (key, value, ttlSeconds) => stub().kvSet(key, value, ttlSeconds),
    kvDel: (keys) => stub().kvDel(keys),
    kvIncr: (key) => stub().kvIncr(key),
    kvExpire: (key, seconds) => stub().kvExpire(key, seconds),
    kvDeleteByPrefix: (prefix) => stub().kvDeleteByPrefix(prefix),
  });

  const rlPort: RateLimitCoordinatorPort = {
    consumeRateLimit: (input) => stub().consumeRateLimit(input),
  };
  registerCloudflareRateLimitPort(rlPort);

  const kvPort: CacheKvPort = {
    get: (key) => stub().kvGet(key),
    set: async (key, value, ttlSeconds) => {
      await stub().kvSet(key, value, ttlSeconds);
    },
    del: (...keys) => stub().kvDel(keys),
    deleteByPrefix: (prefix) => stub().kvDeleteByPrefix(prefix),
  };
  registerCloudflareCachePort(kvPort);
}

function wireJobQueueCoordinator(
  namespace: DurableObjectNamespaceBinding<JobQueueCoordinatorPort>
): void {
  // Một DO duy nhất `queue-v1`, không sharding (BR-JOB-11). Không đăng ký
  // `waitUntil`: enqueue là một RPC ngắn nên được await trực tiếp. Stub lấy mới mỗi lần gọi (G9).
  const stub = (): JobQueueCoordinatorPort =>
    namespace.get(namespace.idFromName(QUEUE_DO_NAME));
  registerCloudflareQueuePort({
    enqueueBatch: (jobs) => stub().enqueueBatch(jobs),
    getStats: () => stub().getStats(),
  });
}

let blobDriverInstalled = false;

/** Binding ổn định theo isolate: cài driver D1 blobs đúng một lần (BR-IMG-11). */
function installBlobStorageDriver(db: MinimalD1Database): void {
  if (blobDriverInstalled) {
    return;
  }
  setActiveObjectStorageDriver(
    new D1BlobObjectStorageDriver(createD1BlobSqlPort(db))
  );
  blobDriverInstalled = true;
}

/**
 * Binding ổn định theo isolate nên nối port bằng `register*` toàn cục đúng một
 * lần cho mỗi `env`, không dùng `AsyncLocalStorage.enterWith` (workerd không
 * bảo đảm giữ store qua ranh giới await của handler).
 *
 * Đóng-khi-lỗi (`BR-JOB-12`): `env` chỉ được ghi nhận là đã nối SAU KHI mọi port
 * nối xong; thiếu binding bắt buộc thì ném lỗi rõ ràng thay vì chạy nửa vời.
 */
const wiredEnvs = new WeakSet<object>();

function requireBinding<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(
      `Cloudflare binding ${name} is missing on mindkid-web (BR-JOB-12)`
    );
  }
  return value;
}

export function wireCloudflareEnv(env: CloudflareEnvBindings): void {
  if (wiredEnvs.has(env)) {
    return;
  }
  const core = requireBinding(env.DB_CORE, "DB_CORE");
  const blobs = requireBinding(env.DB_BLOBS, "DB_BLOBS");
  const auth = requireBinding(env.AUTH_COORDINATOR, "AUTH_COORDINATOR");

  registerCloudflareD1Bindings(core);
  installBlobStorageDriver(blobs);
  wireAuthCoordinator(auth);
  if (env.JOB_QUEUE_DO) {
    wireJobQueueCoordinator(env.JOB_QUEUE_DO);
  }
  wiredEnvs.add(env);
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if (!isCloudflareRuntime()) {
      return;
    }
    // Nitro `cloudflare_module`: `event.context.cloudflare = { request, env, context, url }`.
    const cf = (event.context as { cloudflare?: CloudflareRequestContext })
      .cloudflare;
    if (cf?.env) {
      wireCloudflareEnv(cf.env);
    }
  });
});
