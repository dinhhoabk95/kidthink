import { errorLogs, getOwnerDb, writeAudit } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    // BR-ELV-06: super_admin only
    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message: "Chỉ super_admin mới có quyền xử lý nhật ký lỗi (BR-ELV-06)",
      });
    }

    const fingerprint = getRouterParam(event, "fingerprint");
    if (!fingerprint) {
      throw createError({
        statusCode: 404,
        statusMessage: "FINGERPRINT_NOT_FOUND",
      });
    }

    const body =
      (event.context?.body as Record<string, unknown>) ||
      ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
      (await readBody(event).catch(() => ({})));

    const status = (body?.status ||
      "resolved") as (typeof errorLogs.$inferInsert)["status"];
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

    const db = getOwnerDb();
    const managerId = manager.manager_id || manager.id || 1;

    // BR-ELV-07: Update all errors with this fingerprint
    await db
      .update(errorLogs)
      .set({
        status,
        resolvedNotes: notes,
        resolvedByManagerId: managerId,
        updatedAt: new Date(),
      })
      .where(eq(errorLogs.fingerprint, fingerprint));

    await writeAudit(db, {
      actor_type: "manager",
      actor_id: managerId,
      action: "error_group_status_changed",
      reason: notes || "Thay đổi trạng thái nhóm lỗi",
      entity_type: "error_group",
      entity_id: fingerprint,
      after_data: { status, notes },
    });

    return {
      success: true,
      fingerprint,
      status,
      notes,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
