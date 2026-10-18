import { writeAudit } from "@mindkid/audit";
import { getClient } from "@mindkid/cache";
import { entitlements, getDb, packages, quotaUsage } from "@mindkid/db";
import {
  EntitlementNotFoundError,
  PackageNotFoundError,
} from "@mindkid/errors/billing";
import {
  activeStackBase,
  computeStackedExpiryDate,
  type EntitlementKey,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
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
    throw new PackageNotFoundError("Gói không tồn tại trong catalog");
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
        activeStackBase(existing),
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

    // Insert audit log (BR-EGR-03, BR-AUD-01, BR-AUD-02)
    await writeAudit(tx, {
      actor_type: params.actor.type,
      actor_id: params.actor.id ?? null,
      action: "entitlement_granted",
      entity_type: "user",
      entity_id: String(params.userId),
      before_data: {
        package_code: params.packageCode,
      },
      after_data: {
        package_code: params.packageCode,
        duration_days: params.durationDays,
        source: params.source,
        granted_keys: grantedResults.map((r) => r.key),
      },
      reason: params.reason,
      ip_address: params.actor.ip ?? null,
      user_agent: params.actor.userAgent ?? null,
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
      throw new EntitlementNotFoundError(String(id));
    }

    const previousStatus = existing.status;

    await activeTx
      .update(entitlements)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(entitlements.id, id));

    // Record audit log (BR-EGR-03, BR-AUD-02)
    await writeAudit(activeTx, {
      actor_type: actor.type,
      actor_id: actor.id ?? null,
      action: "entitlement_revoked",
      entity_type: "entitlement",
      entity_id: String(id),
      before_data: {
        status: previousStatus,
        entitlement_key: existing.entitlementKey,
        user_id: existing.userId,
      },
      after_data: {
        status: "cancelled",
        entitlement_key: existing.entitlementKey,
        user_id: existing.userId,
      },
      reason,
      ip_address: actor.ip ?? null,
      user_agent: actor.userAgent ?? null,
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

export interface ResetUserQuotaParams {
  userId: number;
  quotaKey: string;
  reason: string;
  actor: {
    type: "manager" | "system";
    id?: number;
    ip?: string | null;
    userAgent?: string | null;
  };
}

export async function resetUserQuota(
  params: ResetUserQuotaParams
): Promise<{ userId: number; quotaKey: string; resetCount: number }> {
  const db = getDb();
  const now = new Date();

  return await db.transaction(async (tx) => {
    const updated = await tx
      .update(quotaUsage)
      .set({
        used: 0,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotaUsage.userId, params.userId),
          eq(quotaUsage.quotaKey, params.quotaKey)
        )
      )
      .returning({ id: quotaUsage.id });

    await writeAudit(tx, {
      actor_type: params.actor.type,
      actor_id: params.actor.id ?? null,
      action: "quota_reset",
      entity_type: "quota_usage",
      entity_id: `${params.userId}:${params.quotaKey}`,
      before_data: {
        user_id: params.userId,
        quota_key: params.quotaKey,
      },
      after_data: {
        user_id: params.userId,
        quota_key: params.quotaKey,
        used: 0,
        reset_rows: updated.length,
      },
      reason: params.reason,
      ip_address: params.actor.ip ?? null,
      user_agent: params.actor.userAgent ?? null,
    });

    return {
      userId: params.userId,
      quotaKey: params.quotaKey,
      resetCount: updated.length,
    };
  });
}

export async function deployPackageCatalog(actor?: {
  id?: number | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ deployedCodes: string[] }> {
  const db = getDb();
  const deployedCodes = Object.keys(PACKAGE_CATALOG);

  await db.transaction(async (tx) => {
    const existing = await tx.select({ code: packages.code }).from(packages);
    await writeAudit(tx, {
      actor_type: actor?.id ? "manager" : "system",
      actor_id: actor?.id ?? null,
      action: "package_catalog_deployed",
      entity_type: "package_catalog",
      entity_id: "PACKAGE_CATALOG",
      before_data: {
        existing_codes: existing.map((row) => row.code),
      },
      after_data: {
        deployed_codes: deployedCodes,
      },
      ip_address: actor?.ip ?? null,
      user_agent: actor?.userAgent ?? null,
    });
  });

  return { deployedCodes };
}
