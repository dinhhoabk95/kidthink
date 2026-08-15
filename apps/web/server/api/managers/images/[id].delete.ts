import {
  contentAssetRefs,
  contentImages,
  type DatabaseOwner,
  gameLevels,
  getOwnerDb,
  lessons,
  seoPages,
  worksheets,
  writeAudit,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

interface PublishedUsageRef {
  type: string;
  code: string;
  version?: number;
  status?: string;
}

async function checkRefRowPublished(
  db: DatabaseOwner,
  refRow: { entityType: string; entityId: number }
): Promise<PublishedUsageRef | null> {
  if (refRow.entityType === "game_level") {
    const [lvl] = await db
      .select({
        code: gameLevels.code,
        version: gameLevels.contentVersion,
        status: gameLevels.status,
      })
      .from(gameLevels)
      .where(eq(gameLevels.id, refRow.entityId));
    if (lvl?.status === "published") {
      return {
        type: "game_level",
        code: lvl.code,
        version: lvl.version,
        status: lvl.status,
      };
    }
  } else if (refRow.entityType === "lesson") {
    const [les] = await db
      .select({
        code: lessons.code,
        version: lessons.contentVersion,
        status: lessons.status,
      })
      .from(lessons)
      .where(eq(lessons.id, refRow.entityId));
    if (les?.status === "published") {
      return {
        type: "lesson",
        code: les.code,
        version: les.version,
        status: les.status,
      };
    }
  } else if (refRow.entityType === "worksheet") {
    const [ws] = await db
      .select({
        code: worksheets.code,
        version: worksheets.contentVersion,
        status: worksheets.status,
      })
      .from(worksheets)
      .where(eq(worksheets.id, refRow.entityId));
    if (ws?.status === "published") {
      return {
        type: "worksheet",
        code: ws.code,
        version: ws.version,
        status: ws.status,
      };
    }
  } else if (refRow.entityType === "seo_page") {
    const [sp] = await db
      .select({
        slug: seoPages.slug,
        version: seoPages.contentVersion,
        status: seoPages.status,
      })
      .from(seoPages)
      .where(eq(seoPages.id, refRow.entityId));
    if (sp?.status === "published") {
      return {
        type: "seo_page",
        code: sp.slug,
        version: sp.version,
        status: sp.status,
      };
    }
  }
  return null;
}

async function findPublishedUsage(
  db: DatabaseOwner,
  storagePath: string
): Promise<PublishedUsageRef[]> {
  const usedBy: PublishedUsageRef[] = [];
  const refs = await db
    .select()
    .from(contentAssetRefs)
    .where(eq(contentAssetRefs.assetRef, storagePath))
    .limit(50);

  for (const refRow of refs) {
    const usage = await checkRefRowPublished(db, refRow);
    if (usage) {
      usedBy.push(usage);
    }
  }

  return usedBy;
}

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

    // Check if used by published content via dedicated reverse index (BR-AUT2-01, BR-AUT2-03, D-KB)
    const usedBy = await findPublishedUsage(db, imageRecord.storagePath);

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
    await db
      .delete(contentAssetRefs)
      .where(eq(contentAssetRefs.assetRef, imageRecord.storagePath));

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
