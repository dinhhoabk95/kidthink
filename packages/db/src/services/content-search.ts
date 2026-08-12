import type { AccessTier } from "@kidthink/shared";
import { allowedTiers } from "@kidthink/shared";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { gameLevels, gameTemplates } from "../schema/game.ts";

export type SearchViewerRole = "guest" | "user" | "manager";

export const SearchParamsSchema = z.object({
  q: z.string().optional(),
  age_min: z.coerce.number().min(3).max(6).optional(),
  age_max: z.coerce.number().min(3).max(6).optional(),
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
    conditions.push(eq(gameTemplates.code, params.template));
  }
  if (params.age_min !== undefined) {
    conditions.push(gte(gameLevels.ageMin, params.age_min));
  }
  if (params.age_max !== undefined) {
    conditions.push(lte(gameLevels.ageMax, params.age_max));
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
        ${gameLevels.titleVi} ILIKE ${patternRaw} OR
        ${gameLevels.descriptionVi} ILIKE ${patternRaw} OR
        ${gameLevels.code} ILIKE ${patternRaw} OR
        ${gameLevels.titleVi} ILIKE ${patternNorm}
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
  titleVi: string;
  descriptionVi?: string | null;
  instructionVi?: string | null;
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

function formatSearchItem(row: RawRow, userAllowedTiers: AccessTier[]) {
  const isAccessible = userAllowedTiers.includes(row.accessTier as AccessTier);
  const isLocked = !isAccessible;

  if (isLocked) {
    return {
      id: row.id,
      code: row.code,
      title_vi: row.titleVi,
      description_vi: row.descriptionVi,
      instruction_vi: row.instructionVi,
      thumbnail_emoji: row.thumbnailEmoji,
      theme_id: row.themeId,
      age_min: row.ageMin,
      age_max: row.ageMax,
      difficulty: row.difficulty,
      access_tier: row.accessTier,
      status: row.status,
      locked: true,
    };
  }

  return {
    id: row.id,
    code: row.code,
    title_vi: row.titleVi,
    description_vi: row.descriptionVi,
    instruction_vi: row.instructionVi,
    thumbnail_emoji: row.thumbnailEmoji,
    theme_id: row.themeId,
    age_min: row.ageMin,
    age_max: row.ageMax,
    difficulty: row.difficulty,
    access_tier: row.accessTier,
    status: row.status,
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
      titleVi: gameLevels.titleVi,
      descriptionVi: gameLevels.descriptionVi,
      instructionVi: gameLevels.instructionVi,
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
    .leftJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id))
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

  return {
    items,
    next_cursor: nextCursor,
    no_store: hasPaidOrLockedContent,
  };
}
