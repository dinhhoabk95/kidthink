import { writeAudit } from "@mindkid/audit";
import { errorLogs, getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { getRouterParam } from "h3";
import { z } from "zod";
import { defineApiRoute } from "#server/utils/define-api-route";

const patchErrorLogSchema = z.object({
  status: z
    .enum(["open", "ack", "resolved", "new", "in_progress", "ignored"])
    .optional()
    .default("resolved"),
  notes: z.string().nullable().optional(),
});

type RawPatchStatus = z.infer<typeof patchErrorLogSchema>["status"];

function normalizeErrorGroupStatus(
  raw: RawPatchStatus | undefined
): "open" | "ack" | "resolved" {
  if (raw === "new" || raw === "open") {
    return "open";
  }
  if (raw === "in_progress" || raw === "ack") {
    return "ack";
  }
  return "resolved";
}

export default defineApiRoute({
  auth: "super_admin",
  body: patchErrorLogSchema,
  async handler({ event, auth, body }) {
    const fingerprint = getRouterParam(event, "fingerprint");
    if (!fingerprint) {
      throw new NotFoundError("FINGERPRINT_NOT_FOUND");
    }

    const status = normalizeErrorGroupStatus(body.status);
    const notes = body.notes ? body.notes.trim() : null;

    const db = getOwnerDb();
    const managerId = auth.manager_id;

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
  },
});
