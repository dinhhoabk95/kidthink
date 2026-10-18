import type { RecommendationItem } from "@mindkid/adaptive";
import {
  activities,
  collections,
  curricula,
  gameLevels,
  type getOwnerDb,
  lessons,
  libraryItems,
  userTagMap,
} from "@mindkid/db";
import { QuotaExceededError } from "@mindkid/errors/billing";
import { NotFoundError } from "@mindkid/errors/common";
import { CodeAlreadyExistsError } from "@mindkid/errors/content";
import { type AccessTier, TIER_ORDER, TIER_RANK } from "@mindkid/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { getGuestRecommendations } from "./recommendation.ts";

type LibraryDatabase = ReturnType<typeof getOwnerDb>;

export interface GetLibraryOptions {
  userId: number;
  entityType?: "game_level" | "lesson" | "curriculum" | "activity";
  collectionId?: number;
  tag?: string;
  q?: string;
  limit?: number;
  activeTier?: "free" | "login" | "standard" | "premium";
}

export interface LibraryItemPayload {
  entity_type: string;
  entity_id: number;
  code: string;
  title: string;
  thumbnail_emoji?: string;
  access_tier: string;
  is_locked: boolean;
  is_archived: boolean;
  status_label: string;
  collection_id?: number | null;
  note?: string | null;
  created_at: string;
  tags?: string[];
}

export async function getUserCollections(db: LibraryDatabase, userId: number) {
  const userCols = await db
    .select({
      id: collections.id,
      name: collections.name,
      position: collections.position,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(collections.position, collections.createdAt);

  const counts = await db
    .select({
      collectionId: libraryItems.collectionId,
      count: sql<number>`count(*)::int`,
    })
    .from(libraryItems)
    .where(eq(libraryItems.userId, userId))
    .groupBy(libraryItems.collectionId);

  const countMap = new Map<number, number>();
  for (const c of counts) {
    if (c.collectionId !== null) {
      countMap.set(c.collectionId, c.count);
    }
  }

  return userCols.map((col) => ({
    id: col.id,
    name: col.name,
    position: col.position,
    item_count: countMap.get(col.id) ?? 0,
    created_at: col.createdAt.toISOString(),
  }));
}

export async function createCollection(
  db: LibraryDatabase,
  userId: number,
  name: string
) {
  const [existingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collections)
    .where(eq(collections.userId, userId));

  const currentCount = existingCount?.count ?? 0;
  if (currentCount >= 20) {
    throw new QuotaExceededError(
      {
        quota_key: "collections",
        limit: 20,
        current: currentCount,
      },
      "Vượt quá giới hạn 20 bộ sưu tập cho phép."
    );
  }

  const [created] = await db
    .insert(collections)
    .values({
      userId,
      name: name.trim(),
      position: currentCount,
    })
    .returning({
      id: collections.id,
      name: collections.name,
      position: collections.position,
      createdAt: collections.createdAt,
    });

  return {
    id: created?.id,
    name: created?.name,
    position: created?.position,
    item_count: 0,
    created_at: created?.createdAt.toISOString(),
  };
}

export async function updateCollection(
  db: LibraryDatabase,
  params: {
    userId: number;
    collectionId: number;
    name?: string;
    position?: number;
  }
) {
  const patch: { name?: string; position?: number } = {};
  if (params.name !== undefined) {
    patch.name = params.name.trim();
  }
  if (params.position !== undefined) {
    patch.position = params.position;
  }

  const [updated] = await db
    .update(collections)
    .set(patch)
    .where(
      and(
        eq(collections.id, params.collectionId),
        eq(collections.userId, params.userId)
      )
    )
    .returning({
      id: collections.id,
      name: collections.name,
      position: collections.position,
      createdAt: collections.createdAt,
    });

  if (!updated) {
    throw new NotFoundError("Không tìm thấy bộ sưu tập.");
  }

  return {
    id: updated.id,
    name: updated.name,
    position: updated.position,
    created_at: updated.createdAt.toISOString(),
  };
}

export async function deleteCollection(
  db: LibraryDatabase,
  params: { userId: number; collectionId: number }
) {
  const [deleted] = await db
    .delete(collections)
    .where(
      and(
        eq(collections.id, params.collectionId),
        eq(collections.userId, params.userId)
      )
    )
    .returning({ id: collections.id });

  if (!deleted) {
    throw new NotFoundError("Không tìm thấy bộ sưu tập.");
  }

  return { success: true };
}

async function resolveEntityIdByCode(
  db: LibraryDatabase,
  entityType: "game_level" | "lesson" | "curriculum" | "activity",
  code: string
): Promise<number | null> {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return null;
  }
  if (entityType === "game_level") {
    const [row] = await db
      .select({ entityId: gameLevels.entityId })
      .from(gameLevels)
      .where(eq(gameLevels.code, normalizedCode))
      .orderBy(desc(gameLevels.contentVersion))
      .limit(1);
    return row?.entityId ?? null;
  }
  if (entityType === "lesson") {
    const [row] = await db
      .select({ entityId: lessons.entityId })
      .from(lessons)
      .where(eq(lessons.code, normalizedCode))
      .orderBy(desc(lessons.contentVersion))
      .limit(1);
    return row?.entityId ?? null;
  }
  if (entityType === "curriculum") {
    const [row] = await db
      .select({ entityId: curricula.entityId })
      .from(curricula)
      .where(eq(curricula.code, normalizedCode))
      .orderBy(desc(curricula.contentVersion))
      .limit(1);
    return row?.entityId ?? null;
  }
  const [row] = await db
    .select({ entityId: activities.entityId })
    .from(activities)
    .where(eq(activities.code, normalizedCode))
    .orderBy(desc(activities.contentVersion))
    .limit(1);
  return row?.entityId ?? null;
}

export async function addLibraryItem(
  db: LibraryDatabase,
  params: {
    userId: number;
    entityType: "game_level" | "lesson" | "curriculum" | "activity";
    entityId?: number;
    code?: string;
    collectionId?: number | null;
    note?: string | null;
  }
) {
  let resolvedEntityId = params.entityId;
  if (resolvedEntityId === undefined && params.code) {
    const foundId = await resolveEntityIdByCode(
      db,
      params.entityType,
      params.code
    );
    if (foundId !== null) {
      resolvedEntityId = foundId;
    }
  }
  if (resolvedEntityId === undefined || resolvedEntityId <= 0) {
    throw new NotFoundError("Không tìm thấy nội dung cần lưu vào thư viện.");
  }

  const [existing] = await db
    .select({
      id: libraryItems.userId,
    })
    .from(libraryItems)
    .where(
      and(
        eq(libraryItems.userId, params.userId),
        eq(libraryItems.entityType, params.entityType),
        eq(libraryItems.entityId, resolvedEntityId)
      )
    );

  if (existing) {
    throw new CodeAlreadyExistsError("Mục này đã tồn tại trong thư viện.");
  }

  const [created] = await db
    .insert(libraryItems)
    .values({
      userId: params.userId,
      entityType: params.entityType,
      entityId: resolvedEntityId,
      collectionId: params.collectionId ?? null,
      note: params.note?.trim() ?? null,
    })
    .returning();

  return created;
}

export const saveLibraryItem = addLibraryItem;

export async function removeLibraryItem(
  db: LibraryDatabase,
  params: {
    userId: number;
    entityType: "game_level" | "lesson" | "curriculum" | "activity";
    entityId: number;
  }
) {
  await db
    .delete(libraryItems)
    .where(
      and(
        eq(libraryItems.userId, params.userId),
        eq(libraryItems.entityType, params.entityType),
        eq(libraryItems.entityId, params.entityId)
      )
    );

  await db
    .delete(userTagMap)
    .where(
      and(
        eq(userTagMap.userId, params.userId),
        eq(userTagMap.entityType, params.entityType),
        eq(userTagMap.entityId, params.entityId)
      )
    );
}

interface ResolvedEntityMeta {
  code: string;
  title: string;
  thumbnailEmoji?: string;
  accessTier: string;
  isArchived: boolean;
}

async function resolveGameLevelMeta(
  db: LibraryDatabase,
  entityId: number
): Promise<ResolvedEntityMeta> {
  const levels = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      accessTier: gameLevels.accessTier,
      status: gameLevels.status,
    })
    .from(gameLevels)
    .where(eq(gameLevels.entityId, entityId))
    .orderBy(desc(gameLevels.contentVersion));

  const published = levels.find((l) => l.status === "published");
  const active = published ?? levels[0];
  return {
    code: active?.code ?? `game_level-${entityId}`,
    title: active?.title ?? `Trò chơi #${entityId}`,
    thumbnailEmoji: active?.thumbnailEmoji ?? undefined,
    accessTier: active?.accessTier ?? "free",
    isArchived: !published && levels.some((l) => l.status === "archived"),
  };
}

async function resolveLessonMeta(
  db: LibraryDatabase,
  entityId: number
): Promise<ResolvedEntityMeta> {
  const les = await db
    .select({
      code: lessons.code,
      title: lessons.title,
      accessTier: lessons.accessTier,
      status: lessons.status,
    })
    .from(lessons)
    .where(eq(lessons.entityId, entityId))
    .orderBy(desc(lessons.contentVersion));

  const published = les.find((l) => l.status === "published");
  const active = published ?? les[0];
  return {
    code: active?.code ?? `lesson-${entityId}`,
    title: active?.title ?? `Bài học #${entityId}`,
    accessTier: active?.accessTier ?? "free",
    isArchived: !published && les.some((l) => l.status === "archived"),
  };
}

async function resolveCurriculumMeta(
  db: LibraryDatabase,
  entityId: number
): Promise<ResolvedEntityMeta> {
  const currs = await db
    .select({
      code: curricula.code,
      title: curricula.title,
      accessTier: curricula.accessTier,
      status: curricula.status,
    })
    .from(curricula)
    .where(eq(curricula.entityId, entityId))
    .orderBy(desc(curricula.contentVersion));

  const published = currs.find((c) => c.status === "published");
  const active = published ?? currs[0];
  return {
    code: active?.code ?? `curriculum-${entityId}`,
    title: active?.title ?? `Chương trình #${entityId}`,
    accessTier: active?.accessTier ?? "free",
    isArchived: !published && currs.some((c) => c.status === "archived"),
  };
}

async function resolveActivityMeta(
  db: LibraryDatabase,
  entityId: number
): Promise<ResolvedEntityMeta> {
  const acts = await db
    .select({
      code: activities.code,
      title: activities.title,
      accessTier: activities.accessTier,
      status: activities.status,
    })
    .from(activities)
    .where(eq(activities.entityId, entityId))
    .orderBy(desc(activities.contentVersion));

  const published = acts.find((a) => a.status === "published");
  const active = published ?? acts[0];
  return {
    code: active?.code ?? `activity-${entityId}`,
    title: active?.title ?? `Hoạt động #${entityId}`,
    accessTier: active?.accessTier ?? "free",
    isArchived: !published && acts.some((a) => a.status === "archived"),
  };
}

function resolveEntityMeta(
  db: LibraryDatabase,
  entityType: string,
  entityId: number
): Promise<ResolvedEntityMeta> {
  switch (entityType) {
    case "game_level":
      return resolveGameLevelMeta(db, entityId);
    case "lesson":
      return resolveLessonMeta(db, entityId);
    case "curriculum":
      return resolveCurriculumMeta(db, entityId);
    case "activity":
      return resolveActivityMeta(db, entityId);
    default:
      return Promise.resolve({
        code: `${entityType}-${entityId}`,
        title: `Nội dung #${entityId}`,
        accessTier: "free",
        isArchived: false,
      });
  }
}

export async function getUserLibrary(
  db: LibraryDatabase,
  options: GetLibraryOptions
) {
  const conditions = [eq(libraryItems.userId, options.userId)];

  if (options.entityType) {
    conditions.push(eq(libraryItems.entityType, options.entityType));
  }
  if (options.collectionId !== undefined) {
    conditions.push(eq(libraryItems.collectionId, options.collectionId));
  }

  const items = await db
    .select({
      entityType: libraryItems.entityType,
      entityId: libraryItems.entityId,
      collectionId: libraryItems.collectionId,
      note: libraryItems.note,
      createdAt: libraryItems.createdAt,
    })
    .from(libraryItems)
    .where(and(...conditions))
    .orderBy(desc(libraryItems.createdAt))
    .limit(Math.min(options.limit ?? 100, 100));

  const highestTier: AccessTier = options.activeTier ?? "free";
  const accessibleTiers = TIER_ORDER.filter(
    (tier) => TIER_RANK[tier] <= TIER_RANK[highestTier]
  );
  const result: LibraryItemPayload[] = [];
  const qLower = options.q?.toLowerCase().trim();

  for (const item of items) {
    const meta = await resolveEntityMeta(db, item.entityType, item.entityId);

    if (
      qLower &&
      !(
        meta.title.toLowerCase().includes(qLower) ||
        meta.code.toLowerCase().includes(qLower)
      )
    ) {
      continue;
    }

    const isLocked = !accessibleTiers.includes(
      meta.accessTier as "free" | "login" | "standard" | "premium"
    );

    result.push({
      entity_type: item.entityType,
      entity_id: item.entityId,
      code: meta.code,
      title: meta.title,
      thumbnail_emoji: meta.thumbnailEmoji,
      access_tier: meta.accessTier,
      is_locked: isLocked,
      is_archived: meta.isArchived,
      status_label: meta.isArchived ? "Không còn khả dụng" : "Khả dụng",
      collection_id: item.collectionId,
      note: item.note,
      created_at: item.createdAt.toISOString(),
    });
  }

  let recommendations: RecommendationItem[] = [];
  if (result.length === 0 && !options.collectionId && !options.q) {
    const recs = await getGuestRecommendations(db, { limit: 5 });
    recommendations = recs.primary
      ? [recs.primary, ...recs.alternatives]
      : recs.alternatives;
  }

  return {
    items: result,
    total: result.length,
    recommendations,
  };
}
