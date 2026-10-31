import {
  contentSkillMap,
  gameLevels,
  type OwnerDb,
  skills,
  strands,
} from "@mindkid/db";
import type { AccessTier } from "@mindkid/shared";
import { and, eq, sql } from "drizzle-orm";
import type {
  SearchParams,
  SearchViewerRole,
} from "#server/services/content-search";

export interface GameLevelFacets {
  total: number;
  competency: Record<string, number>;
  age: Record<string, number>;
  age_band: Record<string, number>;
  access_tier: Record<string, number>;
  strand?: Record<string, number>;
}

export interface FacetCountRow {
  code: string;
  ageMin: number | null;
  ageMax: number | null;
  accessTier: AccessTier;
}

const COMPETENCY_CODE_REGEX = /^GL-(C[1-6])-/;

export function competencyFromCode(code: string): string | null {
  const match = code.match(COMPETENCY_CODE_REGEX);
  return match ? (match[1] as string) : null;
}

export function ageBandLabel(
  ageMin: number | null,
  ageMax: number | null
): string | null {
  if (ageMin == null || ageMax == null) {
    return null;
  }
  return `${ageMin}-${ageMax}`;
}

function aggregateCompetency(rows: FacetCountRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const code = competencyFromCode(row.code);
    if (code) {
      result[code] = (result[code] ?? 0) + 1;
    }
  }
  return result;
}

function aggregateAgeAndBand(rows: FacetCountRow[]): {
  age: Record<string, number>;
  age_band: Record<string, number>;
} {
  const age: Record<string, number> = {};
  const age_band: Record<string, number> = {};
  for (const row of rows) {
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
  return { age, age_band };
}

function aggregateTier(rows: FacetCountRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.accessTier] = (result[row.accessTier] ?? 0) + 1;
  }
  return result;
}

function aggregateStrand(
  rows: Array<{ code: string; count: number }>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.code] = row.count;
  }
  return result;
}

/**
 * Số lượng cho từng giá trị bộ lọc — `GAME-CATALOG-PUBLIC` §8.
 *
 * Mỗi trục được đếm với **mọi bộ lọc khác trừ chính nó**. Đếm với cả bộ lọc
 * hiện tại thì mọi lựa chọn chưa chọn đều ra 0 và giao diện sẽ vô hiệu hết.
 * Nếu một trục không có bộ lọc kích hoạt, tái sử dụng totalRowsPromise để tránh lặp query.
 */
export async function buildGameLevelFacets(
  db: OwnerDb,
  params: SearchParams,
  viewerRole: SearchViewerRole,
  buildSearchWhereConditions: (
    params: SearchParams,
    viewerRole: SearchViewerRole
  ) => ReturnType<typeof sql>[]
): Promise<GameLevelFacets> {
  const countWith = async (
    overrides: Partial<SearchParams>
  ): Promise<FacetCountRow[]> => {
    const scoped = { ...params, ...overrides };
    const conditions = buildSearchWhereConditions(scoped, viewerRole);
    return await db
      .select({
        code: gameLevels.code,
        ageMin: gameLevels.ageMin,
        ageMax: gameLevels.ageMax,
        accessTier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  };

  const clearCursor = { cursor: undefined };
  const strandConditions = buildSearchWhereConditions(
    { ...params, strand: undefined, cursor: undefined },
    viewerRole
  );

  const totalRowsPromise = countWith(clearCursor);

  const competencyPromise =
    params.competency === undefined
      ? totalRowsPromise
      : countWith({ ...clearCursor, competency: undefined });

  const hasAgeFilter =
    params.age !== undefined ||
    params.age_min !== undefined ||
    params.age_max !== undefined ||
    params.age_band !== undefined;
  const ageRowsPromise = hasAgeFilter
    ? countWith({
        ...clearCursor,
        age: undefined,
        age_min: undefined,
        age_max: undefined,
        age_band: undefined,
      })
    : totalRowsPromise;

  const tierRowsPromise =
    params.access_tier === undefined
      ? totalRowsPromise
      : countWith({ ...clearCursor, access_tier: undefined });

  const strandRowsPromise = db
    .select({
      code: strands.code,
      count: sql<number>`count(distinct ${gameLevels.id})`.mapWith(Number),
    })
    .from(gameLevels)
    .innerJoin(
      contentSkillMap,
      and(
        eq(contentSkillMap.entityId, gameLevels.id),
        eq(contentSkillMap.entityType, "game_level")
      )
    )
    .innerJoin(skills, eq(contentSkillMap.skillId, skills.id))
    .innerJoin(strands, eq(skills.strandId, strands.id))
    .where(strandConditions.length > 0 ? and(...strandConditions) : undefined)
    .groupBy(strands.code);

  const [competencyRows, ageRows, tierRows, totalRows, strandRows] =
    await Promise.all([
      competencyPromise,
      ageRowsPromise,
      tierRowsPromise,
      totalRowsPromise,
      strandRowsPromise,
    ]);

  const { age, age_band } = aggregateAgeAndBand(ageRows);

  return {
    total: totalRows.length,
    competency: aggregateCompetency(competencyRows),
    age,
    age_band,
    access_tier: aggregateTier(tierRows),
    strand: aggregateStrand(strandRows),
  };
}
