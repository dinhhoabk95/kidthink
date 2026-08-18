import { CODE_FEATURE_FLAGS, type FeatureFlagKey } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { getOwnerDb } from "../client.ts";
import { featureFlags } from "../schema/ops.ts";

export interface FlagContext {
  userId?: number;
}

// In-memory short cache (TTL 30s)
const flagCache = new Map<
  string,
  {
    enabled: boolean;
    scope: string;
    scopeValue: Record<string, unknown> | null;
    expiresAt: number;
  }
>();

function evaluateFlagScope(
  enabled: boolean,
  scope: string,
  scopeValue: Record<string, unknown> | null,
  ctx?: FlagContext
): boolean {
  if (!enabled) {
    return false;
  }
  if (scope === "global") {
    return true;
  }

  if (scope === "user_ids") {
    if (!ctx?.userId) {
      return false;
    }
    const allowed = Array.isArray(scopeValue?.user_ids)
      ? (scopeValue?.user_ids as number[])
      : [];
    return allowed.includes(ctx.userId);
  }

  if (scope === "percentage") {
    const pct =
      typeof scopeValue?.percentage === "number" ? scopeValue.percentage : 0;
    const userId = ctx?.userId ?? 0;
    return userId % 100 < pct;
  }

  return enabled;
}

export async function isEnabled(
  key: FeatureFlagKey | string,
  ctx?: FlagContext
): Promise<boolean> {
  const codeDef = CODE_FEATURE_FLAGS[key];
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

    flagCache.set(key, {
      enabled: row.enabled,
      scope: row.scope,
      scopeValue: row.scopeValue as Record<string, unknown> | null,
      expiresAt: Date.now() + 30_000,
    });

    return evaluateFlagScope(
      row.enabled,
      row.scope,
      row.scopeValue as Record<string, unknown> | null,
      ctx
    );
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
