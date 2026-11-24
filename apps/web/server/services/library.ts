import type { RecommendationItem } from "@mindkid/adaptive";
import {
  ACCESS_TIER_CODEC,
  CONTENT_ENTITY_TYPE,
  CONTENT_ENTITY_TYPE_CODEC,
  type ContentEntityType,
  type DbExecutor,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { QuotaExceededError } from "@mindkid/errors/billing";
import { NotFoundError } from "@mindkid/errors/common";
import { CodeAlreadyExistsError } from "@mindkid/errors/content";
import { type AccessTier, TIER_ORDER, TIER_RANK } from "@mindkid/shared";
import { useOwnerRepositories } from "#server/utils/repositories";
import { getGuestRecommendations } from "./recommendation.ts";

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

interface ResolvedEntityMeta {
  code: string;
  title: string;
  thumbnailEmoji?: string;
  accessTier: string;
  isArchived: boolean;
}

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "library" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useOwnerRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

export async function getUserCollections(userId: number): Promise<
  Array<{
    id: number;
    name: string;
    position: number;
    item_count: number;
    created_at: string;
  }>
>;
export async function getUserCollections(
  dbOrRepos: DbExecutor | MindKidRepositories,
  userId: number
): Promise<
  Array<{
    id: number;
    name: string;
    position: number;
    item_count: number;
    created_at: string;
  }>
>;
export async function getUserCollections(
  first: DbExecutor | MindKidRepositories | number,
  maybeUserId?: number
) {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useOwnerRepositories();
  const userId = isLegacyCall ? (maybeUserId as number) : first;

  const [userCols, countMap] = await Promise.all([
    repos.library.listCollectionsByUser(userId),
    repos.library.countItemsByCollectionForUser(userId),
  ]);

  return userCols.map((col) => ({
    id: col.id,
    name: col.name,
    position: col.position,
    item_count: countMap.get(col.id) ?? 0,
    created_at: col.createdAt.toISOString(),
  }));
}

export async function createCollection(
  userId: number,
  name: string
): Promise<{
  id: number;
  name: string;
  position: number;
  item_count: number;
  created_at: string;
}>;
export async function createCollection(
  dbOrRepos: DbExecutor | MindKidRepositories,
  userId: number,
  name: string
): Promise<{
  id: number;
  name: string;
  position: number;
  item_count: number;
  created_at: string;
}>;
export async function createCollection(
  first: DbExecutor | MindKidRepositories | number,
  second: number | string,
  third?: string
) {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useOwnerRepositories();
  const userId = isLegacyCall ? (second as number) : first;
  const name = isLegacyCall ? (third as string) : (second as string);

  const currentCount = await repos.library.countCollectionsByUser(userId);
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

  const created = await repos.library.createCollection({
    userId,
    name: name.trim(),
    position: currentCount,
  });

  return {
    id: created.id,
    name: created.name,
    position: created.position,
    item_count: 0,
    created_at: created.createdAt.toISOString(),
  };
}

async function resolveEntityIdByCode(
  repos: MindKidRepositories,
  entityType: "game_level" | "curriculum",
  code: string
): Promise<number | null> {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return null;
  }
  if (entityType === "game_level") {
    const level = await repos.gameLevels.findByCode(normalizedCode);
    return level?.id ?? null;
  }
  const curr = await repos.curricula.findByCode(normalizedCode);
  return curr?.id ?? null;
}

export interface AddLibraryItemParams {
  userId: number;
  entityType: "game_level" | "curriculum";
  entityId?: number;
  code?: string;
  collectionId?: number | null;
  note?: string | null;
}

export async function addLibraryItem(
  params: AddLibraryItemParams
): Promise<
  Awaited<ReturnType<MindKidRepositories["library"]["addLibraryItem"]>>
>;
export async function addLibraryItem(
  dbOrRepos: DbExecutor | MindKidRepositories,
  params: AddLibraryItemParams
): Promise<
  Awaited<ReturnType<MindKidRepositories["library"]["addLibraryItem"]>>
>;
export async function addLibraryItem(
  first: DbExecutor | MindKidRepositories | AddLibraryItemParams,
  maybeParams?: AddLibraryItemParams
) {
  const isLegacyCall = maybeParams !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const params = isLegacyCall ? maybeParams : (first as AddLibraryItemParams);

  let resolvedEntityId = params.entityId;
  if (resolvedEntityId === undefined && params.code) {
    const foundId = await resolveEntityIdByCode(
      repos,
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

  if (params.collectionId !== undefined && params.collectionId !== null) {
    const ownedCollection = await repos.library.findCollectionByIdForUser(
      params.collectionId,
      params.userId
    );
    if (!ownedCollection) {
      throw new NotFoundError("Không tìm thấy bộ sưu tập.");
    }
  }

  const entityTypeCode = CONTENT_ENTITY_TYPE_CODEC.toCode(params.entityType);
  const existing = await repos.library.listLibraryItems({
    userId: params.userId,
    entityType: entityTypeCode,
    entityId: resolvedEntityId,
    limit: 1,
  });

  if (existing.length > 0) {
    throw new CodeAlreadyExistsError("Mục này đã tồn tại trong thư viện.");
  }

  return await repos.library.addLibraryItem({
    userId: params.userId,
    entityType: entityTypeCode,
    entityId: resolvedEntityId,
    collectionId: params.collectionId ?? null,
    note: params.note?.trim() ?? null,
  });
}

export const saveLibraryItem = addLibraryItem;

export interface RemoveLibraryItemParams {
  userId: number;
  entityType: "game_level" | "curriculum";
  entityId: number;
}

export async function removeLibraryItem(
  params: RemoveLibraryItemParams
): Promise<void>;
export async function removeLibraryItem(
  dbOrRepos: DbExecutor | MindKidRepositories,
  params: RemoveLibraryItemParams
): Promise<void>;
export async function removeLibraryItem(
  first: DbExecutor | MindKidRepositories | RemoveLibraryItemParams,
  maybeParams?: RemoveLibraryItemParams
) {
  const isLegacyCall = maybeParams !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const params = isLegacyCall
    ? maybeParams
    : (first as RemoveLibraryItemParams);

  await repos.library.removeLibraryItem(
    params.userId,
    CONTENT_ENTITY_TYPE_CODEC.toCode(params.entityType),
    params.entityId
  );
}

function resolveDefaultMeta(
  entityType: string,
  entityId: number
): ResolvedEntityMeta {
  if (entityType === "game_level") {
    return {
      code: `game_level-${entityId}`,
      title: `Trò chơi #${entityId}`,
      accessTier: "free",
      isArchived: true,
    };
  }
  if (entityType === "curriculum") {
    return {
      code: `curriculum-${entityId}`,
      title: `Chương trình #${entityId}`,
      accessTier: "free",
      isArchived: true,
    };
  }
  return {
    code: `${entityType}-${entityId}`,
    title: `Nội dung #${entityId}`,
    accessTier: "free",
    isArchived: true,
  };
}

async function buildBulkMetaMap(
  repos: MindKidRepositories,
  items: ReadonlyArray<{ entityType: ContentEntityType; entityId: number }>
): Promise<Map<string, ResolvedEntityMeta>> {
  const gameLevelIds = items
    .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL)
    .map((i) => i.entityId);
  const currIds = items
    .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.CURRICULUM)
    .map((i) => i.entityId);

  const [levelMap, curriculumMap] = await Promise.all([
    repos.gameLevels.mapByIds(gameLevelIds),
    repos.curricula.mapByIds(currIds),
  ]);

  const metaMap = new Map<string, ResolvedEntityMeta>();
  for (const r of levelMap.values()) {
    metaMap.set(`game_level_${r.id}`, {
      code: r.code,
      title: r.title,
      thumbnailEmoji: r.thumbnailEmoji ?? undefined,
      accessTier: ACCESS_TIER_CODEC.toLabel(r.accessTier),
      isArchived: false,
    });
  }
  for (const r of curriculumMap.values()) {
    metaMap.set(`curriculum_${r.id}`, {
      code: r.code,
      title: r.title,
      accessTier: ACCESS_TIER_CODEC.toLabel(r.accessTier),
      isArchived: false,
    });
  }
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

export async function getUserLibrary(options: GetLibraryOptions): Promise<{
  items: LibraryItemPayload[];
  total: number;
  recommendations: RecommendationItem[];
}>;
export async function getUserLibrary(
  dbOrRepos: DbExecutor | MindKidRepositories,
  options: GetLibraryOptions
): Promise<{
  items: LibraryItemPayload[];
  total: number;
  recommendations: RecommendationItem[];
}>;
export async function getUserLibrary(
  first: DbExecutor | MindKidRepositories | GetLibraryOptions,
  maybeOptions?: GetLibraryOptions
) {
  const isLegacyCall = maybeOptions !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const options = isLegacyCall ? maybeOptions : (first as GetLibraryOptions);

  const items = await repos.library.listLibraryItems({
    userId: options.userId,
    entityType: options.entityType
      ? CONTENT_ENTITY_TYPE_CODEC.toCode(options.entityType)
      : undefined,
    collectionId: options.collectionId,
    limit: Math.min(options.limit ?? 100, 100),
  });

  const highestTier: AccessTier = options.activeTier ?? "free";
  const accessibleTiers = TIER_ORDER.filter(
    (tier) => TIER_RANK[tier] <= TIER_RANK[highestTier]
  );
  const result: LibraryItemPayload[] = [];
  const qLower = options.q?.toLowerCase().trim();
  const metaMap = await buildBulkMetaMap(repos, items);

  for (const item of items) {
    const entityTypeLabel = CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType);
    const meta =
      metaMap.get(`${entityTypeLabel}_${item.entityId}`) ??
      resolveDefaultMeta(entityTypeLabel, item.entityId);

    if (!matchesLibraryQuery(meta, qLower)) {
      continue;
    }

    const isLocked = !accessibleTiers.includes(
      meta.accessTier as "free" | "login" | "standard" | "premium"
    );

    result.push({
      entity_type: entityTypeLabel,
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
    const recs = await getGuestRecommendations(repos, { limit: 5 });
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
