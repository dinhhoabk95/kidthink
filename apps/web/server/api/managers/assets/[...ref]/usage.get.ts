import {
  contentAssetRefs,
  gameLevels,
  getOwnerDb,
  lessons,
  seoPages,
  worksheets,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export interface AssetUsageItem {
  entity_type: string;
  code: string;
  version: number;
  status: string;
  title: string;
}

export interface AssetUsageResponse {
  asset_ref: string;
  used_by: AssetUsageItem[];
  can_delete: boolean;
  block_reason: string | null;
}

const LEADING_SLASHES_REGEX = /^\/+/;

async function resolveUsageItem(
  db: ReturnType<typeof getOwnerDb>,
  refRow: { entityType: string; entityId: number }
): Promise<AssetUsageItem | null> {
  if (refRow.entityType === "game_level") {
    const [lvl] = await db
      .select({
        code: gameLevels.code,
        version: gameLevels.contentVersion,
        status: gameLevels.status,
        titleVi: gameLevels.titleVi,
      })
      .from(gameLevels)
      .where(eq(gameLevels.id, refRow.entityId));
    return lvl
      ? {
          entity_type: "game_level",
          code: lvl.code,
          version: lvl.version,
          status: lvl.status,
          title: lvl.titleVi,
        }
      : null;
  }
  if (refRow.entityType === "lesson") {
    const [les] = await db
      .select({
        code: lessons.code,
        version: lessons.contentVersion,
        status: lessons.status,
        titleVi: lessons.titleVi,
      })
      .from(lessons)
      .where(eq(lessons.id, refRow.entityId));
    return les
      ? {
          entity_type: "lesson",
          code: les.code,
          version: les.version,
          status: les.status,
          title: les.titleVi,
        }
      : null;
  }
  if (refRow.entityType === "worksheet") {
    const [ws] = await db
      .select({
        code: worksheets.code,
        version: worksheets.contentVersion,
        status: worksheets.status,
        titleVi: worksheets.titleVi,
      })
      .from(worksheets)
      .where(eq(worksheets.id, refRow.entityId));
    return ws
      ? {
          entity_type: "worksheet",
          code: ws.code,
          version: ws.version,
          status: ws.status,
          title: ws.titleVi,
        }
      : null;
  }
  if (refRow.entityType === "seo_page") {
    const [sp] = await db
      .select({
        slug: seoPages.slug,
        version: seoPages.contentVersion,
        status: seoPages.status,
        title: seoPages.title,
      })
      .from(seoPages)
      .where(eq(seoPages.id, refRow.entityId));
    return sp
      ? {
          entity_type: "seo_page",
          code: sp.slug,
          version: sp.version,
          status: sp.status,
          title: sp.title,
        }
      : null;
  }
  return null;
}

export default defineEventHandler(
  async (event): Promise<AssetUsageResponse> => {
    try {
      await requireManagerSession(event);

      const query = getQuery(event);
      const paramRef = getRouterParam(event, "ref");
      const rawRef = (query.ref as string) || paramRef;

      if (!rawRef) {
        throw createError({
          statusCode: 422,
          statusMessage: "VALIDATION_FAILED",
          message: "Asset reference (ref) is required",
        });
      }

      const assetRef = decodeURIComponent(rawRef).replace(
        LEADING_SLASHES_REGEX,
        ""
      );
      const db = getOwnerDb();

      // Query reverse asset index table (BR-AUT2-03: P95 < 200ms)
      const refs = await db
        .select({
          id: contentAssetRefs.id,
          entityType: contentAssetRefs.entityType,
          entityId: contentAssetRefs.entityId,
          assetKind: contentAssetRefs.assetKind,
          assetRef: contentAssetRefs.assetRef,
        })
        .from(contentAssetRefs)
        .where(eq(contentAssetRefs.assetRef, assetRef))
        .limit(200);

      const usedBy: AssetUsageItem[] = [];

      for (const refRow of refs) {
        const item = await resolveUsageItem(db, refRow);
        if (item) {
          usedBy.push(item);
        }
      }

      const isUsedInPublished = usedBy.some(
        (item) => item.status === "published"
      );
      const canDelete = !isUsedInPublished;
      const blockReason = isUsedInPublished ? "used_by_published" : null;

      return {
        asset_ref: assetRef,
        used_by: usedBy,
        can_delete: canDelete,
        block_reason: blockReason,
      };
    } catch (err) {
      return respondToManagerAuthError(event, err);
    }
  }
);
