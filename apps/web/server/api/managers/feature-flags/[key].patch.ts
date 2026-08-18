import {
  featureFlags,
  getOwnerDb,
  invalidateFlagCache,
  writeAudit,
} from "@mindkid/db";
import { CODE_FEATURE_FLAGS } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-FFA-03, BR-FLG-07: super_admin only
  if (manager.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message: "Chỉ super_admin mới có quyền thay đổi cờ tính năng (BR-FFA-03)",
    });
  }

  const key = getRouterParam(event, "key");
  if (!key) {
    throw createError({ statusCode: 404, statusMessage: "FLAG_NOT_FOUND" });
  }

  const body =
    (event.context?.body as Record<string, unknown>) ||
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    (await readBody(event).catch(() => ({})));

  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length < 10) {
    throw createError({
      statusCode: 422,
      statusMessage: "REASON_REQUIRED",
      message:
        "Đổi cờ tính năng bắt buộc lý do tối thiểu 10 ký tự (BR-FFA-01, BR-FLG-04)",
    });
  }

  const enabled = Boolean(body?.enabled);
  const scope = (body?.scope ||
    "global") as (typeof featureFlags.$inferInsert)["scope"];
  const scopeValue = (body?.scope_value as Record<string, unknown>) || null;

  const codeDef = CODE_FEATURE_FLAGS[key];
  const defaultValue = codeDef ? codeDef.defaultValue : false;
  const expiresAt = codeDef
    ? new Date(codeDef.expiresAt)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const db = getOwnerDb();
  const [existing] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, key));

  const managerId = manager.manager_id || manager.id || 1;

  let updatedRecord: typeof featureFlags.$inferSelect;
  if (existing) {
    const [upd] = await db
      .update(featureFlags)
      .set({
        enabled,
        scope,
        scopeValue,
        updatedByManagerId: managerId,
        updateReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.id, existing.id))
      .returning();
    updatedRecord = upd;
  } else {
    const [ins] = await db
      .insert(featureFlags)
      .values({
        key,
        enabled,
        scope,
        scopeValue,
        defaultValue,
        expiresAt,
        updatedByManagerId: managerId,
        updateReason: reason,
      })
      .returning();
    updatedRecord = ins;
  }

  // Invalidate local in-memory cache
  invalidateFlagCache(key);

  // BR-FFA-01, BR-FLG-04: Write audit_logs
  await writeAudit(db, {
    actor_type: "manager",
    actor_id: managerId,
    action: "feature_flag_changed",
    reason,
    entity_type: "feature_flag",
    entity_id: key,
    before_data: existing
      ? { enabled: existing.enabled, scope: existing.scope }
      : { enabled: defaultValue },
    after_data: { enabled, scope, scope_value: scopeValue },
  });

  return updatedRecord;
});
