import { appError } from "@kidthink/auth";
import { getClient } from "@kidthink/cache";
import { auditLogs, entitlements, getDb } from "@kidthink/db";
import {
  computeStackedExpiryDate,
  type EntitlementKey,
  PACKAGE_CATALOG,
} from "@kidthink/shared";
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

export interface MutateEntitlementsParams {
  userId: number;
  packageCode: string;
  durationDays: number;
  source: "package_order" | "manual_grant" | "trial" | "promo";
  reason: string;
  actor: {
    type: "manager" | "system";
    id?: number;
    ip?: string | null;
    userAgent?: string | null;
  };
  sourceRef?: string;
  tx?: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
}

export interface MutatedEntitlementResult {
  key: string;
  expires_at: Date | null;
  status: string;
}

/**
 * D-JM: Canonical shared helper for mutating entitlements, recording audit log,
 * and immediately invalidating cache.
 */
export async function mutateUserEntitlements(
  params: MutateEntitlementsParams
): Promise<MutatedEntitlementResult[]> {
  const pkg = PACKAGE_CATALOG[params.packageCode];
  if (!pkg) {
    throw appError("PACKAGE_NOT_FOUND", "Gói không tồn tại trong catalog");
  }

  const now = new Date();
  const executeInTransaction = async (
    tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]
  ) => {
    const grantedResults: MutatedEntitlementResult[] = [];
    const entitlementKeysToGrant = pkg.entitlements || [];

    for (const key of entitlementKeysToGrant) {
      const [existing] = await tx
        .select()
        .from(entitlements)
        .where(
          and(
            eq(entitlements.userId, params.userId),
            eq(entitlements.entitlementKey, key)
          )
        )
        .limit(1);

      const newExpiresAt = computeStackedExpiryDate(
        existing?.expiresAt,
        params.durationDays,
        0,
        now
      );

      if (existing) {
        await tx
          .update(entitlements)
          .set({
            status: "active",
            source: params.source,
            sourceRef: params.sourceRef ?? null,
            expiresAt: newExpiresAt,
            grantedByManagerId: params.actor.id ?? null,
            grantReason: params.reason,
            updatedAt: now,
          })
          .where(eq(entitlements.id, existing.id));
      } else {
        await tx.insert(entitlements).values({
          userId: params.userId,
          entitlementKey: key,
          source: params.source,
          sourceRef: params.sourceRef ?? null,
          status: "active",
          expiresAt: newExpiresAt,
          grantedByManagerId: params.actor.id ?? null,
          grantReason: params.reason,
        });
      }

      grantedResults.push({
        key,
        expires_at: newExpiresAt,
        status: "active",
      });
    }

    // Insert audit log (BR-EGR-03, BR-AUD-01)
    await tx.insert(auditLogs).values({
      actorType: params.actor.type,
      actorId: params.actor.id ?? null,
      action: "entitlement_granted",
      entityType: "user",
      entityId: String(params.userId),
      beforeData: {
        package_code: params.packageCode,
      },
      afterData: {
        package_code: params.packageCode,
        duration_days: params.durationDays,
        source: params.source,
        granted_keys: grantedResults.map((r) => r.key),
      },
      reason: params.reason,
      ipAddress: params.actor.ip ?? null,
      userAgent: params.actor.userAgent ?? null,
    });

    return grantedResults;
  };

  let results: MutatedEntitlementResult[];
  if (params.tx) {
    results = await executeInTransaction(params.tx);
  } else {
    const db = getDb();
    results = await db.transaction(executeInTransaction);
  }

  // Invalidate cache immediately (D-JM, BR-EGR-06)
  await invalidateUserEntitlementsCache(params.userId);

  return results;
}

export async function revokeUserEntitlementById(
  id: number,
  reason: string,
  actor: {
    type: "manager" | "system";
    id?: number;
    ip?: string | null;
    userAgent?: string | null;
  },
  tx?: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]
): Promise<{ id: number; userId: number; key: string; status: string }> {
  const now = new Date();
  const executeInTransaction = async (
    activeTx: Parameters<
      Parameters<ReturnType<typeof getDb>["transaction"]>[0]
    >[0]
  ) => {
    const [existing] = await activeTx
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, id))
      .limit(1);

    if (!existing) {
      throw appError("NOT_FOUND", "Không tìm thấy quyền cần thu hồi");
    }

    const previousStatus = existing.status;

    await activeTx
      .update(entitlements)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(entitlements.id, id));

    // Record audit log (BR-EGR-03)
    await activeTx.insert(auditLogs).values({
      actorType: actor.type,
      actorId: actor.id ?? null,
      action: "entitlement_revoked",
      entityType: "entitlement",
      entityId: String(id),
      beforeData: {
        status: previousStatus,
        entitlement_key: existing.entitlementKey,
        user_id: existing.userId,
      },
      afterData: {
        status: "cancelled",
        entitlement_key: existing.entitlementKey,
        user_id: existing.userId,
      },
      reason,
      ipAddress: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return {
      id: existing.id,
      userId: existing.userId,
      key: existing.entitlementKey,
      status: "cancelled",
    };
  };

  let result: { id: number; userId: number; key: string; status: string };
  if (tx) {
    result = await executeInTransaction(tx);
  } else {
    const db = getDb();
    result = await db.transaction(executeInTransaction);
  }

  // Invalidate cache immediately upon revocation (BR-EGR-06, D-JM)
  await invalidateUserEntitlementsCache(result.userId);

  return result;
}
