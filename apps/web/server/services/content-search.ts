import {
  ACCESS_TIER_CODEC,
  CONTENT_ENTITY_TYPE,
  type GameLevelEntity,
  type JsonRecord,
  type OwnerDb,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import type { AccessTier } from "@mindkid/shared";
import { AGE_BANDS, allowedTiers, getEffectiveTier } from "@mindkid/shared";
import type { getQuery } from "h3";
import { z } from "zod";
import {
  ageBandLabel,
  aggregateAgeAndBand,
  aggregateCompetency,
  aggregateStrand,
  aggregateTier,
  buildGameLevelFacets,
  competencyFromCode,
  type GameLevelFacets,
  toFacetRows,
  toSearchRepoFilter,
} from "#server/services/content-search-facets";
import { useOwnerRepositories } from "#server/utils/repositories";

export type SearchViewerRole = "guest" | "user" | "manager";
export interface SearchViewer {
  role: SearchViewerRole;
  userPackage?: string;
}
export type RawSearchParamsInput =
  | ReturnType<typeof getQuery>
  | Record<string, string | number | boolean | undefined | string[]>
  | SearchParams
  | undefined;

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((val) => (val.length > 0 ? val : undefined))
  .optional();

const optionalBoundedTrimmedString = z
  .string()
  .trim()
  .max(100)
  .transform((val) => (val.length > 0 ? val : undefined))
  .optional();

export const SearchParamsSchema = z.object({
  q: optionalBoundedTrimmedString,
  age_min: z.coerce.number().min(3).max(6).optional(),
  age_max: z.coerce.number().min(3).max(6).optional(),
  age: z.coerce.number().min(3).max(6).optional(),
  age_band: z.enum(AGE_BANDS).optional(),
  competency: z.enum(["C1", "C2", "C3", "C4", "C5", "C6"]).optional(),
  strand: optionalBoundedTrimmedString,
  skill: optionalBoundedTrimmedString,
  skill_code: optionalBoundedTrimmedString,
  learning_objective: optionalTrimmedString,
  difficulty: z.coerce.number().min(1).max(5).optional(),
  duration_max: z.coerce.number().optional(),
  what: optionalTrimmedString,
  thinking: optionalTrimmedString,
  mechanic: optionalTrimmedString,
  theme: optionalTrimmedString,
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  template: optionalTrimmedString,
  template_code: optionalTrimmedString,
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
  cursor: optionalTrimmedString,
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export interface SearchGameLevelCard {
  id: number;
  entity_id: number;
  code: string;
  title: string;
  description: string | null;
  instruction: string | null;
  thumbnail_emoji: string | null;
  theme_id: string | null;
  competency: string | null;
  age_band: string | null;
  age_min: number | null;
  age_max: number | null;
  difficulty: number | null;
  access_tier: AccessTier;
  status: string;
  locked: boolean;
  content_pack?: JsonRecord;
  difficulty_params?: JsonRecord;
}

export interface SearchGameLevelsResponse {
  items: SearchGameLevelCard[];
  next_cursor: string | null;
  total: number;
  facets: GameLevelFacets;
  no_store: boolean;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function matchesVietnameseSearch(
  row: GameLevelEntity,
  rawQuery: string
): boolean {
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  const normalizedQuery = removeVietnameseTones(trimmed);
  const fields = [row.title, row.description ?? "", row.code];
  for (const field of fields) {
    const lower = field.toLowerCase();
    if (
      lower.includes(trimmed) ||
      removeVietnameseTones(lower).includes(normalizedQuery)
    ) {
      return true;
    }
  }
  return false;
}

async function getViewerAllowedTiers(
  viewer: SearchViewer
): Promise<AccessTier[]> {
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

function formatSearchItem(
  row: GameLevelEntity,
  userAllowedTiers: AccessTier[],
  viewerRole: SearchViewerRole
): SearchGameLevelCard {
  const accessTier = ACCESS_TIER_CODEC.toLabel(row.accessTier);
  const effectiveTier = getEffectiveTier(accessTier, null, {
    code: row.code,
    callerKind: viewerRole,
  });
  const isLocked = !userAllowedTiers.includes(effectiveTier);

  const card: SearchGameLevelCard = {
    id: row.id,
    entity_id: row.id,
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
    access_tier: accessTier,
    status: "published",
    locked: isLocked,
  };

  if (isLocked) {
    return card;
  }

  return {
    ...card,
    content_pack: row.contentPack,
    difficulty_params: row.difficultyParams,
  };
}

function sortGameLevelRows(
  rows: GameLevelEntity[],
  params: SearchParams
): GameLevelEntity[] {
  const copy = [...rows];
  if (!params.cursor && params.sort === "newest") {
    copy.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id - b.id
    );
    return copy;
  }
  if (!params.cursor && params.sort === "difficulty") {
    copy.sort(
      (a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0) || a.id - b.id
    );
    return copy;
  }
  copy.sort((a, b) => a.id - b.id);
  return copy;
}

async function fetchAllCandidatesWithoutQuery(
  repos: MindKidRepositories,
  baseParams: SearchParams
): Promise<GameLevelEntity[]> {
  const collected: GameLevelEntity[] = [];
  let cursorId: number | undefined;
  const baseFilter = toSearchRepoFilter(baseParams, {
    includeQuery: false,
    includeCursor: false,
  });

  while (true) {
    const page = await repos.gameLevels.search({
      ...baseFilter,
      sort: "relevance",
      limit: 100,
      cursorId,
    });
    collected.push(...page.items);
    if (!page.hasMore || page.items.length === 0) {
      break;
    }
    const lastItem = page.items.at(-1);
    if (!lastItem) {
      break;
    }
    cursorId = lastItem.id;
  }

  return collected;
}

async function computeAccentInsensitiveStrandFacets(
  repos: MindKidRepositories,
  params: SearchParams,
  rawQuery: string
): Promise<Record<string, number>> {
  const withoutStrand = await fetchAllCandidatesWithoutQuery(repos, {
    ...params,
    strand: undefined,
    cursor: undefined,
  });
  const matchedIds = new Set(
    withoutStrand
      .filter((row) => matchesVietnameseSearch(row, rawQuery))
      .map((row) => row.id)
  );
  if (matchedIds.size === 0) {
    return {};
  }

  const [skillMaps, allSkills, allStrands] = await Promise.all([
    repos.tagging.listSkillMaps(CONTENT_ENTITY_TYPE.GAME_LEVEL),
    repos.taxonomy.listSkills(),
    repos.taxonomy.listStrands(),
  ]);
  const skillToStrand = new Map(allSkills.map((s) => [s.id, s.strandId]));
  const strandToCode = new Map(allStrands.map((st) => [st.id, st.code]));
  const levelsPerStrand = new Map<string, Set<number>>();

  for (const mapRow of skillMaps) {
    if (!matchedIds.has(mapRow.entityId)) {
      continue;
    }
    const strandId = skillToStrand.get(mapRow.skillId);
    const strandCode = strandId ? strandToCode.get(strandId) : undefined;
    if (!strandCode) {
      continue;
    }
    const set = levelsPerStrand.get(strandCode) ?? new Set<number>();
    set.add(mapRow.entityId);
    levelsPerStrand.set(strandCode, set);
  }

  return aggregateStrand(
    Array.from(levelsPerStrand.entries()).map(([code, set]) => ({
      code,
      count: set.size,
    }))
  );
}

async function searchWithVietnameseAccentFolding(
  repos: MindKidRepositories,
  params: SearchParams,
  limit: number,
  viewer: SearchViewer,
  userAllowedTiers: AccessTier[]
): Promise<SearchGameLevelsResponse> {
  const rawQuery = params.q ?? "";
  const cursorId = params.cursor
    ? Number.parseInt(params.cursor, 10)
    : Number.NaN;
  const hasAgeFilter =
    params.age !== undefined ||
    params.age_min !== undefined ||
    params.age_max !== undefined ||
    params.age_band !== undefined;

  const [
    baseCandidates,
    competencyCandidates,
    ageCandidates,
    tierCandidates,
    strandFacets,
  ] = await Promise.all([
    fetchAllCandidatesWithoutQuery(repos, { ...params, cursor: undefined }),
    params.competency === undefined
      ? Promise.resolve(null)
      : fetchAllCandidatesWithoutQuery(repos, {
          ...params,
          competency: undefined,
          cursor: undefined,
        }),
    hasAgeFilter
      ? fetchAllCandidatesWithoutQuery(repos, {
          ...params,
          age: undefined,
          age_min: undefined,
          age_max: undefined,
          age_band: undefined,
          cursor: undefined,
        })
      : Promise.resolve(null),
    params.access_tier === undefined
      ? Promise.resolve(null)
      : fetchAllCandidatesWithoutQuery(repos, {
          ...params,
          access_tier: undefined,
          cursor: undefined,
        }),
    computeAccentInsensitiveStrandFacets(repos, params, rawQuery),
  ]);

  const filterQ = (list: GameLevelEntity[]) =>
    list.filter((row) => matchesVietnameseSearch(row, rawQuery));

  const matchedTotal = filterQ(baseCandidates);
  const sorted = sortGameLevelRows(matchedTotal, params);
  const afterCursor = Number.isNaN(cursorId)
    ? sorted
    : sorted.filter((row) => row.id > cursorId);
  const pageRows = afterCursor.slice(0, limit);
  const hasMore = afterCursor.length > limit;
  const lastRow = pageRows.at(-1);

  const items = pageRows.map((row) =>
    formatSearchItem(row, userAllowedTiers, viewer.role)
  );

  if (params.sort === "relevance") {
    items.sort((a, b) => Number(a.locked) - Number(b.locked));
  }

  const isPaidViewer =
    viewer.userPackage === "PKG-premium" ||
    viewer.userPackage === "premium" ||
    viewer.userPackage === "PKG-standard" ||
    viewer.userPackage === "standard";
  const hasPaidOrLockedContent =
    isPaidViewer ||
    items.some((item) => item.locked || item.access_tier !== "free");

  const { age, age_band } = aggregateAgeAndBand(
    toFacetRows(ageCandidates ? filterQ(ageCandidates) : matchedTotal)
  );

  return {
    items,
    next_cursor: hasMore && lastRow ? String(lastRow.id) : null,
    total: matchedTotal.length,
    facets: {
      total: matchedTotal.length,
      competency: aggregateCompetency(
        toFacetRows(
          competencyCandidates ? filterQ(competencyCandidates) : matchedTotal
        )
      ),
      age,
      age_band,
      access_tier: aggregateTier(
        toFacetRows(tierCandidates ? filterQ(tierCandidates) : matchedTotal)
      ),
      strand: strandFacets,
    },
    no_store: hasPaidOrLockedContent,
  };
}

export async function searchGameLevels(
  rawParams: RawSearchParamsInput,
  viewer: SearchViewer
): Promise<SearchGameLevelsResponse>;
export async function searchGameLevels(
  db: OwnerDb,
  rawParams: RawSearchParamsInput,
  viewer: SearchViewer
): Promise<SearchGameLevelsResponse>;
export async function searchGameLevels(
  dbOrParams: OwnerDb | RawSearchParamsInput,
  paramsOrViewer: RawSearchParamsInput | SearchViewer,
  maybeViewer?: SearchViewer
): Promise<SearchGameLevelsResponse> {
  const hasExplicitDb = maybeViewer !== undefined;
  const repos = hasExplicitDb
    ? createRepositories(dbOrParams as OwnerDb)
    : useOwnerRepositories();
  const rawParams = (
    hasExplicitDb ? paramsOrViewer : dbOrParams
  ) as RawSearchParamsInput;
  const viewer = hasExplicitDb ? maybeViewer : (paramsOrViewer as SearchViewer);

  const params = SearchParamsSchema.parse(rawParams ?? {});
  const maxLimit = viewer.role === "manager" ? 100 : 60;
  const limit = Math.min(params.limit ?? 20, maxLimit);
  const isPaidViewer =
    viewer.userPackage === "PKG-premium" ||
    viewer.userPackage === "premium" ||
    viewer.userPackage === "PKG-standard" ||
    viewer.userPackage === "standard";

  if (params.status && params.status !== "published") {
    return {
      items: [],
      next_cursor: null,
      total: 0,
      facets: {
        total: 0,
        competency: {},
        age: {},
        age_band: {},
        access_tier: {},
        strand: {},
      },
      no_store: isPaidViewer,
    };
  }

  const userAllowedTiers = await getViewerAllowedTiers(viewer);

  if (params.q && params.q.trim().length > 0) {
    return await searchWithVietnameseAccentFolding(
      repos,
      params,
      limit,
      viewer,
      userAllowedTiers
    );
  }

  const repoFilter = {
    ...toSearchRepoFilter(params, {
      includeQuery: false,
      includeCursor: true,
    }),
    limit,
  };

  const [searchResult, facets] = await Promise.all([
    repos.gameLevels.search(repoFilter),
    buildGameLevelFacets(repos.gameLevels, params),
  ]);

  const items = searchResult.items.map((row) =>
    formatSearchItem(row, userAllowedTiers, viewer.role)
  );

  if (params.sort === "relevance") {
    items.sort((a, b) => Number(a.locked) - Number(b.locked));
  }

  const hasPaidOrLockedContent =
    isPaidViewer ||
    items.some((item) => item.locked || item.access_tier !== "free");

  return {
    items,
    next_cursor: searchResult.nextCursor,
    total: facets.total,
    facets,
    no_store: hasPaidOrLockedContent,
  };
}
