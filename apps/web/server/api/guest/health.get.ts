import {
  buildAuthSentinelKey,
  generateTokenHex,
  getAuthRedisClient,
} from "@mindkid/auth";
import { ping } from "@mindkid/cache";
import { getOwnerDb } from "@mindkid/db";
import { alert, getWaitingCount } from "@mindkid/queue";
import { sql } from "drizzle-orm";
import { defineEventHandler, setHeader, setResponseStatus } from "h3";

const SERVICE_TIMEOUT_MS = 2000;
const TOTAL_BUDGET_MS = 3000;
const AUTH_SENTINEL_TTL_SECONDS = 5;

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

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");

  const start = Date.now();

  const withTimeout = <T>(
    promise: Promise<T>,
    ms: number,
    name: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${name} timed out after ${ms}ms`)),
          ms
        )
      ),
    ]);
  };

  try {
    const dbPromise = withTimeout(
      getOwnerDb().execute(sql`SELECT 1`),
      SERVICE_TIMEOUT_MS,
      "Database"
    );

    const cachePromise = withTimeout(ping(), SERVICE_TIMEOUT_MS, "Cache");

    const authPromise = withTimeout(
      probeAuthKeyspace(),
      SERVICE_TIMEOUT_MS,
      "Auth"
    );

    const queuePromise = withTimeout(
      getWaitingCount(),
      SERVICE_TIMEOUT_MS,
      "Queue"
    );

    await Promise.all([dbPromise, cachePromise, authPromise, queuePromise]);

    const totalTime = Date.now() - start;
    if (totalTime > TOTAL_BUDGET_MS) {
      throw new Error(`Health check took too long: ${totalTime}ms`);
    }

    // Do not include version, hostname or connection strings as per BR-HLT-04
    return {
      status: "ok",
    };
  } catch (error) {
    alert("error", "Health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    setResponseStatus(event, 503);
    return {
      status: "error",
    };
  }
});
