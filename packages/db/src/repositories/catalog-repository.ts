import { and, eq, type SQL, sql } from "drizzle-orm";
import {
  PACKAGE_STATUS,
  type PackageStatus,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord, JsonValue } from "#src/constants/json";
import {
  type AccessTier,
  CONTENT_ENTITY_TYPE,
  type ContentEntityType,
  TAG_AXIS,
  type TagStatus,
} from "#src/constants/learning-enums";
import type { AppDb } from "#src/drivers/types";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  ciContains,
  ciEquals,
  ciLike,
  clampLimit,
  dateRangeConditions,
  escapeLike,
  requireFirst,
  uniq,
} from "#src/repositories/utils";
import {
  contentSkillMap,
  contentTagMap,
  type contentTags,
  type gameLevelRounds,
  gameLevels,
  packages,
  type skills,
} from "#src/schema/index";

export type PackageEntity = typeof packages.$inferSelect;
export type GameLevelEntity = typeof gameLevels.$inferSelect;
export type GameLevelRoundEntity = typeof gameLevelRounds.$inferSelect;
export type ContentTagEntity = typeof contentTags.$inferSelect;
export type ContentSkillMapEntity = typeof contentSkillMap.$inferSelect;

type SkillEntity = typeof skills.$inferSelect;

export type GameLevelWithSkillMapsEntity = GameLevelEntity & {
  readonly skillMaps: readonly (ContentSkillMapEntity & {
    readonly skill: SkillEntity;
  })[];
};

export type ContentSkillMapWithGameLevelEntity = ContentSkillMapEntity & {
  readonly gameLevel: GameLevelEntity | null;
};

export interface UpsertPackageInput {
  readonly code: string;
  readonly name: string;
  readonly audience: string;
  readonly description?: string | null;
  readonly isPublic?: boolean;
  readonly isFeatured?: boolean;
  readonly status?: PackageStatus;
  readonly offers: JsonValue;
  readonly quotas?: JsonRecord | null;
  readonly updatedAt?: Date;
}

export interface ListGameLevelsFilter {
  readonly accessTier?: AccessTier;
  readonly templateCode?: string;
  readonly difficulty?: number;
  readonly themeId?: string;
  readonly limit?: number;
}

export interface SearchGameLevelsFilter extends ListGameLevelsFilter {
  readonly q?: string;
  readonly ageMin?: number;
  readonly ageMax?: number;
  readonly age?: number;
  readonly ageBand?: string;
  readonly competency?: string;
  readonly strand?: string;
  readonly skillCode?: string;
  readonly what?: string;
  readonly thinking?: string;
  readonly mechanic?: string;
  readonly theme?: string;
  readonly template?: string;
  readonly learningObjective?: string;
  readonly concept?: string;
  readonly cursorId?: number;
  readonly sort?: "relevance" | "newest" | "popular" | "difficulty";
}

export interface SearchGameLevelsResult {
  readonly items: readonly GameLevelEntity[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface GameLevelFacetRow {
  readonly code: string;
  readonly ageMin: number | null;
  readonly ageMax: number | null;
  readonly accessTier: AccessTier;
}

export interface PublishedLevelStats {
  readonly total: number;
  readonly byAgeBand: Readonly<Record<string, number>>;
  readonly byAccessTier: Readonly<Record<string, number>>;
}

export interface SkillWeightInput {
  readonly skillId: number;
  readonly weight: number;
}

type GameLevelsFindManyConfig = NonNullable<
  Parameters<AppDb["query"]["gameLevels"]["findMany"]>[0]
>;
type GameLevelRqbWhere = NonNullable<GameLevelsFindManyConfig["where"]>;
type GameLevelRqbOrderBy = NonNullable<GameLevelsFindManyConfig["orderBy"]>;

const COUNT_SQL = sql<number>`COUNT(*)`;

function appendAgeAndBandParts(
  filter: SearchGameLevelsFilter,
  parts: GameLevelRqbWhere[]
): void {
  if (filter.ageMin !== undefined) {
    parts.push({ ageMin: { gte: filter.ageMin } });
  }
  if (filter.ageMax !== undefined) {
    parts.push({ ageMax: { lte: filter.ageMax } });
  }
  if (filter.age !== undefined) {
    parts.push({ ageMin: { lte: filter.age }, ageMax: { gte: filter.age } });
  }
  const ageBand = filter.ageBand?.trim();
  if (!ageBand) {
    return;
  }
  const [bMin, bMax] = ageBand.split("-").map(Number);
  if (bMin !== undefined && Number.isFinite(bMin)) {
    parts.push({ ageMin: bMin });
  }
  if (bMax !== undefined && Number.isFinite(bMax)) {
    parts.push({ ageMax: bMax });
  }
}

function appendRelationSearchParts(
  filter: SearchGameLevelsFilter,
  parts: GameLevelRqbWhere[]
): void {
  const strand = filter.strand?.trim();
  if (strand) {
    const esc = escapeLike(strand);
    parts.push({
      skillMaps: {
        skill: {
          strand: {
            OR: [
              { code: strand },
              { RAW: (s) => ciLike(s.code, `%.${esc}`) },
              { RAW: (s) => ciLike(s.name, esc) },
            ],
          },
        },
      },
    });
  }
  const skillCode = filter.skillCode?.trim();
  if (skillCode) {
    parts.push({ skillMaps: { skill: { code: skillCode } } });
  }
  const query = filter.q?.trim();
  if (query) {
    parts.push({
      OR: [
        { RAW: (gl) => ciContains(gl.title, query) },
        { RAW: (gl) => ciContains(gl.description, query) },
        { RAW: (gl) => ciContains(gl.code, query) },
      ],
    });
  }
}

function buildGameLevelSearchWhere(
  filter: SearchGameLevelsFilter,
  withCursor = true
): GameLevelRqbWhere | undefined {
  const parts: GameLevelRqbWhere[] = [];
  if (filter.accessTier !== undefined) {
    parts.push({ accessTier: filter.accessTier });
  }
  const templateCode = filter.templateCode?.trim() || filter.template?.trim();
  if (templateCode) {
    parts.push({ templateCode });
  }
  if (filter.difficulty !== undefined) {
    parts.push({ difficulty: filter.difficulty });
  }
  const themeId = filter.themeId?.trim() || filter.theme?.trim();
  if (themeId) {
    parts.push({ themeId });
  }
  const competency = filter.competency?.trim();
  if (competency) {
    const competencyPattern = `GL-${escapeLike(competency)}-%`;
    parts.push({ RAW: (gl) => ciLike(gl.code, competencyPattern) });
  }
  const what = filter.what?.trim();
  if (what) {
    parts.push({
      tagMaps: { tag: { axis: TAG_AXIS.WHAT, code: what } },
    });
  }
  const thinking = filter.thinking?.trim();
  if (thinking) {
    parts.push({
      tagMaps: { tag: { axis: TAG_AXIS.THINKING, code: thinking } },
    });
  }
  const mechanic = filter.mechanic?.trim();
  if (mechanic) {
    parts.push({
      tagMaps: { tag: { axis: TAG_AXIS.MECHANIC, code: mechanic } },
    });
  }
  const learningObjective = filter.learningObjective?.trim();
  if (learningObjective) {
    parts.push({
      skillMaps: {
        skill: { learningObjectives: { code: learningObjective } },
      },
    });
  }
  const concept = filter.concept?.trim();
  if (concept) {
    parts.push({
      skillDataset: {
        OR: [
          { code: concept },
          { RAW: (sd) => ciEquals(sd.conceptLabel, concept) },
        ],
      },
    });
  }
  appendAgeAndBandParts(filter, parts);
  appendRelationSearchParts(filter, parts);
  if (withCursor && filter.cursorId !== undefined) {
    parts.push({ id: { gt: filter.cursorId } });
  }

  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return { AND: parts };
}

function resolveSearchOrder(
  filter: SearchGameLevelsFilter
): GameLevelRqbOrderBy {
  if (filter.cursorId === undefined && filter.sort === "newest") {
    return { createdAt: "desc", id: "asc" };
  }
  if (filter.cursorId === undefined && filter.sort === "difficulty") {
    return { difficulty: "asc", id: "asc" };
  }
  return { id: "asc" };
}

export class PackagesRepository extends BaseRepository {
  async listPublic(): Promise<PackageEntity[]> {
    return await this.db.query.packages.findMany({
      where: { isPublic: true, status: PACKAGE_STATUS.ACTIVE },
      orderBy: { code: "asc" },
    });
  }

  async listAll(): Promise<PackageEntity[]> {
    return await this.db.query.packages.findMany({
      orderBy: { code: "asc" },
    });
  }

  async findByCode(code: string): Promise<PackageEntity | null> {
    return (
      (await this.db.query.packages.findFirst({ where: { code } })) ?? null
    );
  }

  private async upsertOne(input: UpsertPackageInput): Promise<PackageEntity> {
    const now = input.updatedAt ?? new Date();
    const shared = {
      name: input.name,
      audience: input.audience,
      description: input.description ?? null,
      isPublic: input.isPublic ?? true,
      isFeatured: input.isFeatured ?? false,
      status: input.status ?? PACKAGE_STATUS.ACTIVE,
      offers: input.offers,
      quotas: input.quotas ?? null,
      updatedAt: now,
    };
    return await requireFirst(
      this.db
        .insert(packages)
        .values({ code: input.code, ...shared, createdAt: now })
        .onConflictDoUpdate({ target: packages.code, set: shared })
        .returning(),
      `Upsert failed: ${input.code}`
    );
  }

  upsertCatalog(item: UpsertPackageInput): Promise<PackageEntity>;
  upsertCatalog(items: readonly UpsertPackageInput[]): Promise<PackageEntity[]>;
  async upsertCatalog(
    input: UpsertPackageInput | readonly UpsertPackageInput[]
  ): Promise<PackageEntity | PackageEntity[]> {
    if (!Array.isArray(input)) {
      return await this.upsertOne(input as UpsertPackageInput);
    }
    const out: PackageEntity[] = [];
    for (const item of input) {
      out.push(await this.upsertOne(item));
    }
    return out;
  }
}

export class GameLevelsRepository extends BaseRepository {
  async findByCode(code: string): Promise<GameLevelEntity | null> {
    return (
      (await this.db.query.gameLevels.findFirst({ where: { code } })) ?? null
    );
  }

  async findById(id: number): Promise<GameLevelEntity | null> {
    return (
      (await this.db.query.gameLevels.findFirst({ where: { id } })) ?? null
    );
  }

  async mapByIds(
    ids: readonly number[]
  ): Promise<Map<number, GameLevelEntity>> {
    const uniqueIds = uniq(ids);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.query.gameLevels.findMany({
      where: { id: { in: uniqueIds } },
    });
    return new Map(rows.map((row) => [row.id, row]));
  }

  async findRelated(
    excludeCode: string,
    limit = 4
  ): Promise<GameLevelEntity[]> {
    return await this.db.query.gameLevels.findMany({
      where: { code: { ne: excludeCode } },
      orderBy: { id: "asc" },
      limit: clampLimit(limit, 4, 24),
    });
  }

  async listByCompetencyPrefix(code: string): Promise<GameLevelEntity[]> {
    const pattern = `GL-${escapeLike(code.trim().toUpperCase())}-%`;
    return await this.db.query.gameLevels.findMany({
      where: { RAW: (gl) => ciLike(gl.code, pattern) },
      orderBy: { code: "asc" },
      limit: 2000,
    });
  }

  async listPublished(
    filter: ListGameLevelsFilter = {}
  ): Promise<GameLevelEntity[]> {
    const templateCode = filter.templateCode?.trim();
    const themeId = filter.themeId?.trim();
    return await this.db.query.gameLevels.findMany({
      where: {
        ...(filter.accessTier === undefined
          ? {}
          : { accessTier: filter.accessTier }),
        ...(templateCode ? { templateCode } : {}),
        ...(filter.difficulty === undefined
          ? {}
          : { difficulty: filter.difficulty }),
        ...(themeId ? { themeId } : {}),
      },
      orderBy: { difficulty: "asc", code: "asc" },
      limit: clampLimit(filter.limit, 200, 500),
    });
  }

  async listAllOrdered(limit = 500): Promise<GameLevelEntity[]> {
    return await this.db.query.gameLevels.findMany({
      orderBy: { code: "asc" },
      limit: clampLimit(limit, 500, 2000),
    });
  }

  private rangeWhere(filter?: {
    readonly from?: Date | string;
    readonly to?: Date | string;
  }): SQL | undefined {
    return filter
      ? andConditions(
          dateRangeConditions(gameLevels.updatedAt, filter.from, filter.to)
        )
      : undefined;
  }

  async listForExport(
    filter: { readonly from?: Date | string; readonly to?: Date | string },
    maxLimit = 100_000
  ): Promise<GameLevelEntity[]> {
    const rows = await this.db
      .select()
      .from(gameLevels)
      .where(this.rangeWhere(filter))
      .orderBy(sql`${gameLevels.updatedAt} DESC`)
      .limit(clampLimit(maxLimit, 100_000, 100_000));
    return rows;
  }

  async countAll(filter?: {
    readonly from?: Date | string;
    readonly to?: Date | string;
  }): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(gameLevels)
      .where(this.rangeWhere(filter));
    return Number(row?.total ?? 0);
  }

  async countPublishedStats(): Promise<PublishedLevelStats> {
    const rows = await this.db
      .select({
        ageMin: gameLevels.ageMin,
        ageMax: gameLevels.ageMax,
        accessTier: gameLevels.accessTier,
        total: COUNT_SQL,
      })
      .from(gameLevels)
      .groupBy(gameLevels.ageMin, gameLevels.ageMax, gameLevels.accessTier);
    const byAgeBand: Record<string, number> = {};
    const byAccessTier: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const count = Number(row.total);
      total += count;
      if (row.ageMin !== null && row.ageMax !== null) {
        const band = `${row.ageMin}-${row.ageMax}`;
        byAgeBand[band] = (byAgeBand[band] ?? 0) + count;
      }
      const tierKey = String(row.accessTier);
      byAccessTier[tierKey] = (byAccessTier[tierKey] ?? 0) + count;
    }
    return { total, byAgeBand, byAccessTier };
  }

  async countByTheme(): Promise<Map<string, number>> {
    const rows = await this.db
      .select({ themeId: gameLevels.themeId, total: COUNT_SQL })
      .from(gameLevels)
      .groupBy(gameLevels.themeId);
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.themeId) {
        map.set(row.themeId, Number(row.total));
      }
    }
    return map;
  }

  async search(
    filter: SearchGameLevelsFilter
  ): Promise<SearchGameLevelsResult> {
    const limit = clampLimit(filter.limit, 20, 100);
    const where = buildGameLevelSearchWhere(filter, true);
    const rows = await this.db.query.gameLevels.findMany({
      ...(where ? { where } : {}),
      orderBy: resolveSearchOrder(filter),
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last ? String(last.id) : null,
      hasMore,
    };
  }

  async listFacetRows(
    filter: SearchGameLevelsFilter
  ): Promise<GameLevelFacetRow[]> {
    const where = buildGameLevelSearchWhere(filter, false);
    return await this.db.query.gameLevels.findMany({
      columns: {
        code: true,
        ageMin: true,
        ageMax: true,
        accessTier: true,
      },
      ...(where ? { where } : {}),
    });
  }

  async countFacetStrands(
    filter: SearchGameLevelsFilter
  ): Promise<Array<{ readonly code: string; readonly count: number }>> {
    const where = buildGameLevelSearchWhere(
      { ...filter, strand: undefined },
      false
    );
    const levels = await this.db.query.gameLevels.findMany({
      columns: { id: true },
      ...(where ? { where } : {}),
      with: {
        skillMaps: {
          with: {
            skill: {
              with: {
                strand: {
                  columns: { code: true },
                },
              },
            },
          },
        },
      },
    });

    const strandCounts = new Map<string, number>();
    for (const level of levels) {
      const seenInLevel = new Set<string>();
      for (const skillMap of level.skillMaps) {
        const strandCode = skillMap.skill.strand.code;
        if (!seenInLevel.has(strandCode)) {
          seenInLevel.add(strandCode);
          strandCounts.set(strandCode, (strandCounts.get(strandCode) ?? 0) + 1);
        }
      }
    }

    return Array.from(strandCounts.entries()).map(([code, count]) => ({
      code,
      count,
    }));
  }

  async listRoundsByLevelId(levelId: number): Promise<GameLevelRoundEntity[]> {
    return await this.db.query.gameLevelRounds.findMany({
      where: { gameLevelId: levelId },
      orderBy: { roundIndex: "asc" },
    });
  }

  async listByTeachTemplates(
    teachTemplateCodes: readonly string[],
    skillIds: readonly number[]
  ): Promise<GameLevelWithSkillMapsEntity[]> {
    const uniqueTemplates = uniq(teachTemplateCodes);
    const uniqueSkills = uniq(skillIds);
    if (uniqueTemplates.length === 0 || uniqueSkills.length === 0) {
      return [];
    }
    return await this.db.query.gameLevels.findMany({
      where: {
        templateCode: { in: uniqueTemplates },
        skillMaps: { skillId: { in: uniqueSkills } },
      },
      with: {
        skillMaps: {
          where: { skillId: { in: uniqueSkills } },
          with: { skill: true },
        },
      },
    });
  }
}

export class TaggingRepository extends BaseRepository {
  async listTags(filter?: {
    readonly status?: TagStatus;
    readonly codes?: readonly string[];
  }): Promise<ContentTagEntity[]> {
    const uniqueCodes = filter?.codes ? uniq(filter.codes) : null;
    if (uniqueCodes?.length === 0) {
      return [];
    }
    return await this.db.query.contentTags.findMany({
      where: {
        ...(filter?.status === undefined ? {} : { status: filter.status }),
        ...(uniqueCodes ? { code: { in: uniqueCodes } } : {}),
      },
      orderBy: { axis: "asc", code: "asc" },
    });
  }

  async replaceEntityTags(
    entityType: ContentEntityType,
    entityId: number,
    tagIds: readonly number[]
  ): Promise<void> {
    const uniqueTagIds = uniq(tagIds);
    const now = new Date();
    await this.transaction(async (tx) => {
      await tx
        .delete(contentTagMap)
        .where(
          and(
            eq(contentTagMap.entityType, entityType),
            eq(contentTagMap.entityId, entityId)
          )
        );
      if (uniqueTagIds.length > 0) {
        await tx.insert(contentTagMap).values(
          uniqueTagIds.map((tagId) => ({
            entityType,
            entityId,
            tagId,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
    });
  }

  async listSkillMaps(
    entityType?: ContentEntityType,
    entityId?: number
  ): Promise<ContentSkillMapEntity[]> {
    return await this.db.query.contentSkillMap.findMany({
      where: {
        ...(entityType === undefined ? {} : { entityType }),
        ...(entityId === undefined ? {} : { entityId }),
      },
      ...(entityId === undefined ? {} : { orderBy: { weight: "desc" } }),
    });
  }

  async listLevelIdsBySkillIds(
    skillIds: readonly number[],
    entityType: ContentEntityType = CONTENT_ENTITY_TYPE.GAME_LEVEL
  ): Promise<number[]> {
    const uniqueIds = uniq(skillIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    const rows = await this.db.query.contentSkillMap.findMany({
      columns: { entityId: true },
      where: {
        entityType,
        skillId: { in: uniqueIds },
      },
    });
    return rows.map((row) => row.entityId);
  }

  private collectSkillCodes<TKey extends number | string>(
    entries: ReadonlyArray<{ readonly key: TKey; readonly skillCode: string }>
  ): Map<TKey, string[]> {
    const map = new Map<TKey, string[]>();
    for (const entry of entries) {
      const list = map.get(entry.key) ?? [];
      list.push(entry.skillCode);
      map.set(entry.key, list);
    }
    return map;
  }

  async mapSkillCodesByLevelIds(
    levelIds: readonly number[]
  ): Promise<Map<number, string[]>> {
    const uniqueIds = uniq(levelIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.query.contentSkillMap.findMany({
      columns: { entityId: true },
      where: {
        entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
        entityId: { in: uniqueIds },
      },
      with: { skill: { columns: { code: true } } },
      orderBy: { weight: "desc" },
    });
    return this.collectSkillCodes(
      rows.map((row) => ({
        key: row.entityId,
        skillCode: row.skill.code,
      }))
    );
  }

  async mapSkillCodesByLevelCodes(
    levelCodes: readonly string[]
  ): Promise<Map<string, string[]>> {
    const uniqueCodes = uniq(levelCodes);
    if (uniqueCodes.length === 0) {
      return new Map();
    }
    const levels = await this.db.query.gameLevels.findMany({
      columns: { code: true },
      where: { code: { in: uniqueCodes } },
      with: {
        skillMaps: {
          columns: { weight: true },
          with: { skill: { columns: { code: true } } },
          orderBy: { weight: "desc" },
        },
      },
    });
    const entries: Array<{ readonly key: string; readonly skillCode: string }> =
      [];
    for (const level of levels) {
      for (const skillMap of level.skillMaps) {
        entries.push({ key: level.code, skillCode: skillMap.skill.code });
      }
    }
    return this.collectSkillCodes(entries);
  }

  async listLevelsForSkill(
    skillId: number
  ): Promise<ContentSkillMapWithGameLevelEntity[]> {
    return await this.db.query.contentSkillMap.findMany({
      where: {
        skillId,
        entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
      },
      with: { gameLevel: true },
    });
  }

  async countDistinctGameLevelsBySkill(): Promise<Map<number, number>> {
    const rows = await this.db.query.contentSkillMap.findMany({
      columns: { skillId: true, entityId: true },
      where: { entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL },
      with: { gameLevel: { columns: { id: true } } },
    });
    const perSkill = new Map<number, Set<number>>();
    for (const row of rows) {
      if (row.gameLevel === null) {
        continue;
      }
      const levelSet = perSkill.get(row.skillId) ?? new Set<number>();
      levelSet.add(row.entityId);
      perSkill.set(row.skillId, levelSet);
    }
    const counts = new Map<number, number>();
    for (const [skillId, levelSet] of perSkill.entries()) {
      counts.set(skillId, levelSet.size);
    }
    return counts;
  }

  async replaceEntitySkills(
    entityType: ContentEntityType,
    entityId: number,
    entries: readonly SkillWeightInput[]
  ): Promise<void> {
    const now = new Date();
    await this.transaction(async (tx) => {
      await tx
        .delete(contentSkillMap)
        .where(
          and(
            eq(contentSkillMap.entityType, entityType),
            eq(contentSkillMap.entityId, entityId)
          )
        );
      if (entries.length > 0) {
        await tx.insert(contentSkillMap).values(
          entries.map((entry) => ({
            entityType,
            entityId,
            skillId: entry.skillId,
            weight: Number.isFinite(entry.weight)
              ? entry.weight.toFixed(2)
              : "1.00",
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
    });
  }
}
