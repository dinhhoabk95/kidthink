import { writeAudit } from "@mindkid/audit";
import {
  getUserEntitlementsCache,
  invalidateUserEntitlementsCache as invalidateCachedUserEntitlements,
  setUserEntitlementsCache,
} from "@mindkid/cache";
import {
  type DbExecutor,
  ENTITLEMENT_SOURCE_CODEC,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_STATUS_CODEC,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
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
import { useRepositories } from "#server/utils/repositories";

const CACHE_TTL_SECONDS = 60;

export async function resolveUserActiveEntitlements(
  userId: number,
  now = new Date()
): Promise<EntitlementKey[]> {
  try {
    const cached = await getUserEntitlementsCache(userId);
    if (cached) {
      return cached as EntitlementKey[];
    }
  } catch {
    // Cache miss or unavailable - fallback cleanly to DB
  }

  const repos = useRepositories();
  const rows = await repos.entitlements.listActiveForUser(userId, now);
  const activeKeys = rows.map((r) => r.entitlementKey as EntitlementKey);

  try {
    await setUserEntitlementsCache(userId, activeKeys, CACHE_TTL_SECONDS);
  } catch {
    // Non-blocking cache error
  }

  return activeKeys;
}

export async function invalidateUserEntitlementsCache(
  userId: number
): Promise<void> {
  try {
    await invalidateCachedUserEntitlements(userId);
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
  tx?: DbExecutor;
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
  const executeInTransaction = async (tx: DbExecutor) => {
    const txRepos = createRepositories(tx);
    const grantedResults: MutatedEntitlementResult[] = [];
    const entitlementKeysToGrant = pkg.entitlements || [];

    for (const key of entitlementKeysToGrant) {
      const existing = await txRepos.entitlements.findByUserAndKey(
        params.userId,
        key
      );

      const newExpiresAt = computeStackedExpiryDate(
        activeStackBase(
          existing
            ? {
                status: ENTITLEMENT_STATUS_CODEC.toLabel(existing.status),
                expiresAt: existing.expiresAt,
              }
            : undefined
        ),
        params.durationDays,
        0,
        now
      );

      if (existing) {
        await txRepos.entitlements.updateEntitlementById(existing.id, {
          status: ENTITLEMENT_STATUS.ACTIVE,
          source: ENTITLEMENT_SOURCE_CODEC.toCode(params.source),
          sourceRef: params.sourceRef ?? null,
          expiresAt: newExpiresAt,
          grantedByManagerId: params.actor.id ?? null,
          grantReason: params.reason,
          updatedAt: now,
        });
      } else {
        await txRepos.entitlements.grantEntitlement({
          userId: params.userId,
          entitlementKey: key,
          source: ENTITLEMENT_SOURCE_CODEC.toCode(params.source),
          sourceRef: params.sourceRef ?? null,
          status: ENTITLEMENT_STATUS.ACTIVE,
          grantedAt: now,
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
    const repos = useRepositories();
    results = await repos.entitlements.transaction(executeInTransaction);
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
  tx?: DbExecutor
): Promise<{ id: number; userId: number; key: string; status: string }> {
  const now = new Date();
  const executeInTransaction = async (activeTx: DbExecutor) => {
    const txRepos = createRepositories(activeTx);
    const existing = await txRepos.entitlements.findById(id);

    if (!existing) {
      throw new EntitlementNotFoundError(String(id));
    }

    const previousStatus = existing.status;

    await txRepos.entitlements.updateEntitlementById(id, {
      status: ENTITLEMENT_STATUS.CANCELLED,
      updatedAt: now,
    });

    // Record audit log (BR-EGR-03, BR-AUD-02)
    await writeAudit(activeTx, {
      actor_type: actor.type,
      actor_id: actor.id ?? null,
      action: "entitlement_revoked",
      entity_type: "entitlement",
      entity_id: String(id),
      before_data: {
        status: ENTITLEMENT_STATUS_CODEC.toLabel(previousStatus),
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
    const repos = useRepositories();
    result = await repos.entitlements.transaction(executeInTransaction);
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
  const repos = useRepositories();
  const now = new Date();

  return await repos.entitlements.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const resetCount = await txRepos.entitlements.resetUserQuota(
      params.userId,
      params.quotaKey,
      now
    );

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
        reset_rows: resetCount,
      },
      reason: params.reason,
      ip_address: params.actor.ip ?? null,
      user_agent: params.actor.userAgent ?? null,
    });

    return {
      userId: params.userId,
      quotaKey: params.quotaKey,
      resetCount,
    };
  });
}

export async function deployPackageCatalog(actor?: {
  id?: number | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ deployedCodes: string[] }> {
  const repos = useRepositories();
  const deployedCodes = Object.keys(PACKAGE_CATALOG);

  await repos.packages.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const existing = await txRepos.packages.listAll();
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
