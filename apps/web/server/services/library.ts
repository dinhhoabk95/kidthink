import {
  activities,
  collections,
  curricula,
  gameLevels,
  lessons,
  libraryItems,
  userTagMap,
} from "@mindkid/db";
import { type AccessTier, TIER_ORDER, TIER_RANK } from "@mindkid/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getGuestRecommendations } from "./recommendation.ts";

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

export async function getUserCollections(
  db: PostgresJsDatabase<Record<string, unknown>>,
  userId: number
) {
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
  db: PostgresJsDatabase<Record<string, unknown>>,
  userId: number,
  name: string
) {
  const [existingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collections)
    .where(eq(collections.userId, userId));

  if ((existingCount?.count ?? 0) >= 20) {
    const err = new Error("Vượt quá giới hạn 20 bộ sưu tập cho phép.");
    (err as unknown as { statusCode: number; code: string }).statusCode = 402;
    (err as unknown as { statusCode: number; code: string }).code =
      "COLLECTION_LIMIT_EXCEEDED";
    throw err;
  }

  const [created] = await db
    .insert(collections)
    .values({
      userId,
      name: name.trim(),
      position: existingCount?.count ?? 0,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
  params: {
    userId: number;
    collectionId: number;
    name?: string;
    position?: number;
  }
) {
  const patch: Record<string, unknown> = {};
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
    const err = new Error("Không tìm thấy bộ sưu tập.");
    (err as unknown as { statusCode: number; code: string }).statusCode = 404;
    (err as unknown as { statusCode: number; code: string }).code =
      "COLLECTION_NOT_FOUND";
    throw err;
  }

  return {
    id: updated.id,
    name: updated.name,
    position: updated.position,
    created_at: updated.createdAt.toISOString(),
  };
}

export async function deleteCollection(
  db: PostgresJsDatabase<Record<string, unknown>>,
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
    const err = new Error("Không tìm thấy bộ sưu tập.");
    (err as unknown as { statusCode: number; code: string }).statusCode = 404;
    (err as unknown as { statusCode: number; code: string }).code =
      "COLLECTION_NOT_FOUND";
    throw err;
  }

  return { success: true };
}

export async function addLibraryItem(
  db: PostgresJsDatabase<Record<string, unknown>>,
  params: {
    userId: number;
    entityType: "game_level" | "lesson" | "curriculum" | "activity";
    entityId: number;
    collectionId?: number | null;
    note?: string | null;
  }
) {
  const [existing] = await db
    .select({
      id: libraryItems.userId,
    })
    .from(libraryItems)
    .where(
      and(
        eq(libraryItems.userId, params.userId),
        eq(libraryItems.entityType, params.entityType),
        eq(libraryItems.entityId, params.entityId)
      )
    );

  if (existing) {
    const err = new Error("Mục này đã tồn tại trong thư viện.");
    (err as unknown as { statusCode: number; code: string }).statusCode = 409;
    (err as unknown as { statusCode: number; code: string }).code =
      "DUPLICATE_LIBRARY_ITEM";
    throw err;
  }

  const [created] = await db
    .insert(libraryItems)
    .values({
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      collectionId: params.collectionId ?? null,
      note: params.note?.trim() ?? null,
    })
    .returning();

  return created;
}

export const saveLibraryItem = addLibraryItem;

export async function removeLibraryItem(
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
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

  let recommendations: unknown[] = [];
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
