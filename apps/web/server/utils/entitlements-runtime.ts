import { getClient } from "@kidthink/cache";
import { entitlements, getDb } from "@kidthink/db";
import type { EntitlementKey } from "@kidthink/shared";
import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";

const ENTITLEMENTS_CACHE_PREFIX = "user:entitlements:";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function resolveUserActiveEntitlements(
  userId: number,
  now = new Date()
): Promise<EntitlementKey[]> {
  const cacheKey = `${ENTITLEMENTS_CACHE_PREFIX}${userId}`;

  // Attempt cache lookup
  try {
    const redis = getClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as EntitlementKey[];
    }
  } catch {
    // Cache miss or Redis unavailable - fallback cleanly to DB
  }

  const db = getDb();
  const rows = await db
    .select({ key: entitlements.entitlementKey })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        inArray(entitlements.status, ["active", "soft_unlock", "grace_period"]),
        or(isNull(entitlements.expiresAt), gte(entitlements.expiresAt, now))
      )
    );

  const activeKeys = rows.map((r) => r.key as EntitlementKey);

  // Store in cache
  try {
    const redis = getClient();
    await redis.set(
      cacheKey,
      JSON.stringify(activeKeys),
      "EX",
      CACHE_TTL_SECONDS
    );
  } catch {
    // Non-blocking cache error
  }

  return activeKeys;
}

export async function invalidateUserEntitlementsCache(
  userId: number
): Promise<void> {
  const cacheKey = `${ENTITLEMENTS_CACHE_PREFIX}${userId}`;
  try {
    const redis = getClient();
    await redis.del(cacheKey);
  } catch {
    // Non-blocking
  }
}
