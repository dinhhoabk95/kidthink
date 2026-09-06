import { writeAudit } from "@mindkid/audit";
import { featureFlags, getOwnerDb } from "@mindkid/db";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { CODE_FEATURE_FLAGS } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { invalidateFlagCache } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const patchFlagSchema = z.object({
  reason: z.string().min(10),
  enabled: z.boolean().optional().default(false),
  scope: z
    .enum(["global", "user_ids", "percentage"])
    .optional()
    .default("global"),
  scope_value: z.record(z.unknown()).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-FFA-03, BR-FLG-07: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền thay đổi cờ tính năng (BR-FFA-03)"
    );
  }

  const key = getRouterParam(event, "key");
  if (!key) {
    throw new NotFoundError("FLAG_NOT_FOUND");
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = patchFlagSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new AdminNoteRequiredError(
      "Đổi cờ tính năng bắt buộc lý do tối thiểu 10 ký tự (BR-FFA-01)"
    );
  }

  const { reason, enabled, scope, scope_value: scopeValue } = parsedResult.data;

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

  const managerId = manager.manager_id;

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
    if (!upd) {
      throw new InternalError("FLAG_UPDATE_FAILED");
    }
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
    if (!ins) {
      throw new InternalError("FLAG_INSERT_FAILED");
    }
    updatedRecord = ins;
  }

  // Invalidate local in-memory cache
  invalidateFlagCache(key);

  // BR-FFA-01, BR-FLG-04: Write audit_logs
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
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
  });

  return updatedRecord;
});
