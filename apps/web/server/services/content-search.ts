import {
  contentSkillMap,
  gameLevels,
  type OwnerDb,
  skills,
  strands,
} from "@mindkid/db";
import type { AccessTier } from "@mindkid/shared";
import { AGE_BANDS, allowedTiers, getEffectiveTier } from "@mindkid/shared";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { getQuery } from "h3";
import { z } from "zod";
import {
  ageBandLabel,
  buildGameLevelFacets,
  competencyFromCode,
} from "#server/services/content-search-facets";

export type SearchViewerRole = "guest" | "user" | "manager";
export type RawSearchParamsInput =
  | ReturnType<typeof getQuery>
  | Record<string, string | number | boolean | undefined | string[]>
  | SearchParams
  | undefined;

const VIETNAMESE_ACCENTED =
  "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
const VIETNAMESE_UNACCENTED =
  "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD";

export const SearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
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
  age_band: z.enum(AGE_BANDS).optional(),
  competency: z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]).optional(),
  strand: z.string().trim().max(100).optional(),
  skill: z.string().trim().max(100).optional(),
  skill_code: z.string().trim().max(100).optional(),
  learning_objective: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  duration_max: z.coerce.number().optional(),
  what: z.string().optional(),
  thinking: z.string().optional(),
  mechanic: z.string().optional(),
  theme: z.string().optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  template: z.string().optional(),
  template_code: z.string().optional(),
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
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

function buildBasicConditions(
  params: SearchParams,
  _viewerRole: SearchViewerRole
): ReturnType<typeof sql>[] {
  const conditions: ReturnType<typeof sql>[] = [];

  if (params.status && params.status !== "published") {
    conditions.push(sql`1 = 0`);
  }

  if (params.access_tier) {
    conditions.push(eq(gameLevels.accessTier, params.access_tier));
  }
  const targetTemplate = params.template ?? params.template_code;
  if (targetTemplate) {
    conditions.push(eq(gameLevels.templateCode, targetTemplate));
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

  if (params.strand) {
    const rawStrand = params.strand.trim();
    const escapedStrand = escapeLikeWildcards(rawStrand);
    const suffixPattern = `%.${escapedStrand}`;
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${contentSkillMap}
        JOIN ${skills} ON ${contentSkillMap.skillId} = ${skills.id}
        JOIN ${strands} ON ${skills.strandId} = ${strands.id}
        WHERE ${contentSkillMap.entityType} = 'game_level'
          AND ${contentSkillMap.entityId} = ${gameLevels.id}
          AND (
            ${strands.code} = ${rawStrand} OR 
            ${strands.code} ILIKE ${suffixPattern} OR
            ${strands.name} ILIKE ${escapedStrand}
          )
      )`
    );
  }

  const rawSkill = (params.skill_code ?? params.skill)?.trim();
  if (rawSkill) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${contentSkillMap}
        JOIN ${skills} ON ${contentSkillMap.skillId} = ${skills.id}
        WHERE ${contentSkillMap.entityType} IN ('game_level', 'level')
          AND ${contentSkillMap.entityId} = ${gameLevels.id}
          AND ${skills.code} = ${rawSkill}
      )`
    );
  }

  if (params.q && params.q.trim().length > 0) {
    const rawQuery = params.q.trim();
    const normalizedQuery = removeVietnameseTones(rawQuery);
    const patternRaw = `%${escapeLikeWildcards(rawQuery)}%`;
    const patternNorm = `%${escapeLikeWildcards(normalizedQuery)}%`;
    conditions.push(
      sql`(
        ${gameLevels.title} ILIKE ${patternRaw} OR
        ${gameLevels.description} ILIKE ${patternRaw} OR
        ${gameLevels.code} ILIKE ${patternRaw} OR
        translate(${gameLevels.title}, ${VIETNAMESE_ACCENTED}, ${VIETNAMESE_UNACCENTED}) ILIKE ${patternNorm} OR
        translate(coalesce(${gameLevels.description}, ''), ${VIETNAMESE_ACCENTED}, ${VIETNAMESE_UNACCENTED}) ILIKE ${patternNorm}
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
    if (
      viewer.userPackage === "PKG-premium" ||
      viewer.userPackage === "premium"
    ) {
      keys = ["play_premium_games", "play_standard_games", "play_login_games"];
    } else if (
      viewer.userPackage === "PKG-standard" ||
      viewer.userPackage === "standard"
    ) {
      keys = ["play_standard_games", "play_login_games"];
    }
    return await allowedTiers({ kind: "user", user_id: "user" }, keys);
  }
  return await allowedTiers({ kind: "guest" });
}

interface RawRow {
  id: number;
  entityId?: number;
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
  status?: string;
  contentPack: (typeof gameLevels.$inferSelect)["contentPack"];
  difficultyParams: (typeof gameLevels.$inferSelect)["difficultyParams"];
  createdAt: Date;
}

function formatSearchItem(
  row: RawRow,
  userAllowedTiers: AccessTier[],
  viewerRole: SearchViewerRole = "user"
) {
  const effectiveTier = getEffectiveTier(row.accessTier as AccessTier, null, {
    code: row.code,
    callerKind: viewerRole,
  });
  const isAccessible = userAllowedTiers.includes(effectiveTier);
  const isLocked = !isAccessible;

  const card = {
    id: row.id,
    entity_id: row.entityId ?? row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    instruction: row.instruction,
    thumbnail_emoji: row.thumbnailEmoji,
    theme_id: row.themeId,
    competency: competencyFromCode(row.code),
    age_band: ageBandLabel(row.ageMin ?? null, row.ageMax ?? null),
    age_min: row.ageMin,
    age_max: row.ageMax,
    difficulty: row.difficulty,
    access_tier: row.accessTier,
    status: row.status ?? "published",
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

function resolveGameLevelOrder(params: SearchParams) {
  if (!params.cursor && params.sort === "newest") {
    return [desc(gameLevels.createdAt), asc(gameLevels.id)];
  }
  if (!params.cursor && params.sort === "difficulty") {
    return [asc(gameLevels.difficulty), asc(gameLevels.id)];
  }
  return [asc(gameLevels.id)];
}

export async function searchGameLevels(
  db: OwnerDb,
  rawParams: RawSearchParamsInput,
  viewer: { role: SearchViewerRole; userPackage?: string }
) {
  const params = SearchParamsSchema.parse(rawParams ?? {});
  const maxLimit = viewer.role === "manager" ? 100 : 60;
  const limit = Math.min(params.limit ?? 20, maxLimit);

  const conditions = buildSearchWhereConditions(params, viewer.role);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const userAllowedTiers = await getViewerAllowedTiers(viewer);

  const orderClauses = resolveGameLevelOrder(params);

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
      contentPack: gameLevels.contentPack,
      difficultyParams: gameLevels.difficultyParams,
      createdAt: gameLevels.createdAt,
    })
    .from(gameLevels)
    .where(whereClause)
    .orderBy(...orderClauses)
    .limit(limit + 1);

  const hasMore = rawRows.length > limit;
  const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;
  const lastRow = pageRows.at(-1);
  const nextCursor = hasMore && lastRow ? String(lastRow.id) : null;

  const items = pageRows.map((row) =>
    formatSearchItem(row, userAllowedTiers, viewer.role)
  );

  if (params.sort === "relevance") {
    items.sort((a, b) => {
      if (a.locked !== b.locked) {
        return a.locked ? 1 : -1;
      }
      return 0;
    });
  }

  const isPaidViewer =
    viewer.userPackage === "PKG-premium" ||
    viewer.userPackage === "premium" ||
    viewer.userPackage === "PKG-standard" ||
    viewer.userPackage === "standard";
  const hasPaidOrLockedContent =
    isPaidViewer ||
    items.some((item) => item.locked || item.access_tier !== "free");

  const facets = await buildGameLevelFacets(
    db,
    params,
    viewer.role,
    buildSearchWhereConditions
  );

  return {
    items,
    next_cursor: nextCursor,
    total: facets.total,
    facets,
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
