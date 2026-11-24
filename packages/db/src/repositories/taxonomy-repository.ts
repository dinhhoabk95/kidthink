import { asc } from "drizzle-orm";
import type { SkillTier } from "#src/constants/learning-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  clampLimit,
  dateRangeConditions,
  toIdArray,
  uniq,
} from "#src/repositories/utils";
import {
  type competencies,
  type learningObjectives,
  type skillDatasets,
  type skillPrerequisites,
  skills,
  type strands,
} from "#src/schema/index";

export type CompetencyEntity = typeof competencies.$inferSelect;
export type StrandEntity = typeof strands.$inferSelect;
export type SkillEntity = typeof skills.$inferSelect;
export type SkillPrerequisiteEntity = typeof skillPrerequisites.$inferSelect;
export type LearningObjectiveEntity = typeof learningObjectives.$inferSelect;
export type SkillDatasetEntity = typeof skillDatasets.$inferSelect;

export type SkillHierarchyEntity = SkillEntity & {
  readonly strand: StrandEntity & {
    readonly competency: CompetencyEntity;
  };
};

export type SkillUpstreamPrerequisiteEntity = SkillPrerequisiteEntity & {
  readonly prerequisite: SkillEntity;
};

export type SkillDownstreamUnlockEntity = SkillPrerequisiteEntity & {
  readonly skill: SkillEntity;
};

export interface ListSkillsFilter {
  readonly strandId?: number;
  readonly tier?: SkillTier;
  readonly difficulty?: number;
}

export class TaxonomyRepository extends BaseRepository {
  async listCompetencies(): Promise<CompetencyEntity[]> {
    return await this.db.query.competencies.findMany({
      orderBy: { position: "asc", code: "asc" },
    });
  }

  async findCompetencyByCode(code: string): Promise<CompetencyEntity | null> {
    return (
      (await this.db.query.competencies.findFirst({ where: { code } })) ?? null
    );
  }

  async listStrands(competencyId?: number): Promise<StrandEntity[]> {
    return await this.db.query.strands.findMany({
      ...(competencyId === undefined ? {} : { where: { competencyId } }),
      orderBy: { position: "asc", code: "asc" },
    });
  }

  async findStrandByCode(code: string): Promise<StrandEntity | null> {
    return (await this.db.query.strands.findFirst({ where: { code } })) ?? null;
  }

  async listSkills(filter: ListSkillsFilter = {}): Promise<SkillEntity[]> {
    return await this.db.query.skills.findMany({
      where: {
        ...(filter.strandId === undefined ? {} : { strandId: filter.strandId }),
        ...(filter.tier === undefined ? {} : { tier: filter.tier }),
        ...(filter.difficulty === undefined
          ? {}
          : { difficulty: filter.difficulty }),
      },
      orderBy: { position: "asc", code: "asc" },
    });
  }

  async listSkillsForExport(
    filter: { readonly from?: Date | string; readonly to?: Date | string },
    maxLimit = 100_000
  ): Promise<SkillEntity[]> {
    const whereClause = andConditions(
      dateRangeConditions(skills.createdAt, filter.from, filter.to)
    );
    return await this.db
      .select()
      .from(skills)
      .where(whereClause)
      .orderBy(asc(skills.code))
      .limit(clampLimit(maxLimit, 100_000, 100_000));
  }

  async countSkills(filter?: {
    readonly from?: Date | string;
    readonly to?: Date | string;
  }): Promise<number> {
    const whereClause = filter
      ? andConditions(
          dateRangeConditions(skills.createdAt, filter.from, filter.to)
        )
      : undefined;
    const rows = await this.db
      .select({ id: skills.id })
      .from(skills)
      .where(whereClause);
    return rows.length;
  }

  async findSkillByCode(code: string): Promise<SkillEntity | null> {
    return (await this.db.query.skills.findFirst({ where: { code } })) ?? null;
  }

  async findSkillById(id: number): Promise<SkillEntity | null> {
    return (await this.db.query.skills.findFirst({ where: { id } })) ?? null;
  }

  async findSkillsByIds(ids: readonly number[]): Promise<SkillEntity[]> {
    const uniqueIds = uniq(ids);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.skills.findMany({
      where: { id: { in: uniqueIds } },
      orderBy: { position: "asc", code: "asc" },
    });
  }

  async mapSkillsByIds(
    ids: readonly number[]
  ): Promise<Map<number, SkillEntity>> {
    const found = await this.findSkillsByIds(ids);
    return new Map(found.map((skill) => [skill.id, skill]));
  }

  async findSkillsByStrandIds(
    strandIds: readonly number[]
  ): Promise<SkillEntity[]> {
    const uniqueIds = uniq(strandIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.skills.findMany({
      where: { strandId: { in: uniqueIds } },
      orderBy: { position: "asc", code: "asc" },
    });
  }

  async findSkillHierarchyByCode(
    code: string
  ): Promise<SkillHierarchyEntity | null> {
    return (
      (await this.db.query.skills.findFirst({
        where: { code },
        with: {
          strand: {
            with: { competency: true },
          },
        },
      })) ?? null
    );
  }

  async listLearningObjectivesBySkillId(
    skillId: number
  ): Promise<LearningObjectiveEntity[]> {
    return await this.db.query.learningObjectives.findMany({
      where: { skillId },
      orderBy: { position: "asc" },
    });
  }

  async countLearningObjectivesBySkill(): Promise<Map<number, number>> {
    const rows = await this.db.query.learningObjectives.findMany({
      columns: { skillId: true },
    });
    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.skillId, (counts.get(row.skillId) ?? 0) + 1);
    }
    return counts;
  }

  async listPrerequisites(): Promise<SkillPrerequisiteEntity[]> {
    return await this.db.query.skillPrerequisites.findMany();
  }

  async listPrerequisitesForSkillIds(
    skillIds: readonly number[]
  ): Promise<SkillPrerequisiteEntity[]> {
    const uniqueIds = toIdArray(skillIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.skillPrerequisites.findMany({
      where: { skillId: { in: uniqueIds } },
    });
  }

  async listUpstreamPrerequisites(
    skillId: number
  ): Promise<SkillUpstreamPrerequisiteEntity[]> {
    return await this.db.query.skillPrerequisites.findMany({
      where: { skillId },
      with: { prerequisite: true },
    });
  }

  async listDownstreamUnlocks(
    skillId: number
  ): Promise<SkillDownstreamUnlockEntity[]> {
    return await this.db.query.skillPrerequisites.findMany({
      where: { prerequisiteId: skillId },
      with: { skill: true },
    });
  }

  async listSuccessorSkillIds(
    prerequisiteIds: readonly number[],
    limit = 10
  ): Promise<number[]> {
    const uniqueIds = uniq(prerequisiteIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    const rows = await this.db.query.skillPrerequisites.findMany({
      columns: { skillId: true },
      where: { prerequisiteId: { in: uniqueIds } },
      limit: clampLimit(limit, 10, 100),
    });
    return rows.map((row) => row.skillId);
  }

  async collectTransitivePrerequisiteSkillIds(
    initialSkillIds: readonly number[]
  ): Promise<number[]> {
    const allSkillIds = new Set<number>(initialSkillIds);
    let frontier = uniq(initialSkillIds);

    while (frontier.length > 0) {
      const prereqs = await this.listPrerequisitesForSkillIds(frontier);
      const nextFrontier: number[] = [];
      for (const row of prereqs) {
        if (!allSkillIds.has(row.prerequisiteId)) {
          allSkillIds.add(row.prerequisiteId);
          nextFrontier.push(row.prerequisiteId);
        }
      }
      frontier = nextFrontier;
    }

    return Array.from(allSkillIds);
  }

  async findSkillDatasetByCode(
    code: string
  ): Promise<SkillDatasetEntity | null> {
    return (
      (await this.db.query.skillDatasets.findFirst({ where: { code } })) ?? null
    );
  }

  async listSkillDatasetsBySkillId(
    skillId: number
  ): Promise<SkillDatasetEntity[]> {
    return await this.db.query.skillDatasets.findMany({
      where: { skillId },
      orderBy: { code: "asc" },
    });
  }
}
