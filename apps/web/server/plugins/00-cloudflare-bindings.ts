import {
  type AuthCoordinatorRpcPort,
  enterAuthCoordinatorPort,
} from "@mindkid/auth";
import {
  type CacheKvPort,
  enterCloudflareCachePort,
  enterCloudflareRateLimitPort,
  type RateLimitCheckResult,
  type RateLimitCoordinatorPort,
} from "@mindkid/cache";
import { isCloudflareRuntime } from "@mindkid/config";
import { enterCloudflareD1Binding, type MinimalD1Database } from "@mindkid/db";
import {
  enterCloudflareQueuePort,
  type JobQueueCoordinatorPort,
  type QueuedJobEnvelope,
} from "@mindkid/queue";
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
  readonly AUTH_COORDINATOR?: DurableObjectNamespaceBinding<AuthDoStub>;
  readonly JOB_QUEUE_DO?: DurableObjectNamespaceBinding<JobQueueCoordinatorPort>;
}

interface CloudflareRequestContext {
  readonly env?: CloudflareEnvBindings;
  readonly ctx?: {
    waitUntil(promise: Promise<void>): void;
  };
}

function wireAuthCoordinator(
  namespace: DurableObjectNamespaceBinding<AuthDoStub>
): void {
  const authStub = namespace.get(namespace.idFromName("global-auth-v1"));
  enterAuthCoordinatorPort(authStub);

  const rlPort: RateLimitCoordinatorPort = {
    consumeRateLimit: (input) => authStub.consumeRateLimit(input),
  };
  enterCloudflareRateLimitPort(rlPort);

  const kvPort: CacheKvPort = {
    get: (key) => authStub.kvGet(key),
    set: async (key, value, ttlSeconds) => {
      await authStub.kvSet(key, value, ttlSeconds);
    },
    del: (...keys) => authStub.kvDel(keys),
    deleteByPrefix: (prefix) => authStub.kvDeleteByPrefix(prefix),
  };
  enterCloudflareCachePort(kvPort);
}

function wireJobQueueCoordinator(
  namespace: DurableObjectNamespaceBinding<JobQueueCoordinatorPort>,
  cf: CloudflareRequestContext | undefined
): void {
  const shardedPort: JobQueueCoordinatorPort = {
    async enqueueBatch(jobs: readonly QueuedJobEnvelope[]) {
      const shardIdx =
        jobs.length > 0 ? Math.abs(jobs[0]?.jobId.charCodeAt(0) ?? 0) % 4 : 0;
      const stub = namespace.get(
        namespace.idFromName(`queue-shard-${shardIdx}`)
      );
      return await stub.enqueueBatch(jobs);
    },
    async getStats() {
      const stub = namespace.get(namespace.idFromName("queue-shard-0"));
      return await stub.getStats();
    },
  };
  const waitUntilFn = cf?.ctx
    ? (promise: Promise<void>) => {
        cf.ctx?.waitUntil(promise);
      }
    : undefined;
  enterCloudflareQueuePort(shardedPort, waitUntilFn);
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if (!isCloudflareRuntime()) {
      return;
    }
    const cf = (event.context as { cloudflare?: CloudflareRequestContext })
      .cloudflare;
    const env = cf?.env;
    if (!env?.DB_CORE) {
      return;
    }

    enterCloudflareD1Binding(env.DB_CORE);

    if (env.AUTH_COORDINATOR) {
      wireAuthCoordinator(env.AUTH_COORDINATOR);
    }

    if (env.JOB_QUEUE_DO) {
      wireJobQueueCoordinator(env.JOB_QUEUE_DO, cf);
    }
  });
});
