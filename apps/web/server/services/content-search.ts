import { activities, gameLevels, lessons } from "@mindkid/db";
import type { AccessTier } from "@mindkid/shared";
import { allowedTiers } from "@mindkid/shared";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";

export type SearchViewerRole = "guest" | "user" | "manager";

export const SearchParamsSchema = z.object({
  q: z.string().optional(),
  age_min: z.coerce.number().min(3).max(6).optional(),
  age_max: z.coerce.number().min(3).max(6).optional(),
  /**
   * Một tuổi cụ thể — `GAME-CATALOG-PUBLIC` §3 dùng `/games?competency=C1&age=4`.
   *
   * Khác `age_min`/`age_max`: hai tham số kia hỏi "band nằm gọn trong khoảng
   * này", còn `age` hỏi "band có chứa tuổi này không". Dùng `age_min=4` cho
   * một đứa trẻ 4 tuổi sẽ loại mọi level band 3–4 — đúng cú pháp, sai câu hỏi.
   */
  age: z.coerce.number().min(3).max(6).optional(),
  /**
   * Một band trọn vẹn — `GAME-CATALOG-PUBLIC` §7.1 dùng `/games?age_band=4-5`.
   *
   * `age` Cấm — NEVER thay được cho nó: `age=4` hỏi "band có chứa tuổi 4",
   * nên khớp cả 3-4 lẫn 4-5. Trang chủ hứa "trò chơi của Lớp Chồi" thì phải
   * là band 4-5 đúng hai đầu. Trước task 165 schema không khai `age_band`
   * và `z.object` loại nó trong im lặng — bộ lọc rơi, danh mục trả cả kho.
   */
  age_band: z.enum(["3-4", "4-5", "5-6"]).optional(),
  competency: z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]).optional(),
  strand: z.string().optional(),
  skill: z.string().optional(),
  learning_objective: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  duration_max: z.coerce.number().optional(),
  what: z.string().optional(),
  thinking: z.string().optional(),
  mechanic: z.string().optional(),
  theme: z.string().optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  template: z.string().optional(),
  status: z
    .enum([
      "draft",
      "in_review",
      "approved",
      "published",
      "archived",
      "rejected",
    ])
    .optional(),
  sort: z
    .enum(["relevance", "newest", "popular", "difficulty"])
    .default("relevance"),
  limit: z.coerce.number().min(1).optional(),
  cursor: z.string().optional(),
  is_exemplar: z.coerce.boolean().optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function buildBasicConditions(
  params: SearchParams,
  viewerRole: SearchViewerRole
): ReturnType<typeof sql>[] {
  const conditions: ReturnType<typeof sql>[] = [];

  if (viewerRole === "guest" || viewerRole === "user") {
    conditions.push(eq(gameLevels.status, "published"));
  } else if (params.status) {
    conditions.push(eq(gameLevels.status, params.status));
  }

  if (params.access_tier) {
    conditions.push(eq(gameLevels.accessTier, params.access_tier));
  }
  if (params.template) {
    conditions.push(eq(gameLevels.templateCode, params.template));
  }
  if (params.age_min !== undefined) {
    conditions.push(gte(gameLevels.ageMin, params.age_min));
  }
  if (params.age_max !== undefined) {
    conditions.push(lte(gameLevels.ageMax, params.age_max));
  }
  if (params.age !== undefined) {
    conditions.push(lte(gameLevels.ageMin, params.age));
    conditions.push(gte(gameLevels.ageMax, params.age));
  }
  if (params.age_band) {
    const [bandMin, bandMax] = params.age_band.split("-");
    conditions.push(eq(gameLevels.ageMin, Number(bandMin)));
    conditions.push(eq(gameLevels.ageMax, Number(bandMax)));
  }
  if (params.difficulty !== undefined) {
    conditions.push(eq(gameLevels.difficulty, params.difficulty));
  }
  if (params.theme) {
    conditions.push(eq(gameLevels.themeId, params.theme));
  }
  return conditions;
}

function buildSearchWhereConditions(
  params: SearchParams,
  viewerRole: SearchViewerRole
): ReturnType<typeof sql>[] {
  const conditions = buildBasicConditions(params, viewerRole);

  if (params.competency) {
    const compPattern = `GL-${params.competency}-%`;
    conditions.push(sql`${gameLevels.code} LIKE ${compPattern}`);
  }

  if (params.q && params.q.trim().length > 0) {
    const rawQuery = params.q.trim();
    const normalizedQuery = removeVietnameseTones(rawQuery);
    const patternRaw = `%${rawQuery}%`;
    const patternNorm = `%${normalizedQuery}%`;
    conditions.push(
      sql`(
        ${gameLevels.title} ILIKE ${patternRaw} OR
        ${gameLevels.description} ILIKE ${patternRaw} OR
        ${gameLevels.code} ILIKE ${patternRaw} OR
        ${gameLevels.title} ILIKE ${patternNorm}
      )`
    );
  }

  if (params.cursor) {
    const cursorId = Number.parseInt(params.cursor, 10);
    if (!Number.isNaN(cursorId)) {
      conditions.push(sql`${gameLevels.id} > ${cursorId}`);
    }
  }

  return conditions;
}

async function getViewerAllowedTiers(viewer: {
  role: SearchViewerRole;
  userPackage?: string;
}): Promise<AccessTier[]> {
  if (viewer.role === "manager") {
    return ["free", "login", "standard", "premium"];
  }
  if (viewer.role === "user") {
    let keys: (
      | "play_premium_games"
      | "play_standard_games"
      | "play_login_games"
    )[] = ["play_login_games"];
    if (viewer.userPackage === "PKG-premium") {
      keys = ["play_premium_games", "play_standard_games", "play_login_games"];
    } else if (viewer.userPackage === "PKG-standard") {
      keys = ["play_standard_games", "play_login_games"];
    }
    return await allowedTiers({ kind: "user", user_id: "user" }, keys);
  }
  return await allowedTiers({ kind: "guest" });
}

interface RawRow {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  instruction?: string | null;
  thumbnailEmoji?: string | null;
  themeId?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  difficulty?: number | null;
  accessTier: string;
  status: string;
  contentPack: unknown;
  difficultyParams: unknown;
  createdAt: Date;
}

/**
 * Năng lực đọc từ mã level — `GL-C3-...` thuộc C3.
 *
 * Không có cột `competency` trên `game_levels`; bộ lọc của
 * `buildSearchWhereConditions` cũng khớp bằng `code LIKE 'GL-C3-%'`, nên đây là
 * cùng một nguồn sự thật chứ không phải một cách suy diễn thứ hai.
 */
const LEVEL_COMPETENCY_REGEX = /^GL-(C[1-6])-/;

export function competencyFromCode(code: string): string | null {
  const match = LEVEL_COMPETENCY_REGEX.exec(code);
  return match?.[1] ?? null;
}

/** "3-4" — thẻ trò chơi hiện band, không hiện hai số rời (`BR-GCP` §7.2). */
export function ageBandLabel(
  ageMin: number | null | undefined,
  ageMax: number | null | undefined
): string | null {
  if (ageMin == null || ageMax == null) {
    return null;
  }
  return `${ageMin}-${ageMax}`;
}

function formatSearchItem(row: RawRow, userAllowedTiers: AccessTier[]) {
  const isAccessible = userAllowedTiers.includes(row.accessTier as AccessTier);
  const isLocked = !isAccessible;

  const card = {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    instruction: row.instruction,
    thumbnail_emoji: row.thumbnailEmoji,
    theme_id: row.themeId,
    competency: competencyFromCode(row.code),
    age_band: ageBandLabel(row.ageMin, row.ageMax),
    age_min: row.ageMin,
    age_max: row.ageMax,
    difficulty: row.difficulty,
    access_tier: row.accessTier,
    status: row.status,
  };

  if (isLocked) {
    return { ...card, locked: true };
  }

  return {
    ...card,
    locked: false,
    content_pack: row.contentPack,
    difficulty_params: row.difficultyParams,
  };
}

export async function searchGameLevels(
  db: PostgresJsDatabase<Record<string, unknown>>,
  rawParams: unknown,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const params = SearchParamsSchema.parse(rawParams ?? {});
  const maxLimit = viewer.role === "manager" ? 100 : 60;
  const limit = Math.min(params.limit ?? 20, maxLimit);

  const conditions = buildSearchWhereConditions(params, viewer.role);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const userAllowedTiers = await getViewerAllowedTiers(viewer);

  const rawRows = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      description: gameLevels.description,
      instruction: gameLevels.instruction,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      themeId: gameLevels.themeId,
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
      difficulty: gameLevels.difficulty,
      accessTier: gameLevels.accessTier,
      status: gameLevels.status,
      contentPack: gameLevels.contentPack,
      difficultyParams: gameLevels.difficultyParams,
      createdAt: gameLevels.createdAt,
    })
    .from(gameLevels)
    .where(whereClause)
    .limit(limit + 1);

  const hasMore = rawRows.length > limit;
  const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? String(lastRow.id) : null;

  const items = pageRows.map((row) => formatSearchItem(row, userAllowedTiers));

  if (params.sort === "relevance") {
    items.sort((a, b) => {
      if (a.locked !== b.locked) {
        return a.locked ? 1 : -1;
      }
      return 0;
    });
  }

  const hasPaidOrLockedContent = items.some(
    (item) => item.locked || item.access_tier !== "free"
  );

  const facets = await buildGameLevelFacets(db, params, viewer.role);

  return {
    items,
    next_cursor: nextCursor,
    total: facets.total,
    facets,
    no_store: hasPaidOrLockedContent,
  };
}

export interface GameLevelFacets {
  total: number;
  competency: Record<string, number>;
  age: Record<string, number>;
  age_band: Record<string, number>;
  access_tier: Record<string, number>;
}

/**
 * Số lượng cho từng giá trị bộ lọc — `GAME-CATALOG-PUBLIC` §8.
 *
 * Mỗi trục được đếm với **mọi bộ lọc khác trừ chính nó**. Đếm với cả bộ lọc
 * hiện tại thì mọi lựa chọn chưa chọn đều ra 0 và giao diện sẽ vô hiệu hết —
 * đúng ngược với lý do facet tồn tại.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: aggregate facets branching
async function buildGameLevelFacets(
  db: PostgresJsDatabase<Record<string, unknown>>,
  params: SearchParams,
  viewerRole: SearchViewerRole
): Promise<GameLevelFacets> {
  const countWith = async (
    overrides: Partial<SearchParams>
  ): Promise<Array<{ key: string; count: number }>> => {
    const scoped = { ...params, ...overrides };
    const conditions = buildSearchWhereConditions(scoped, viewerRole);
    const rows = await db
      .select({
        code: gameLevels.code,
        ageMin: gameLevels.ageMin,
        ageMax: gameLevels.ageMax,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return rows.map((row) => ({
      key: row.code,
      count: 1,
      ...row,
    })) as unknown as Array<{ key: string; count: number }>;
  };

  const clearCursor = { cursor: undefined };

  const competencyRows = (await countWith({
    ...clearCursor,
    competency: undefined,
  })) as unknown as Array<{ code: string }>;
  const ageRows = (await countWith({
    ...clearCursor,
    age: undefined,
    age_min: undefined,
    age_max: undefined,
    age_band: undefined,
  })) as unknown as Array<{ ageMin: number | null; ageMax: number | null }>;
  const tierRows = (await countWith({
    ...clearCursor,
    access_tier: undefined,
  })) as unknown as Array<{ accessTier: string }>;
  const totalRows = await countWith(clearCursor);

  const competency: Record<string, number> = {};
  for (const row of competencyRows) {
    const code = competencyFromCode(row.code);
    if (code) {
      competency[code] = (competency[code] ?? 0) + 1;
    }
  }

  const age: Record<string, number> = {};
  const age_band: Record<string, number> = {};
  for (const row of ageRows) {
    if (row.ageMin == null || row.ageMax == null) {
      continue;
    }
    for (let year = row.ageMin; year <= row.ageMax; year++) {
      age[String(year)] = (age[String(year)] ?? 0) + 1;
    }
    const band = ageBandLabel(row.ageMin, row.ageMax);
    if (band) {
      age_band[band] = (age_band[band] ?? 0) + 1;
    }
  }

  const access_tier: Record<string, number> = {};
  for (const row of tierRows) {
    access_tier[row.accessTier] = (access_tier[row.accessTier] ?? 0) + 1;
  }

  return { total: totalRows.length, competency, age, age_band, access_tier };
}

function buildActivityConditions(
  params: z.infer<typeof SearchParamsSchema>,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const conditions: ReturnType<typeof sql>[] = [];

  if (viewer.role === "guest" || viewer.role === "user") {
    conditions.push(eq(activities.status, "published"));
  } else if (params.status) {
    conditions.push(eq(activities.status, params.status));
  }

  if (params.access_tier) {
    conditions.push(eq(activities.accessTier, params.access_tier));
  }
  if (params.what) {
    conditions.push(
      eq(activities.kind, params.what as typeof activities.$inferSelect.kind)
    );
  }
  if (params.duration_max !== undefined) {
    conditions.push(lte(activities.estimatedMinutes, params.duration_max));
  }
  if (params.cursor) {
    const cursorId = Number(params.cursor);
    if (!Number.isNaN(cursorId)) {
      conditions.push(gte(activities.id, cursorId));
    }
  }

  if (params.q && params.q.trim().length > 0) {
    const patternRaw = `%${params.q.trim()}%`;
    conditions.push(
      sql`(${activities.title} ILIKE ${patternRaw} OR ${activities.instruction} ILIKE ${patternRaw} OR ${activities.materials} ILIKE ${patternRaw})`
    );
  }
  return conditions;
}

export async function searchActivities(
  db: PostgresJsDatabase<Record<string, unknown>>,
  rawParams: unknown,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const params = SearchParamsSchema.parse(rawParams ?? {});
  const maxLimit = viewer.role === "manager" ? 100 : 60;
  const limit = Math.min(params.limit ?? 20, maxLimit);

  const conditions = buildActivityConditions(params, viewer);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const userAllowedTiers = await getViewerAllowedTiers(viewer);

  const rawRows = await db
    .select({
      id: activities.id,
      entityId: activities.entityId,
      code: activities.code,
      contentVersion: activities.contentVersion,
      kind: activities.kind,
      title: activities.title,
      instruction: activities.instruction,
      materials: activities.materials,
      estimatedMinutes: activities.estimatedMinutes,
      refType: activities.refType,
      refId: activities.refId,
      accessTier: activities.accessTier,
      status: activities.status,
      origin: activities.origin,
      authoredIn: activities.authoredIn,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .where(whereClause)
    .limit(limit + 1);

  const hasMore = rawRows.length > limit;
  const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? String(lastRow.id) : null;

  const items = pageRows.map((row) => {
    const isLocked =
      viewer.role !== "manager" && !userAllowedTiers.includes(row.accessTier);
    return {
      id: row.id,
      entity_id: row.entityId,
      code: row.code,
      content_version: row.contentVersion,
      kind: row.kind,
      title: row.title,
      instruction: isLocked ? "" : row.instruction,
      materials: row.materials,
      estimated_minutes: row.estimatedMinutes,
      ref_type: row.refType,
      ref_id: row.refId,
      access_tier: row.accessTier,
      status: row.status,
      origin: row.origin,
      authored_in: row.authoredIn,
      created_at: row.createdAt,
      locked: isLocked,
    };
  });

  const hasPaidOrLockedContent = items.some(
    (item) => item.locked || item.access_tier !== "free"
  );

  return {
    items,
    next_cursor: nextCursor,
    no_store: hasPaidOrLockedContent,
  };
}

function buildLessonConditions(
  params: z.infer<typeof SearchParamsSchema>,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const conditions: ReturnType<typeof sql>[] = [];

  if (viewer.role === "guest" || viewer.role === "user") {
    conditions.push(eq(lessons.status, "published"));
  } else if (params.status) {
    conditions.push(eq(lessons.status, params.status));
  }

  if (params.access_tier) {
    conditions.push(eq(lessons.accessTier, params.access_tier));
  }
  if (params.age_min !== undefined) {
    conditions.push(gte(lessons.targetAgeMin, params.age_min));
  }
  if (params.age_max !== undefined) {
    conditions.push(lte(lessons.targetAgeMax, params.age_max));
  }
  if (params.duration_max !== undefined) {
    conditions.push(lte(lessons.estimatedMinutes, params.duration_max));
  }
  if (params.cursor) {
    const cursorId = Number(params.cursor);
    if (!Number.isNaN(cursorId)) {
      conditions.push(gte(lessons.id, cursorId));
    }
  }

  if (params.is_exemplar !== undefined) {
    conditions.push(eq(lessons.isExemplar, params.is_exemplar));
  }

  if (params.q && params.q.trim().length > 0) {
    const patternRaw = `%${params.q.trim()}%`;
    conditions.push(
      sql`(${lessons.title} ILIKE ${patternRaw} OR ${lessons.guide} ILIKE ${patternRaw} OR ${lessons.materials} ILIKE ${patternRaw})`
    );
  }

  return conditions;
}

export async function searchLessons(
  db: PostgresJsDatabase<Record<string, unknown>>,
  rawParams: unknown,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const params = SearchParamsSchema.parse(rawParams ?? {});
  const maxLimit = viewer.role === "manager" ? 100 : 40;
  const limit = Math.min(params.limit ?? 20, maxLimit);

  const conditions = buildLessonConditions(params, viewer);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const userAllowedTiers = await getViewerAllowedTiers(viewer);

  const rawRows = await db
    .select({
      id: lessons.id,
      entityId: lessons.entityId,
      code: lessons.code,
      contentVersion: lessons.contentVersion,
      title: lessons.title,
      guide: lessons.guide,
      targetAgeMin: lessons.targetAgeMin,
      targetAgeMax: lessons.targetAgeMax,
      estimatedMinutes: lessons.estimatedMinutes,
      materials: lessons.materials,
      warmUp: lessons.warmUp,
      reflection: lessons.reflection,
      assessment: lessons.assessment,
      extension: lessons.extension,
      accessTier: lessons.accessTier,
      status: lessons.status,
      origin: lessons.origin,
      authoredIn: lessons.authoredIn,
      isExemplar: lessons.isExemplar,
      exemplarCompetency: lessons.exemplarCompetency,
      exemplarAgeBand: lessons.exemplarAgeBand,
      createdAt: lessons.createdAt,
    })
    .from(lessons)
    .where(whereClause)
    .limit(limit + 1);

  const hasMore = rawRows.length > limit;
  const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? String(lastRow.id) : null;

  const items = pageRows.map((row) => {
    const isLocked =
      viewer.role !== "manager" && !userAllowedTiers.includes(row.accessTier);
    return {
      id: row.id,
      entity_id: row.entityId,
      code: row.code,
      content_version: row.contentVersion,
      title: row.title,
      guide: isLocked ? "" : row.guide,
      target_age_min: row.targetAgeMin,
      target_age_max: row.targetAgeMax,
      estimated_minutes: row.estimatedMinutes,
      materials: row.materials,
      warm_up: row.warmUp,
      reflection: row.reflection,
      assessment: row.assessment,
      extension: row.extension,
      access_tier: row.accessTier,
      status: row.status,
      origin: row.origin,
      authored_in: row.authoredIn,
      is_exemplar: row.isExemplar,
      exemplar_competency: row.exemplarCompetency,
      exemplar_age_band: row.exemplarAgeBand,
      created_at: row.createdAt,
      locked: isLocked,
    };
  });

  const hasPaidOrLockedContent = items.some(
    (item) => item.locked || item.access_tier !== "free"
  );

  return {
    items,
    next_cursor: nextCursor,
    no_store: hasPaidOrLockedContent,
  };
}

/**
 * Helper for fallback base search across published content.
 */
export async function searchContentPublished(
  query: string,
  options?: { limit?: number; userTier?: AccessTier }
) {
  const db = (await import("@mindkid/db")).getDb();
  const limit = options?.limit ?? 10;
  const userTier = options?.userTier ?? "free";
  const gameRes = await searchGameLevels(
    db,
    { q: query, limit, status: "published" },
    { role: "user", userPackage: userTier }
  );

  return {
    items: gameRes.items.map((it) => ({
      id: it.id,
      contentType: "game_level",
      code: it.code,
      title: it.title,
      instruction: it.instruction,
      ageMin: it.age_min ?? 3,
      ageMax: it.age_max ?? 6,
      difficulty: it.difficulty ?? 1,
      accessTier: it.access_tier,
      rank: 1,
    })),
  };
}
