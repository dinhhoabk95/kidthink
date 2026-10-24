import {
  activities,
  contentAssetRefs,
  contentImages,
  gameLevels,
  getOwnerDb,
  lessons,
  seoPages,
  worksheets,
} from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { eq, inArray } from "drizzle-orm";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const AssetUsageQuerySchema = z.object({
  ref: z.string().optional(),
});

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
const TRAILING_USAGE_REGEX = /\/usage$/;
const POSITIVE_INT_REGEX = /^\d+$/;

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
        title: gameLevels.title,
      })
      .from(gameLevels)
      .where(eq(gameLevels.id, refRow.entityId));
    return lvl
      ? {
          entity_type: "game_level",
          code: lvl.code,
          version: lvl.version,
          status: lvl.status,
          title: lvl.title,
        }
      : null;
  }
  if (refRow.entityType === "lesson") {
    const [les] = await db
      .select({
        code: lessons.code,
        version: lessons.contentVersion,
        status: lessons.status,
        title: lessons.title,
      })
      .from(lessons)
      .where(eq(lessons.id, refRow.entityId));
    return les
      ? {
          entity_type: "lesson",
          code: les.code,
          version: les.version,
          status: les.status,
          title: les.title,
        }
      : null;
  }
  if (refRow.entityType === "activity") {
    const [act] = await db
      .select({
        code: activities.code,
        version: activities.contentVersion,
        status: activities.status,
        title: activities.title,
      })
      .from(activities)
      .where(eq(activities.id, refRow.entityId));
    return act
      ? {
          entity_type: "activity",
          code: act.code,
          version: act.version,
          status: act.status,
          title: act.title,
        }
      : null;
  }
  if (refRow.entityType === "worksheet") {
    const [ws] = await db
      .select({
        code: worksheets.code,
        version: worksheets.contentVersion,
        status: worksheets.status,
        title: worksheets.title,
      })
      .from(worksheets)
      .where(eq(worksheets.id, refRow.entityId));
    return ws
      ? {
          entity_type: "worksheet",
          code: ws.code,
          version: ws.version,
          status: ws.status,
          title: ws.title,
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

async function expandCandidateAssetRefs(
  db: ReturnType<typeof getOwnerDb>,
  assetRef: string
): Promise<{ resolvedAssetRef: string; candidateRefs: string[] }> {
  let resolvedAssetRef = assetRef;
  const candidateRefs: string[] = [assetRef];

  if (!POSITIVE_INT_REGEX.test(assetRef)) {
    return { resolvedAssetRef, candidateRefs };
  }

  const numericId = Number(assetRef);
  if (!(Number.isSafeInteger(numericId) && numericId > 0)) {
    return { resolvedAssetRef, candidateRefs };
  }

  const [imageRow] = await db
    .select({
      storagePath: contentImages.storagePath,
    })
    .from(contentImages)
    .where(eq(contentImages.id, numericId));

  if (imageRow?.storagePath) {
    const normalizedPath = imageRow.storagePath.replace(
      LEADING_SLASHES_REGEX,
      ""
    );
    resolvedAssetRef = normalizedPath;
    if (!candidateRefs.includes(normalizedPath)) {
      candidateRefs.push(normalizedPath);
    }
    if (!candidateRefs.includes(imageRow.storagePath)) {
      candidateRefs.push(imageRow.storagePath);
    }
  }

  return { resolvedAssetRef, candidateRefs };
}

export default defineEventHandler(
  async (event): Promise<AssetUsageResponse> => {
    requireManagerSession(event);

    const parsedQuery = AssetUsageQuerySchema.safeParse(getQuery(event));
    const paramRef = getRouterParam(event, "ref")?.replace(
      TRAILING_USAGE_REGEX,
      ""
    );
    const rawRef = (parsedQuery.success && parsedQuery.data.ref) || paramRef;

    if (!rawRef) {
      throw new ValidationError("Asset reference (ref) is required");
    }

    const assetRef = decodeURIComponent(rawRef)
      .replace(TRAILING_USAGE_REGEX, "")
      .replace(LEADING_SLASHES_REGEX, "");
    const db = getOwnerDb();

    const { resolvedAssetRef, candidateRefs } = await expandCandidateAssetRefs(
      db,
      assetRef
    );

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
      .where(inArray(contentAssetRefs.assetRef, candidateRefs))
      .limit(200);

    const usedBy: AssetUsageItem[] = [];
    const seenKeys = new Set<string>();

    for (const refRow of refs) {
      const item = await resolveUsageItem(db, refRow);
      if (item) {
        const dedupeKey = `${item.entity_type}:${item.code}:${item.version}`;
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          usedBy.push(item);
        }
      }
    }

    const isUsedInPublished = usedBy.some(
      (item) => item.status === "published"
    );
    const canDelete = !isUsedInPublished;
    const blockReason = isUsedInPublished ? "used_by_published" : null;

    return {
      asset_ref: resolvedAssetRef,
      used_by: usedBy,
      can_delete: canDelete,
      block_reason: blockReason,
    };
  }
);
