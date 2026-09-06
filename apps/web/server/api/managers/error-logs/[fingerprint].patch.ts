import { writeAudit } from "@mindkid/audit";
import { errorLogs, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { NotFoundError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const patchErrorLogSchema = z.object({
  status: z
    .enum(["new", "in_progress", "resolved", "ignored"])
    .optional()
    .default("resolved"),
  notes: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-ELV-06: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xử lý nhật ký lỗi (BR-ELV-06)"
    );
  }

  const fingerprint = getRouterParam(event, "fingerprint");
  if (!fingerprint) {
    throw new NotFoundError("FINGERPRINT_NOT_FOUND");
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsed = patchErrorLogSchema.parse(raw);
  const status = parsed.status as (typeof errorLogs.$inferInsert)["status"];
  const notes = parsed.notes ? parsed.notes.trim() : null;

  const db = getOwnerDb();
  const managerId = manager.manager_id;

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

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "feature_flag_changed",
      reason: notes || "Thay đổi trạng thái nhóm lỗi",
      entity_type: "error_group",
      entity_id: fingerprint,
      after_data: { status, notes },
    });
  });

  return {
    success: true,
    fingerprint,
    status,
    notes,
  };
});
