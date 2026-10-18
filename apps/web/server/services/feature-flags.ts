import { featureFlags, getOwnerDb } from "@mindkid/db";
import { CODE_FEATURE_FLAGS, type FeatureFlagKey } from "@mindkid/shared";
import { eq } from "drizzle-orm";

export interface FlagContext {
  userId?: number;
  user_id?: number;
}

export interface FeatureFlagScopeValue {
  readonly user_ids?: readonly number[];
  readonly percentage?: number;
  readonly [key: string]:
    | string
    | number
    | boolean
    | readonly number[]
    | readonly string[]
    | null
    | undefined;
}

function normalizeScopeValue(
  raw: object | null | undefined
): FeatureFlagScopeValue | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const userIdsRaw = Reflect.get(raw, "user_ids");
  const pctRaw = Reflect.get(raw, "percentage");
  const userIds = Array.isArray(userIdsRaw)
    ? userIdsRaw.filter((item): item is number => typeof item === "number")
    : undefined;
  const percentage =
    typeof pctRaw === "number" && Number.isFinite(pctRaw) ? pctRaw : undefined;
  return {
    ...(userIds === undefined ? {} : { user_ids: userIds }),
    ...(percentage === undefined ? {} : { percentage }),
  };
}

// In-memory short cache (TTL 30s)
const flagCache = new Map<
  string,
  {
    enabled: boolean;
    scope: string;
    scopeValue: FeatureFlagScopeValue | null;
    expiresAt: number;
  }
>();

export function evaluateFlagScope(
  enabled: boolean,
  scope: string,
  scopeValue: FeatureFlagScopeValue | null,
  ctx?: FlagContext
): boolean {
  if (!enabled) {
    return false;
  }
  if (scope === "global") {
    return true;
  }

  const effectiveUserId = ctx?.user_id ?? ctx?.userId;

  if (scope === "user_ids") {
    if (effectiveUserId === undefined) {
      return false;
    }
    const allowed = Array.isArray(scopeValue?.user_ids)
      ? scopeValue.user_ids
      : [];
    return allowed.includes(effectiveUserId);
  }

  if (scope === "percentage") {
    const pct =
      typeof scopeValue?.percentage === "number" ? scopeValue.percentage : 0;
    const userId = effectiveUserId ?? 0;
    return userId % 100 < pct;
  }

  return enabled;
}

export async function isEnabled(
  key: FeatureFlagKey | string,
  ctx?: FlagContext
): Promise<boolean> {
  const codeDef = CODE_FEATURE_FLAGS[key];
  if (!codeDef) {
    console.warn(
      `[feature-flags] Unknown flag key "${key}"; returning safe default false (BR-FLG-02).`
    );
  }
  const safeDefault = codeDef ? codeDef.defaultValue : false;

  try {
    const cached = flagCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return evaluateFlagScope(
        cached.enabled,
        cached.scope,
        cached.scopeValue,
        ctx
      );
    }

    const db = getOwnerDb();
    const [row] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key));

    if (!row) {
      return safeDefault;
    }

    const normalizedScopeValue = normalizeScopeValue(
      typeof row.scopeValue === "object" ? row.scopeValue : null
    );

    flagCache.set(key, {
      enabled: row.enabled,
      scope: row.scope,
      scopeValue: normalizedScopeValue,
      expiresAt: Date.now() + 30_000,
    });

    return evaluateFlagScope(row.enabled, row.scope, normalizedScopeValue, ctx);
  } catch {
    // If DB or cache down, return safe default (BR-FLG-02)
    return safeDefault;
  }
}

export function invalidateFlagCache(key?: string): void {
  if (key) {
    flagCache.delete(key);
  } else {
    flagCache.clear();
  }
}
