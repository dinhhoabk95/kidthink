import { ping } from "@mindkid/cache";
import { getOwnerDb } from "@mindkid/db";
import { alert, getWaitingCount } from "@mindkid/queue";
import { sql } from "drizzle-orm";
import { defineEventHandler, setHeader, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  // Set no-store cache header
  setHeader(event, "Cache-Control", "no-store");

  const start = Date.now();

  // Timeout wrapper
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
    // 1. Kiểm tra PostgreSQL qua Drizzle (SELECT 1)
    const dbPromise = withTimeout(
      getOwnerDb().execute(sql`SELECT 1`),
      2000,
      "Database"
    );

    // 2. PING Valkey
    const cachePromise = withTimeout(ping(), 2000, "Cache");

    // 3. Queue waiting count
    const queuePromise = withTimeout(getWaitingCount(), 2000, "Queue");

    // Check parallel
    await Promise.all([dbPromise, cachePromise, queuePromise]);

    const totalTime = Date.now() - start;
    if (totalTime > 3000) {
      throw new Error(`Health check took too long: ${totalTime}ms`);
    }

    // Do not include version, hostname or connection strings as per BR-HLT-04
    return {
      status: "ok",
    };
  } catch (error: unknown) {
    alert("error", "Health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    setResponseStatus(event, 503);
    return {
      status: "error",
    };
  }
});
