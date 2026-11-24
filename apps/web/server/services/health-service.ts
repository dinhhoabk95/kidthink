import {
  buildAuthSentinelKey,
  generateTokenHex,
  getAuthRedisClient,
} from "@mindkid/auth";
import { getDbConnectionName } from "@mindkid/config";
import { getOwnerDb } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { alert, getWaitingCount } from "@mindkid/queue";

const SERVICE_TIMEOUT_MS = 2000;
const TOTAL_BUDGET_MS = 3000;
const AUTH_SENTINEL_TTL_SECONDS = 5;

export interface CloudflareHealthEnv {
  readonly AUTH_COORDINATOR?: object;
  readonly JOB_QUEUE_DO?: object;
}

export interface HealthCheckResult {
  readonly ok: boolean;
  readonly body: {
    readonly status: "ok" | "error";
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  name: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function probeAuthKeyspace(): Promise<void> {
  const redis = getAuthRedisClient();
  const sentinelValue = generateTokenHex(8);
  const sentinelKey = buildAuthSentinelKey("user", sentinelValue);
  await redis.set(sentinelKey, sentinelValue, "EX", AUTH_SENTINEL_TTL_SECONDS);
  try {
    const readBack = await redis.get(sentinelKey);
    if (readBack !== sentinelValue) {
      throw new Error("Auth Redis sentinel read-back mismatch (BR-HLT-02)");
    }
  } finally {
    await redis.del(sentinelKey);
  }
}

export interface HealthCheckDeps {
  /** Seam cho test ca âm (DB chết/treo); mặc định ping DB chủ thật. */
  readonly pingDb?: () => Promise<void>;
}

function pingOwnerDb(): Promise<void> {
  return createRepositories(getOwnerDb()).system.ping();
}

function collectHealthProbes(
  cfEnv: CloudflareHealthEnv | undefined,
  pingDb: () => Promise<void>
): Promise<void>[] {
  const conn = getDbConnectionName();
  const dbProbe = withTimeout(pingDb(), SERVICE_TIMEOUT_MS, "Database");

  // Dev/test (`sqlite`): auth keyspace và queue là engine chạy trong tiến trình
  // (D15) — không có phụ thuộc ngoài để kiểm, chỉ kiểm DB.
  if (conn !== "d1") {
    return [dbProbe];
  }

  const probes: Promise<void>[] = [dbProbe];
  if (cfEnv?.AUTH_COORDINATOR) {
    probes.push(withTimeout(probeAuthKeyspace(), SERVICE_TIMEOUT_MS, "Auth"));
  }
  if (cfEnv?.JOB_QUEUE_DO) {
    probes.push(
      withTimeout(
        getWaitingCount().then(() => undefined),
        SERVICE_TIMEOUT_MS,
        "Queue"
      )
    );
  }
  return probes;
}

export async function runSystemHealthCheck(
  cfEnv?: CloudflareHealthEnv,
  deps: HealthCheckDeps = {}
): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    await Promise.all(collectHealthProbes(cfEnv, deps.pingDb ?? pingOwnerDb));

    const totalTime = Date.now() - start;
    if (totalTime > TOTAL_BUDGET_MS) {
      throw new Error(`Health check took too long: ${totalTime}ms`);
    }

    return {
      ok: true,
      body: { status: "ok" },
    };
  } catch (error) {
    alert("error", "Health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      body: { status: "error" },
    };
  }
}
