import type { RecommendationItem } from "@mindkid/adaptive";
import {
  collections,
  curricula,
  gameLevels,
  type getOwnerDb,
  libraryItems,
} from "@mindkid/db";
import { QuotaExceededError } from "@mindkid/errors/billing";
import { NotFoundError } from "@mindkid/errors/common";
import { CodeAlreadyExistsError } from "@mindkid/errors/content";
import { type AccessTier, TIER_ORDER, TIER_RANK } from "@mindkid/shared";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getGuestRecommendations } from "./recommendation.ts";

type LibraryDatabase = ReturnType<typeof getOwnerDb>;

export interface GetLibraryOptions {
  userId: number;
  entityType?: "game_level" | "curriculum";
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
  const [userCols, counts] = await Promise.all([
    db
      .select({
        id: collections.id,
        name: collections.name,
        position: collections.position,
        createdAt: collections.createdAt,
      })
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(collections.position, collections.createdAt),
    db
      .select({
        collectionId: libraryItems.collectionId,
        count: sql<number>`count(*)::int`,
      })
      .from(libraryItems)
      .where(eq(libraryItems.userId, userId))
      .groupBy(libraryItems.collectionId),
  ]);

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
  entityType: "game_level" | "curriculum",
  code: string
): Promise<number | null> {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return null;
  }
  if (entityType === "game_level") {
    const [row] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(eq(gameLevels.code, normalizedCode))
      .limit(1);
    return row?.id ?? null;
  }
  const [row] = await db
    .select({ id: curricula.id })
    .from(curricula)
    .where(eq(curricula.code, normalizedCode))
    .limit(1);
  return row?.id ?? null;
}

export async function addLibraryItem(
  db: LibraryDatabase,
  params: {
    userId: number;
    entityType: "game_level" | "curriculum";
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
    entityType: "game_level" | "curriculum";
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
  const [active] = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      accessTier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(eq(gameLevels.id, entityId));

  return {
    code: active?.code ?? `game_level-${entityId}`,
    title: active?.title ?? `Trò chơi #${entityId}`,
    thumbnailEmoji: active?.thumbnailEmoji ?? undefined,
    accessTier: active?.accessTier ?? "free",
    isArchived: !active,
  };
}

async function resolveCurriculumMeta(
  db: LibraryDatabase,
  entityId: number
): Promise<ResolvedEntityMeta> {
  const [active] = await db
    .select({
      code: curricula.code,
      title: curricula.title,
      accessTier: curricula.accessTier,
    })
    .from(curricula)
    .where(eq(curricula.id, entityId));

  return {
    code: active?.code ?? `curriculum-${entityId}`,
    title: active?.title ?? `Chương trình #${entityId}`,
    accessTier: active?.accessTier ?? "free",
    isArchived: !active,
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
    case "curriculum":
      return resolveCurriculumMeta(db, entityId);
    default:
      return Promise.resolve({
        code: `${entityType}-${entityId}`,
        title: `Nội dung #${entityId}`,
        accessTier: "free",
        isArchived: true,
      });
  }
}

function populateMetaGroup<
  T extends {
    id: number;
    code: string;
    title: string;
    accessTier: string;
    thumbnailEmoji?: string | null;
  },
>(metaMap: Map<string, ResolvedEntityMeta>, rows: T[], type: string): void {
  for (const r of rows) {
    metaMap.set(`${type}_${r.id}`, {
      code: r.code,
      title: r.title,
      thumbnailEmoji: r.thumbnailEmoji ?? undefined,
      accessTier: r.accessTier,
      isArchived: false,
    });
  }
}

async function buildBulkMetaMap(
  db: LibraryDatabase,
  items: Array<{ entityType: string; entityId: number }>
): Promise<Map<string, ResolvedEntityMeta>> {
  const gameLevelIds = items
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);
  const currIds = items
    .filter((i) => i.entityType === "curriculum")
    .map((i) => i.entityId);

  const [rawGameLevels, rawCurricula] = await Promise.all([
    gameLevelIds.length > 0
      ? db
          .select({
            id: gameLevels.id,
            code: gameLevels.code,
            title: gameLevels.title,
            thumbnailEmoji: gameLevels.thumbnailEmoji,
            accessTier: gameLevels.accessTier,
          })
          .from(gameLevels)
          .where(inArray(gameLevels.id, gameLevelIds))
      : Promise.resolve([]),
    currIds.length > 0
      ? db
          .select({
            id: curricula.id,
            code: curricula.code,
            title: curricula.title,
            accessTier: curricula.accessTier,
          })
          .from(curricula)
          .where(inArray(curricula.id, currIds))
      : Promise.resolve([]),
  ]);

  const metaMap = new Map<string, ResolvedEntityMeta>();
  populateMetaGroup(metaMap, rawGameLevels, "game_level");
  populateMetaGroup(metaMap, rawCurricula, "curriculum");
  return metaMap;
}

function matchesLibraryQuery(
  meta: ResolvedEntityMeta,
  qLower: string | undefined
): boolean {
  if (!qLower) {
    return true;
  }
  return (
    meta.title.toLowerCase().includes(qLower) ||
    meta.code.toLowerCase().includes(qLower)
  );
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
  const metaMap = await buildBulkMetaMap(db, items);

  for (const item of items) {
    const meta =
      metaMap.get(`${item.entityType}_${item.entityId}`) ??
      (await resolveEntityMeta(db, item.entityType, item.entityId));

    if (!matchesLibraryQuery(meta, qLower)) {
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
