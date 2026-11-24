import { writeAudit } from "@mindkid/audit";
import type { JsonRecord, JsonValue } from "@mindkid/db";
import { CODE_FEATURE_FLAGS, type FeatureFlagKey } from "@mindkid/shared";
import { invalidateGuestSeoCache } from "#server/utils/guest-seo-cache";
import { useOwnerRepositories } from "#server/utils/repositories";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ORPHAN_EXPIRES_MS = 365 * MS_PER_DAY;

export type FlagScope = "global" | "user_ids" | "percentage";

export interface FeatureFlagRecord {
  readonly key: string;
  readonly enabled: boolean;
  readonly scope: FlagScope;
  readonly scopeValue: JsonRecord | null;
  readonly defaultValue: boolean;
  readonly expiresAt: Date;
  readonly updatedByManagerId: number | null;
  readonly updateReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const inMemoryFlagOverrides = new Map<string, FeatureFlagRecord>();

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

export interface MergedFeatureFlag {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly scope: string;
  readonly scope_value: FeatureFlagScopeValue | null;
  readonly default_value: boolean;
  readonly safe_default_reason?: string;
  readonly expires_at: string;
  readonly is_expired: boolean;
  readonly days_expired: number;
  readonly is_orphan: boolean;
  readonly updated_by_manager_id: number | null;
  readonly update_reason: string | null;
  readonly updated_at: string | null;
}

export interface MergedFeatureFlagsResult {
  readonly flags: readonly MergedFeatureFlag[];
  readonly total: number;
}

export interface UpdateFeatureFlagParams {
  readonly reason: string;
  readonly enabled: boolean;
  readonly scope: FlagScope;
  readonly scopeValue?: FeatureFlagScopeValue | null;
  readonly managerId: number;
}

function normalizeScopeValue(
  raw: JsonRecord | null | undefined
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

function toScopeJsonRecord(
  scopeValue: FeatureFlagScopeValue | null | undefined
): JsonRecord | null {
  if (!scopeValue) {
    return null;
  }
  const record: Record<string, JsonValue | undefined> = {};
  for (const [k, v] of Object.entries(scopeValue)) {
    if (v !== undefined) {
      record[k] = v;
    }
  }
  return record;
}

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

export function isEnabled(
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
      return Promise.resolve(
        evaluateFlagScope(cached.enabled, cached.scope, cached.scopeValue, ctx)
      );
    }

    const row = inMemoryFlagOverrides.get(key);
    if (!row) {
      return Promise.resolve(safeDefault);
    }

    const normalizedScopeValue = normalizeScopeValue(row.scopeValue);

    flagCache.set(key, {
      enabled: row.enabled,
      scope: row.scope,
      scopeValue: normalizedScopeValue,
      expiresAt: Date.now() + 30_000,
    });

    return Promise.resolve(
      evaluateFlagScope(row.enabled, row.scope, normalizedScopeValue, ctx)
    );
  } catch {
    return Promise.resolve(safeDefault);
  }
}

export function invalidateFlagCache(key?: string): void {
  if (key) {
    flagCache.delete(key);
  } else {
    flagCache.clear();
  }
}

function buildCodeFlagItem(
  key: string,
  codeDef: (typeof CODE_FEATURE_FLAGS)[string],
  dbRow: FeatureFlagRecord | undefined,
  nowMs: number
): MergedFeatureFlag {
  const expiresAtIso = dbRow?.expiresAt
    ? dbRow.expiresAt.toISOString()
    : codeDef.expiresAt;
  const expiresAtMs = new Date(expiresAtIso).getTime();
  const isExpired = nowMs > expiresAtMs;
  const daysExpired = isExpired
    ? Math.floor((nowMs - expiresAtMs) / MS_PER_DAY)
    : 0;

  return {
    key,
    name: codeDef.name,
    description: codeDef.description,
    enabled: dbRow ? dbRow.enabled : codeDef.defaultValue,
    scope: dbRow ? dbRow.scope : "global",
    scope_value: dbRow ? normalizeScopeValue(dbRow.scopeValue) : null,
    default_value: codeDef.defaultValue,
    safe_default_reason: codeDef.safeDefaultReason,
    expires_at: expiresAtIso,
    is_expired: isExpired,
    days_expired: daysExpired,
    is_orphan: false,
    updated_by_manager_id: dbRow?.updatedByManagerId || null,
    update_reason: dbRow?.updateReason || null,
    updated_at: dbRow?.updatedAt?.toISOString() || null,
  };
}

function buildOrphanFlagItem(
  key: string,
  dbRow: FeatureFlagRecord,
  nowMs: number
): MergedFeatureFlag {
  const expiresAtMs = dbRow.expiresAt.getTime();
  const isExpired = nowMs > expiresAtMs;
  const daysExpired = isExpired
    ? Math.floor((nowMs - expiresAtMs) / MS_PER_DAY)
    : 0;

  return {
    key,
    name: `[Cờ mồ côi] ${key}`,
    description:
      "Cờ này tồn tại trong cơ sở dữ liệu nhưng không còn khai báo trong code",
    enabled: dbRow.enabled,
    scope: dbRow.scope,
    scope_value: normalizeScopeValue(dbRow.scopeValue),
    default_value: dbRow.defaultValue,
    expires_at: dbRow.expiresAt.toISOString(),
    is_expired: isExpired,
    days_expired: daysExpired,
    is_orphan: true,
    updated_by_manager_id: dbRow.updatedByManagerId,
    update_reason: dbRow.updateReason,
    updated_at: dbRow.updatedAt.toISOString(),
  };
}

export function listMergedFeatureFlags(
  nowMs: number = Date.now()
): Promise<MergedFeatureFlagsResult> {
  const dbRowMap = new Map(inMemoryFlagOverrides.entries());

  const mergedFlags: MergedFeatureFlag[] = [];

  for (const [key, codeDef] of Object.entries(CODE_FEATURE_FLAGS)) {
    const dbRow = dbRowMap.get(key);
    mergedFlags.push(buildCodeFlagItem(key, codeDef, dbRow, nowMs));
    dbRowMap.delete(key);
  }

  for (const [key, dbRow] of dbRowMap.entries()) {
    mergedFlags.push(buildOrphanFlagItem(key, dbRow, nowMs));
  }

  return Promise.resolve({
    flags: mergedFlags,
    total: mergedFlags.length,
  });
}

export async function updateFeatureFlag(
  key: string,
  params: UpdateFeatureFlagParams
): Promise<FeatureFlagRecord> {
  const codeDef = CODE_FEATURE_FLAGS[key];
  const defaultValue = codeDef ? codeDef.defaultValue : false;
  const expiresAt = codeDef
    ? new Date(codeDef.expiresAt)
    : new Date(Date.now() + ORPHAN_EXPIRES_MS);

  const repos = useOwnerRepositories();
  const existing = inMemoryFlagOverrides.get(key);
  const scopeRecord = toScopeJsonRecord(params.scopeValue);
  const now = new Date();

  const updatedRecord: FeatureFlagRecord = {
    key,
    enabled: params.enabled,
    scope: params.scope,
    scopeValue: scopeRecord,
    defaultValue: existing ? existing.defaultValue : defaultValue,
    expiresAt: existing ? existing.expiresAt : expiresAt,
    updatedByManagerId: params.managerId,
    updateReason: params.reason,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  inMemoryFlagOverrides.set(key, updatedRecord);

  invalidateFlagCache(key);
  await invalidateGuestSeoCache();

  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: params.managerId,
      action: "feature_flag_changed",
      reason: params.reason,
      entity_type: "feature_flag",
      entity_id: key,
      before_data: existing
        ? { enabled: existing.enabled, scope: existing.scope }
        : { enabled: defaultValue },
      after_data: {
        enabled: params.enabled,
        scope: params.scope,
        scope_value: scopeRecord,
      },
    });
  });

  return updatedRecord;
}
