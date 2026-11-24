import {
  ACCESS_TIER_CODEC,
  type GameLevelFacetRow,
  type GameLevelsRepository,
  type SearchGameLevelsFilter,
} from "@mindkid/db";
import type { AccessTier } from "@mindkid/shared";
import type { SearchParams } from "#server/services/content-search";

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

export function aggregateCompetency(
  rows: readonly FacetCountRow[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const code = competencyFromCode(row.code);
    if (code) {
      result[code] = (result[code] ?? 0) + 1;
    }
  }
  return result;
}

export function aggregateAgeAndBand(rows: readonly FacetCountRow[]): {
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

export function aggregateTier(
  rows: readonly FacetCountRow[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.accessTier] = (result[row.accessTier] ?? 0) + 1;
  }
  return result;
}

export function aggregateStrand(
  rows: ReadonlyArray<{ readonly code: string; readonly count: number }>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.code] = row.count;
  }
  return result;
}

function normalizeFilterString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function toSearchRepoFilter(
  params: SearchParams,
  options: { includeQuery?: boolean; includeCursor?: boolean } = {}
): SearchGameLevelsFilter {
  const cursorStr = options.includeCursor
    ? normalizeFilterString(params.cursor)
    : undefined;
  const cursorId = cursorStr ? Number.parseInt(cursorStr, 10) : Number.NaN;
  return {
    q: options.includeQuery ? normalizeFilterString(params.q) : undefined,
    accessTier: params.access_tier
      ? ACCESS_TIER_CODEC.toCode(params.access_tier)
      : undefined,
    templateCode:
      normalizeFilterString(params.template) ??
      normalizeFilterString(params.template_code),
    ageMin: params.age_min,
    ageMax: params.age_max,
    age: params.age,
    ageBand: params.age_band,
    difficulty: params.difficulty,
    themeId: normalizeFilterString(params.theme),
    competency: params.competency,
    strand: normalizeFilterString(params.strand),
    skillCode:
      normalizeFilterString(params.skill_code) ??
      normalizeFilterString(params.skill),
    learningObjective: normalizeFilterString(params.learning_objective),
    what: normalizeFilterString(params.what),
    thinking: normalizeFilterString(params.thinking),
    mechanic: normalizeFilterString(params.mechanic),
    sort: params.sort,
    limit: params.limit,
    cursorId: Number.isNaN(cursorId) ? undefined : cursorId,
  };
}

export function toFacetRows(
  rows: readonly GameLevelFacetRow[]
): FacetCountRow[] {
  return rows.map((row) => ({
    code: row.code,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    accessTier: ACCESS_TIER_CODEC.toLabel(row.accessTier),
  }));
}

/**
 * Số lượng cho từng giá trị bộ lọc — `GAME-CATALOG-PUBLIC` §8.
 *
 * Mỗi trục được đếm với **mọi bộ lọc khác trừ chính nó**.
 */
export async function buildGameLevelFacets(
  gameLevelsRepo: GameLevelsRepository,
  params: SearchParams
): Promise<GameLevelFacets> {
  const baseFilter = toSearchRepoFilter(params, {
    includeQuery: true,
    includeCursor: false,
  });

  const totalRowsPromise = gameLevelsRepo.listFacetRows(baseFilter);

  const competencyPromise =
    params.competency === undefined
      ? totalRowsPromise
      : gameLevelsRepo.listFacetRows({ ...baseFilter, competency: undefined });

  const hasAgeFilter =
    params.age !== undefined ||
    params.age_min !== undefined ||
    params.age_max !== undefined ||
    params.age_band !== undefined;
  const ageRowsPromise = hasAgeFilter
    ? gameLevelsRepo.listFacetRows({
        ...baseFilter,
        age: undefined,
        ageMin: undefined,
        ageMax: undefined,
        ageBand: undefined,
      })
    : totalRowsPromise;

  const tierRowsPromise =
    params.access_tier === undefined
      ? totalRowsPromise
      : gameLevelsRepo.listFacetRows({ ...baseFilter, accessTier: undefined });

  const strandRowsPromise = gameLevelsRepo.countFacetStrands(baseFilter);

  const [competencyRows, ageRows, tierRows, totalRows, strandRows] =
    await Promise.all([
      competencyPromise,
      ageRowsPromise,
      tierRowsPromise,
      totalRowsPromise,
      strandRowsPromise,
    ]);

  const { age, age_band } = aggregateAgeAndBand(toFacetRows(ageRows));

  return {
    total: totalRows.length,
    competency: aggregateCompetency(toFacetRows(competencyRows)),
    age,
    age_band,
    access_tier: aggregateTier(toFacetRows(tierRows)),
    strand: aggregateStrand(strandRows),
  };
}
