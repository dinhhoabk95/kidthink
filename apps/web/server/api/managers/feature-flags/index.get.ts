import { featureFlags, getOwnerDb } from "@mindkid/db";
import { CODE_FEATURE_FLAGS } from "@mindkid/shared";
import { createError, defineEventHandler } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

export interface MergedFeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: string;
  scope_value: Record<string, unknown> | null;
  default_value: boolean;
  safe_default_reason?: string;
  expires_at: string;
  is_expired: boolean;
  days_expired: number;
  is_orphan: boolean;
  updated_by_manager_id: number | null;
  update_reason: string | null;
  updated_at: string | null;
}

function buildCodeFlagItem(
  key: string,
  codeDef: (typeof CODE_FEATURE_FLAGS)[string],
  dbRow: typeof featureFlags.$inferSelect | undefined,
  now: number
): MergedFeatureFlag {
  const expiresAtMs = new Date(
    dbRow?.expiresAt ? dbRow.expiresAt.toISOString() : codeDef.expiresAt
  ).getTime();
  const isExpired = now > expiresAtMs;
  const daysExpired = isExpired
    ? Math.floor((now - expiresAtMs) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    key,
    name: codeDef.name,
    description: codeDef.description,
    enabled: dbRow ? dbRow.enabled : codeDef.defaultValue,
    scope: dbRow ? dbRow.scope : "global",
    scope_value: dbRow
      ? (dbRow.scopeValue as Record<string, unknown> | null)
      : null,
    default_value: codeDef.defaultValue,
    safe_default_reason: codeDef.safeDefaultReason,
    expires_at: dbRow?.expiresAt
      ? dbRow.expiresAt.toISOString()
      : codeDef.expiresAt,
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
  dbRow: typeof featureFlags.$inferSelect,
  now: number
): MergedFeatureFlag {
  const expiresAtMs = dbRow.expiresAt.getTime();
  const isExpired = now > expiresAtMs;
  const daysExpired = isExpired
    ? Math.floor((now - expiresAtMs) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    key,
    name: `[Cờ mồ côi] ${key}`,
    description:
      "Cờ này tồn tại trong cơ sở dữ liệu nhưng không còn khai báo trong code",
    enabled: dbRow.enabled,
    scope: dbRow.scope,
    scope_value: dbRow.scopeValue as Record<string, unknown> | null,
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

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-FFA-03, BR-FLG-07: super_admin only, content_reviewer gets 403
  if (manager.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message:
        "Chỉ super_admin mới có quyền xem và quản lý cờ tính năng (BR-FFA-03)",
    });
  }

  const db = getOwnerDb();
  const dbRows = await db.select().from(featureFlags);
  const dbRowMap = new Map(dbRows.map((r) => [r.key, r]));

  const mergedFlags: MergedFeatureFlag[] = [];
  const now = Date.now();

  // 1. Process flags defined in code (BR-FFA-04: source of truth from code)
  for (const [key, codeDef] of Object.entries(CODE_FEATURE_FLAGS)) {
    const dbRow = dbRowMap.get(key);
    mergedFlags.push(buildCodeFlagItem(key, codeDef, dbRow, now));
    dbRowMap.delete(key);
  }

  // 2. Add orphan flags in DB but not in code (BR-FFA-04)
  for (const [key, dbRow] of dbRowMap.entries()) {
    mergedFlags.push(buildOrphanFlagItem(key, dbRow, now));
  }

  return {
    flags: mergedFlags,
    total: mergedFlags.length,
  };
});
