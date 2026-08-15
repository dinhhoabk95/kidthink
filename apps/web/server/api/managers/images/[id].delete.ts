import {
  contentImages,
  gameLevels,
  getOwnerDb,
  lessons,
  writeAudit,
} from "@kidthink/db";
import { and, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);
    const idParam = getRouterParam(event, "id");
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 404, statusMessage: "IMAGE_NOT_FOUND" });
    }

    const db = getOwnerDb();
    const [imageRecord] = await db
      .select()
      .from(contentImages)
      .where(eq(contentImages.id, id));

    if (!imageRecord) {
      throw createError({ statusCode: 404, statusMessage: "IMAGE_NOT_FOUND" });
    }

    // Check if used by published content (BR-IMG-07, BR-AST-02)
    const usedBy: Array<{ type: string; code: string }> = [];

    const pathPattern = `%${imageRecord.storagePath}%`;
    const publishedLevels = await db
      .select({ code: gameLevels.code })
      .from(gameLevels)
      .where(
        and(
          eq(gameLevels.status, "published"),
          sql`${gameLevels.contentPack}::text LIKE ${pathPattern}`
        )
      )
      .limit(5);

    for (const lvl of publishedLevels) {
      usedBy.push({ type: "game_level", code: lvl.code });
    }

    const publishedLessons = await db
      .select({ code: lessons.code })
      .from(lessons)
      .where(
        and(
          eq(lessons.status, "published"),
          sql`${lessons.guideVi} LIKE ${pathPattern}`
        )
      )
      .limit(5);

    for (const les of publishedLessons) {
      usedBy.push({ type: "lesson", code: les.code });
    }

    if (usedBy.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "CONTENT_IN_USE",
        message:
          "Cannot delete image that is currently in use by published content",
        data: {
          used_by: usedBy,
        },
      });
    }

    await db.delete(contentImages).where(eq(contentImages.id, id));

    const managerId = manager.manager_id || manager.id || 1;
    await writeAudit(db, {
      actor_type: "manager",
      actor_id: managerId,
      action: "image_deleted",
      reason: "Xoá ảnh không còn sử dụng",
      entity_type: "content_image",
      entity_id: id.toString(),
      before_data: {
        path: imageRecord.storagePath,
        owner_type: imageRecord.ownerType,
        owner_id: imageRecord.ownerId,
      },
    });

    return { success: true };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
