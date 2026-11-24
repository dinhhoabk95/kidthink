import {
  CONTENT_ENTITY_TYPE,
  type CompetencyEntity,
  type ContentSkillMapEntity,
  type GameLevelEntity,
  type MasteryStateEntity,
  type PlaySessionEntity,
  type SkillEntity,
  type SkillPrerequisiteEntity,
  type StrandEntity,
} from "@mindkid/db";
import {
  type AdvancedReportResult,
  type AggregatedTaxonomyData,
  buildCompetencyItems,
  buildIndependenceSection,
  buildReadyForNextSection,
  buildReinforcementSection,
  buildSkillItems,
  buildStrandItems,
  buildWeeklyTrend,
  type SkillActionSuggestionRecord,
  type VersionChangeMarker,
} from "#server/services/advanced-report-narratives";
import { useOwnerRepositories } from "#server/utils/repositories";

export type {
  AdvancedReportResult,
  CompetencyReportItem,
  IndependenceSection,
  ReadyForNextSkillItem,
  ReinforcementAction,
  ReinforcementSkillItem,
  SkillActionSuggestionRecord,
  SkillReportItem,
  StrandReportItem,
  VersionChangeMarker,
  WeeklyTrendSection,
  WeeklyTrendWeekData,
} from "#server/services/advanced-report-narratives";

/**
 * Gộp theo MÃ level, không theo `game_levels.id`: nâng content_version archive
 * dòng cũ và tạo dòng mới (id khác), nên gộp theo id làm mất dấu đổi phiên bản.
 */
export function buildVersionMarkers(
  recentSessions: Array<{
    gameLevelId: number | null;
    contentVersion?: number | null;
  }>,
  levelById: Map<number, Pick<GameLevelEntity, "code">>
): VersionChangeMarker[] {
  const versionsByCode = new Map<string, Set<number>>();
  for (const s of recentSessions) {
    const lId = Number(s.gameLevelId);
    const v = s.contentVersion;
    if (lId && v !== null && v !== undefined) {
      const code = levelById.get(lId)?.code ?? `Level #${lId}`;
      const set = versionsByCode.get(code) ?? new Set<number>();
      set.add(v);
      versionsByCode.set(code, set);
    }
  }

  const markers: VersionChangeMarker[] = [];
  for (const [code, vSet] of versionsByCode.entries()) {
    if (vSet.size > 1) {
      const sortedVersions = Array.from(vSet).sort((a, b) => a - b);
      markers.push({
        level_code: code,
        played_versions: sortedVersions,
        note: `Bài tập ${code} đã có cập nhật nội dung trong khoảng thời gian này (phiên bản đã trải nghiệm: v${sortedVersions.join(", v")}).`,
      });
    }
  }

  return markers;
}

function indexSkillsAndTaxonomy(
  allSkills: SkillEntity[],
  strandById: Map<number, StrandEntity>
) {
  const skillById = new Map<number, SkillEntity>();
  const skillsByCompetencyId = new Map<number, SkillEntity[]>();
  const skillsByStrandId = new Map<number, SkillEntity[]>();

  for (const sk of allSkills) {
    const sId = Number(sk.id);
    skillById.set(sId, sk);

    const stId = Number(sk.strandId);
    const strandList = skillsByStrandId.get(stId) ?? [];
    strandList.push(sk);
    skillsByStrandId.set(stId, strandList);

    const st = strandById.get(stId);
    if (st) {
      const cId = Number(st.competencyId);
      const compList = skillsByCompetencyId.get(cId) ?? [];
      compList.push(sk);
      skillsByCompetencyId.set(cId, compList);
    }
  }

  return { skillById, skillsByCompetencyId, skillsByStrandId };
}

function indexSessionTouches(
  recentSessions: PlaySessionEntity[],
  skillsByLevelId: Map<number, number[]>,
  skillById: Map<number, SkillEntity>,
  strandById: Map<number, StrandEntity>
) {
  const sessionIdsBySkillId = new Map<number, Set<number>>();
  const sessionIdsByStrandId = new Map<number, Set<number>>();
  const sessionIdsByCompetencyId = new Map<number, Set<number>>();

  for (const session of recentSessions) {
    const lId = Number(session.gameLevelId);
    const levelSkillIds = skillsByLevelId.get(lId) ?? [];
    const sessId = Number(session.id);

    for (const skId of levelSkillIds) {
      const skillSet = sessionIdsBySkillId.get(skId) ?? new Set<number>();
      skillSet.add(sessId);
      sessionIdsBySkillId.set(skId, skillSet);

      const sk = skillById.get(skId);
      if (sk) {
        const stId = Number(sk.strandId);
        const strandSet = sessionIdsByStrandId.get(stId) ?? new Set<number>();
        strandSet.add(sessId);
        sessionIdsByStrandId.set(stId, strandSet);

        const st = strandById.get(stId);
        if (st) {
          const cId = Number(st.competencyId);
          const compSet =
            sessionIdsByCompetencyId.get(cId) ?? new Set<number>();
          compSet.add(sessId);
          sessionIdsByCompetencyId.set(cId, compSet);
        }
      }
    }
  }

  return {
    sessionIdsBySkillId,
    sessionIdsByStrandId,
    sessionIdsByCompetencyId,
  };
}

type AdvancedReportLevelRow = Pick<GameLevelEntity, "id" | "code">;

function buildReportLookupMaps(params: {
  allCompetencies: CompetencyEntity[];
  allStrands: StrandEntity[];
  allLevels: AdvancedReportLevelRow[];
  allMappings: ContentSkillMapEntity[];
  childMasteryList: MasteryStateEntity[];
  actionSuggestionsList: SkillActionSuggestionRecord[];
  allPrereqs: SkillPrerequisiteEntity[];
  skillById: Map<number, SkillEntity>;
}) {
  const competencyById = new Map<number, CompetencyEntity>();
  for (const c of params.allCompetencies) {
    competencyById.set(Number(c.id), c);
  }

  const strandById = new Map<number, StrandEntity>();
  for (const s of params.allStrands) {
    strandById.set(Number(s.id), s);
  }

  const levelById = new Map<number, AdvancedReportLevelRow>();
  for (const l of params.allLevels) {
    levelById.set(Number(l.id), l);
  }

  const skillsByLevelId = new Map<number, number[]>();
  for (const m of params.allMappings) {
    const lId = Number(m.entityId);
    const sId = Number(m.skillId);
    const list = skillsByLevelId.get(lId) ?? [];
    list.push(sId);
    skillsByLevelId.set(lId, list);
  }

  const masteryMap = new Map<number, MasteryStateEntity>();
  for (const ms of params.childMasteryList) {
    masteryMap.set(Number(ms.skillId), ms);
  }

  const actionsBySkillId = new Map<number, SkillActionSuggestionRecord[]>();
  for (const act of params.actionSuggestionsList) {
    const skId = Number(act.skillId);
    const list = actionsBySkillId.get(skId) ?? [];
    list.push(act);
    actionsBySkillId.set(skId, list);
  }

  const prereqSuccessorsBySkillId = new Map<number, SkillEntity[]>();
  for (const pr of params.allPrereqs) {
    const reqSkillId = Number(pr.prerequisiteId);
    const targetSkill = params.skillById.get(Number(pr.skillId));
    if (targetSkill) {
      const list = prereqSuccessorsBySkillId.get(reqSkillId) ?? [];
      list.push(targetSkill);
      prereqSuccessorsBySkillId.set(reqSkillId, list);
    }
  }

  return {
    competencyById,
    strandById,
    levelById,
    skillsByLevelId,
    masteryMap,
    actionsBySkillId,
    prereqSuccessorsBySkillId,
  };
}

export async function buildAdvancedReport(params: {
  childId: number;
  period: "30d" | "90d";
}): Promise<AdvancedReportResult> {
  const { childId, period } = params;
  const repos = useOwnerRepositories();

  const child = await repos.childProfiles.findById(childId);
  if (!child) {
    throw new Error(`Child profile #${childId} not found`);
  }

  const now = new Date();
  const days = period === "90d" ? 90 : 30;
  const startDate = new Date(now.getTime() - days * 86_400_000);

  const [
    allCompetencies,
    allStrands,
    allSkills,
    allMappings,
    allLevels,
    recentSessions,
    childMasteryList,
    allPrereqs,
  ] = await Promise.all([
    repos.taxonomy.listCompetencies(),
    repos.taxonomy.listStrands(),
    repos.taxonomy.listSkills(),
    repos.tagging.listSkillMaps(CONTENT_ENTITY_TYPE.GAME_LEVEL),
    repos.gameLevels.listAllOrdered(2000),
    repos.playSessions.listByChildSince(childId, startDate),
    repos.mastery.listForChild(childId),
    repos.taxonomy.listPrerequisites(),
  ]);

  const rawStrandById = new Map<number, StrandEntity>();
  for (const s of allStrands) {
    rawStrandById.set(Number(s.id), s);
  }

  const { skillById, skillsByCompetencyId, skillsByStrandId } =
    indexSkillsAndTaxonomy(allSkills, rawStrandById);

  const {
    competencyById,
    strandById,
    levelById,
    skillsByLevelId,
    masteryMap,
    actionsBySkillId,
    prereqSuccessorsBySkillId,
  } = buildReportLookupMaps({
    allCompetencies,
    allStrands,
    allLevels,
    allMappings,
    childMasteryList,
    actionSuggestionsList: [],
    allPrereqs,
    skillById,
  });

  const {
    sessionIdsBySkillId,
    sessionIdsByStrandId,
    sessionIdsByCompetencyId,
  } = indexSessionTouches(
    recentSessions,
    skillsByLevelId,
    skillById,
    strandById
  );

  const aggregatedData: AggregatedTaxonomyData = {
    allCompetencies,
    allStrands,
    allSkills,
    competencyById,
    strandById,
    skillsByCompetencyId,
    skillsByStrandId,
    sessionIdsBySkillId,
    sessionIdsByStrandId,
    sessionIdsByCompetencyId,
    masteryMap,
  };

  return {
    child: {
      uuid: child.uuid,
      display_name: child.displayName,
      birth_year: child.birthYear,
      avatar_id: child.avatarId ?? "default",
    },
    period,
    from_date: startDate.toISOString().split("T")[0] ?? "",
    to_date: now.toISOString().split("T")[0] ?? "",
    sections: {
      competencies: buildCompetencyItems(aggregatedData),
      strands: buildStrandItems(aggregatedData),
      skills: buildSkillItems(aggregatedData),
      weekly_trend: buildWeeklyTrend(recentSessions, startDate),
      independence_level: buildIndependenceSection(
        recentSessions,
        childMasteryList
      ),
      needs_reinforcement: buildReinforcementSection(
        aggregatedData,
        actionsBySkillId
      ),
      ready_for_next: buildReadyForNextSection(
        aggregatedData,
        prereqSuccessorsBySkillId
      ),
    },
    version_markers: buildVersionMarkers(recentSessions, levelById),
  };
}
