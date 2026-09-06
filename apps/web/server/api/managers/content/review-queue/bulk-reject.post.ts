import { writeAudit } from "@mindkid/audit";
import { contentReviewLog, gameLevels, getOwnerDb, lessons } from "@mindkid/db";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const bulkRejectSchema = z.object({
  created_by_manager_id: z.number().int().positive(),
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = bulkRejectSchema.safeParse(raw);
  if (!parsedResult.success) {
    const issues = parsedResult.error.issues;
    if (issues.some((i) => i.path.includes("reason"))) {
      throw new AdminNoteRequiredError(
        "Từ chối bắt buộc lý do tối thiểu 10 ký tự (BR-CRQ-03)"
      );
    }
    throw new ValidationError("created_by_manager_id is required");
  }

  const { created_by_manager_id: createdByManagerId, reason } =
    parsedResult.data;

  const db = getOwnerDb();
  const rejectedIds: Array<{ type: string; id: number; code: string }> = [];

  // 1. Bulk reject game levels
  const levelsToReject = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      version: gameLevels.contentVersion,
    })
    .from(gameLevels)
    .where(
      and(
        eq(gameLevels.status, "in_review"),
        eq(gameLevels.createdByManagerId, createdByManagerId)
      )
    );

  for (const lvl of levelsToReject) {
    await db
      .update(gameLevels)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(gameLevels.id, lvl.id));

    await db.insert(contentReviewLog).values({
      entityType: "game_level",
      entityId: lvl.id,
      contentVersion: lvl.version,
      fromStatus: "in_review",
      toStatus: "rejected",
      actorManagerId: manager.manager_id,
      actorRole: (manager.role || "content_reviewer") as
        | "super_admin"
        | "content_reviewer",
      reason,
    });

    rejectedIds.push({ type: "game_level", id: lvl.id, code: lvl.code });
  }

  // 2. Bulk reject lessons
  const lessonsToReject = await db
    .select({
      id: lessons.id,
      code: lessons.code,
      version: lessons.contentVersion,
    })
    .from(lessons)
    .where(
      and(
        eq(lessons.status, "in_review"),
        eq(lessons.createdByManagerId, createdByManagerId)
      )
    );

  for (const les of lessonsToReject) {
    await db
      .update(lessons)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(lessons.id, les.id));

    await db.insert(contentReviewLog).values({
      entityType: "lesson",
      entityId: les.id,
      contentVersion: les.version,
      fromStatus: "in_review",
      toStatus: "rejected",
      actorManagerId: manager.manager_id,
      actorRole: (manager.role || "content_reviewer") as
        | "super_admin"
        | "content_reviewer",
      reason,
    });

    rejectedIds.push({ type: "lesson", id: les.id, code: les.code });
  }

  const managerId = manager.manager_id;
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_rejected",
      reason,
      entity_type: "bulk_review",
      entity_id: createdByManagerId.toString(),
      after_data: {
        rejected_count: rejectedIds.length,
        items: rejectedIds,
      },
    });
  });

  return {
    success: true,
    rejected_count: rejectedIds.length,
    items: rejectedIds,
  };
});
