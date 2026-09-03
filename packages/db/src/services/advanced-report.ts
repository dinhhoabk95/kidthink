import {
  ADVANCED_REPORT_THRESHOLDS,
  determineTrendDirection,
  masteryLabel,
  type SectionStatus,
  type TrendDirection,
  trendDirectionDescription,
} from "@mindkid/adaptive";
import { and, asc, eq, gte } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { masteryState } from "#src/schema/adaptive";
import { childProfiles } from "#src/schema/child";
import { skillActionSuggestions } from "#src/schema/content";
import { gameLevels } from "#src/schema/game";
import { playSessions } from "#src/schema/play";
import { contentSkillMap } from "#src/schema/tagging";
import {
  competencies,
  skillPrerequisites,
  skills,
  strands,
} from "#src/schema/taxonomy";

export interface CompetencyReportItem {
  code: string;
  name: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  alt_text: string;
}

export interface StrandReportItem {
  code: string;
  name: string;
  competency_code: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  alt_text: string;
}

export interface SkillReportItem {
  code: string;
  name: string;
  strand_code: string;
  competency_code: string;
  status: SectionStatus;
  mastery_label: string;
  sessions_have: number;
  sessions_needed: number;
  attempts_total: number;
  exposure_only: boolean;
  alt_text: string;
}

export interface WeeklyTrendWeekData {
  week_label: string;
  sessions_count: number;
  completions_count: number;
  completion_rate: number;
}

export interface WeeklyTrendSection {
  status: SectionStatus;
  weeks_have: number;
  weeks_needed: number;
  direction?: TrendDirection;
  direction_text?: string;
  weeks_data: WeeklyTrendWeekData[];
  alt_text: string;
}

export interface IndependenceSection {
  status: SectionStatus;
  sessions_have: number;
  sessions_needed: number;
  independent_sessions_count: number;
  total_completed_sessions: number;
  independent_completion_rate?: number;
  alt_text: string;
}

export interface ReinforcementAction {
  kind: "home_activity" | "in_app";
  text: string;
  ref_entity_id?: number;
}

export interface ReinforcementSkillItem {
  skill_code: string;
  name: string;
  mastery_label: string;
  actions: ReinforcementAction[];
  alt_text: string;
}

export interface ReadyForNextSkillItem {
  skill_code: string;
  name: string;
  mastery_label: string;
  next_skill_code: string;
  next_skill_name: string;
  alt_text: string;
}

export interface VersionChangeMarker {
  level_code: string;
  played_versions: number[];
  note: string;
}

export interface AdvancedReportResult {
  child: {
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
  };
  period: "30d" | "90d";
  from_date: string;
  to_date: string;
  sections: {
    competencies: CompetencyReportItem[];
    strands: StrandReportItem[];
    skills: SkillReportItem[];
    weekly_trend: WeeklyTrendSection;
    independence_level: IndependenceSection;
    needs_reinforcement: ReinforcementSkillItem[];
    ready_for_next: ReadyForNextSkillItem[];
  };
  version_markers: VersionChangeMarker[];
}

interface AggregatedTaxonomyData {
  allCompetencies: (typeof competencies.$inferSelect)[];
  allStrands: (typeof strands.$inferSelect)[];
  allSkills: (typeof skills.$inferSelect)[];
  competencyById: Map<number, typeof competencies.$inferSelect>;
  strandById: Map<number, typeof strands.$inferSelect>;
  skillsByCompetencyId: Map<number, (typeof skills.$inferSelect)[]>;
  skillsByStrandId: Map<number, (typeof skills.$inferSelect)[]>;
  sessionIdsBySkillId: Map<number, Set<number>>;
  sessionIdsByStrandId: Map<number, Set<number>>;
  sessionIdsByCompetencyId: Map<number, Set<number>>;
  masteryMap: Map<number, typeof masteryState.$inferSelect>;
}

function calculateAverageMastery(
  skillList: (typeof skills.$inferSelect)[],
  masteryMap: Map<number, typeof masteryState.$inferSelect>
): number {
  let sumMastery = 0;
  let count = 0;
  for (const sk of skillList) {
    const ms = masteryMap.get(Number(sk.id));
    if (ms) {
      sumMastery += Number(ms.pLearn);
      count++;
    }
  }
  return count > 0 ? sumMastery / count : 0.2;
}

function buildCompetencyItems(
  data: AggregatedTaxonomyData
): CompetencyReportItem[] {
  const {
    allCompetencies,
    sessionIdsByCompetencyId,
    skillsByCompetencyId,
    masteryMap,
  } = data;

  return allCompetencies.map((comp) => {
    const cId = Number(comp.id);
    const touchedSessions = sessionIdsByCompetencyId.get(cId)?.size ?? 0;
    const isReady =
      touchedSessions >= ADVANCED_REPORT_THRESHOLDS.MIN_COMPETENCY_SESSIONS;
    const needed = Math.max(
      0,
      ADVANCED_REPORT_THRESHOLDS.MIN_COMPETENCY_SESSIONS - touchedSessions
    );

    if (!isReady) {
      return {
        code: comp.code,
        name: comp.name,
        status: "insufficient_data",
        mastery_label: "Chưa có đủ dữ liệu",
        sessions_have: touchedSessions,
        sessions_needed: needed,
        alt_text: `Năng lực ${comp.name} (${comp.code}): Chưa có đủ dữ liệu (cần thêm ${needed} phiên hoạt động).`,
      };
    }

    const compSkills = skillsByCompetencyId.get(cId) ?? [];
    const avgPLearn = calculateAverageMastery(compSkills, masteryMap);
    const label = masteryLabel({
      p_learn: avgPLearn,
      attempts_total: touchedSessions,
    });

    return {
      code: comp.code,
      name: comp.name,
      status: "ready",
      mastery_label: label,
      sessions_have: touchedSessions,
      sessions_needed: 0,
      alt_text: `Năng lực ${comp.name} (${comp.code}): Đánh giá mức ${label} dựa trên ${touchedSessions} phiên hoạt động.`,
    };
  });
}

function buildStrandItems(data: AggregatedTaxonomyData): StrandReportItem[] {
  const {
    allStrands,
    sessionIdsByStrandId,
    competencyById,
    skillsByStrandId,
    masteryMap,
  } = data;
  const strandItems: StrandReportItem[] = [];

  for (const st of allStrands) {
    const stId = Number(st.id);
    const touchedSessions = sessionIdsByStrandId.get(stId)?.size ?? 0;
    if (touchedSessions === 0) {
      continue;
    }

    const comp = competencyById.get(Number(st.competencyId));
    const compCode = comp?.code ?? "";
    const isReady =
      touchedSessions >= ADVANCED_REPORT_THRESHOLDS.MIN_STRAND_SESSIONS;
    const needed = Math.max(
      0,
      ADVANCED_REPORT_THRESHOLDS.MIN_STRAND_SESSIONS - touchedSessions
    );

    if (!isReady) {
      strandItems.push({
        code: st.code,
        name: st.name,
        competency_code: compCode,
        status: "insufficient_data",
        mastery_label: "Chưa có đủ dữ liệu",
        sessions_have: touchedSessions,
        sessions_needed: needed,
        alt_text: `Nhánh ${st.name} (${st.code}): Chưa có đủ dữ liệu (cần thêm ${needed} phiên).`,
      });
      continue;
    }

    const stSkills = skillsByStrandId.get(stId) ?? [];
    const avgPLearn = calculateAverageMastery(stSkills, masteryMap);
    const label = masteryLabel({
      p_learn: avgPLearn,
      attempts_total: touchedSessions,
    });

    strandItems.push({
      code: st.code,
      name: st.name,
      competency_code: compCode,
      status: "ready",
      mastery_label: label,
      sessions_have: touchedSessions,
      sessions_needed: 0,
      alt_text: `Nhánh ${st.name} (${st.code}): Mức ${label} qua ${touchedSessions} phiên.`,
    });
  }

  return strandItems;
}

function createSingleSkillReportItem(
  sk: typeof skills.$inferSelect,
  touchedSessions: number,
  strandCode: string,
  compCode: string,
  ms?: typeof masteryState.$inferSelect
): SkillReportItem {
  const pLearn = ms ? Number(ms.pLearn) : 0.1;
  const attemptsTotal = ms?.attemptsTotal ?? touchedSessions;
  const isExposureOnly = touchedSessions === 1;
  const isReady =
    touchedSessions >= ADVANCED_REPORT_THRESHOLDS.MIN_SKILL_SESSIONS;
  const needed = Math.max(
    0,
    ADVANCED_REPORT_THRESHOLDS.MIN_SKILL_SESSIONS - touchedSessions
  );
  const label = isReady
    ? masteryLabel({ p_learn: pLearn, attempts_total: attemptsTotal })
    : "Chưa có đủ dữ liệu";

  let altText = `Kỹ năng ${sk.name}: Chưa có đủ dữ liệu (cần thêm ${needed} phiên).`;
  if (isExposureOnly) {
    altText = `Kỹ năng ${sk.name}: Đã tiếp xúc (1 lần chơi).`;
  } else if (isReady) {
    altText = `Kỹ năng ${sk.name}: ${label} qua ${touchedSessions} phiên.`;
  }

  return {
    code: sk.code,
    name: sk.name,
    strand_code: strandCode,
    competency_code: compCode,
    status: isReady ? "ready" : "insufficient_data",
    mastery_label: label,
    sessions_have: touchedSessions,
    sessions_needed: needed,
    attempts_total: attemptsTotal,
    exposure_only: isExposureOnly,
    alt_text: altText,
  };
}

function buildSkillItems(data: AggregatedTaxonomyData): SkillReportItem[] {
  const {
    allSkills,
    sessionIdsBySkillId,
    strandById,
    competencyById,
    masteryMap,
  } = data;
  const skillItems: SkillReportItem[] = [];

  for (const sk of allSkills) {
    const skId = Number(sk.id);
    const touchedSessions = sessionIdsBySkillId.get(skId)?.size ?? 0;
    if (touchedSessions === 0) {
      continue;
    }

    const st = strandById.get(Number(sk.strandId));
    const comp = st ? competencyById.get(Number(st.competencyId)) : undefined;
    const strandCode = st?.code ?? "";
    const compCode = comp?.code ?? "";
    const ms = masteryMap.get(skId);

    skillItems.push(
      createSingleSkillReportItem(sk, touchedSessions, strandCode, compCode, ms)
    );
  }

  return skillItems;
}

function buildWeeklyTrend(
  recentSessions: (typeof playSessions.$inferSelect)[],
  startDate: Date
): WeeklyTrendSection {
  const weekBuckets = new Map<number, { count: number; completed: number }>();
  const MS_PER_WEEK = 7 * 86_400_000;

  for (const s of recentSessions) {
    const sessionTime = new Date(s.startedAt).getTime();
    const diff = sessionTime - startDate.getTime();
    if (diff < 0) {
      continue;
    }
    const weekIndex = Math.floor(diff / MS_PER_WEEK);
    const current = weekBuckets.get(weekIndex) ?? { count: 0, completed: 0 };
    current.count += 1;
    if (s.completionStatus === "completed") {
      current.completed += 1;
    }
    weekBuckets.set(weekIndex, current);
  }

  const sortedWeekIndices = Array.from(weekBuckets.keys()).sort(
    (a, b) => a - b
  );
  const weeksHave = sortedWeekIndices.length;
  const isTrendReady = weeksHave >= ADVANCED_REPORT_THRESHOLDS.MIN_WEEKS_DATA;
  const weeksNeeded = Math.max(
    0,
    ADVANCED_REPORT_THRESHOLDS.MIN_WEEKS_DATA - weeksHave
  );

  const weeksData: WeeklyTrendWeekData[] = sortedWeekIndices.map((idx, i) => {
    const b = weekBuckets.get(idx) ?? { count: 0, completed: 0 };
    const rate =
      b.count > 0 ? Math.round((b.completed / b.count) * 100) / 100 : 0;
    return {
      week_label: `Tuần ${i + 1}`,
      sessions_count: b.count,
      completions_count: b.completed,
      completion_rate: rate,
    };
  });

  if (!isTrendReady) {
    return {
      status: "insufficient_data",
      weeks_have: weeksHave,
      weeks_needed: weeksNeeded,
      weeks_data: weeksData,
      alt_text: `Xu hướng theo tuần: Chưa có đủ dữ liệu (đã có ${weeksHave}/3 tuần hoạt động, cần thêm ${weeksNeeded} tuần).`,
    };
  }

  const firstHalf = weeksData.slice(0, Math.floor(weeksData.length / 2));
  const secondHalf = weeksData.slice(Math.floor(weeksData.length / 2));
  const avgFirst =
    firstHalf.reduce((acc, w) => acc + w.completion_rate, 0) /
    (firstHalf.length || 1);
  const avgSecond =
    secondHalf.reduce((acc, w) => acc + w.completion_rate, 0) /
    (secondHalf.length || 1);
  const delta = avgSecond - avgFirst;

  const direction = determineTrendDirection(delta);
  const directionText = trendDirectionDescription(direction);

  return {
    status: "ready",
    weeks_have: weeksHave,
    weeks_needed: 0,
    direction,
    direction_text: directionText,
    weeks_data: weeksData,
    alt_text: `Xu hướng theo tuần: ${directionText} (ghi nhận qua ${weeksHave} tuần hoạt động).`,
  };
}

function buildIndependenceSection(
  recentSessions: (typeof playSessions.$inferSelect)[],
  childMasteryList: (typeof masteryState.$inferSelect)[]
): IndependenceSection {
  const completedSessions = recentSessions.filter(
    (s) => s.completionStatus === "completed"
  );
  const totalCompleted = completedSessions.length;
  const isIndependenceReady =
    totalCompleted >= ADVANCED_REPORT_THRESHOLDS.MIN_INDEPENDENCE_SESSIONS;
  const indepNeeded = Math.max(
    0,
    ADVANCED_REPORT_THRESHOLDS.MIN_INDEPENDENCE_SESSIONS - totalCompleted
  );

  let totalHintRate = 0;
  for (const m of childMasteryList) {
    totalHintRate += Number(m.hintRate);
  }
  const avgHintRate =
    childMasteryList.length > 0 ? totalHintRate / childMasteryList.length : 0;
  const independentRate = Math.round(Math.max(0, 1 - avgHintRate) * 100) / 100;
  const independentSessionsCount = Math.round(totalCompleted * independentRate);

  if (!isIndependenceReady) {
    return {
      status: "insufficient_data",
      sessions_have: totalCompleted,
      sessions_needed: indepNeeded,
      independent_sessions_count: independentSessionsCount,
      total_completed_sessions: totalCompleted,
      alt_text: `Mức độ độc lập: Chưa có đủ dữ liệu (đã hoàn thành ${totalCompleted}/10 phiên, cần thêm ${indepNeeded} phiên).`,
    };
  }

  return {
    status: "ready",
    sessions_have: totalCompleted,
    sessions_needed: 0,
    independent_sessions_count: independentSessionsCount,
    total_completed_sessions: totalCompleted,
    independent_completion_rate: independentRate,
    alt_text: `Mức độ độc lập: Bé tự hoàn thành không cần trợ giúp ${independentSessionsCount}/${totalCompleted} phiên (${Math.round(independentRate * 100)}%).`,
  };
}

function buildReinforcementSection(
  data: AggregatedTaxonomyData,
  actionsBySkillId: Map<number, (typeof skillActionSuggestions.$inferSelect)[]>
): ReinforcementSkillItem[] {
  const { allSkills, sessionIdsBySkillId, masteryMap } = data;
  const items: ReinforcementSkillItem[] = [];

  for (const sk of allSkills) {
    const skId = Number(sk.id);
    const touchedSessions = sessionIdsBySkillId.get(skId)?.size ?? 0;
    if (touchedSessions < ADVANCED_REPORT_THRESHOLDS.MIN_REINFORCE_SESSIONS) {
      continue;
    }

    const ms = masteryMap.get(skId);
    if (!ms) {
      continue;
    }
    const pLearn = Number(ms.pLearn);
    if (pLearn >= ADVANCED_REPORT_THRESHOLDS.REINFORCE_P_LEARN_CEILING) {
      continue;
    }

    const skillActions = actionsBySkillId.get(skId) ?? [];
    const formattedActions: ReinforcementAction[] =
      skillActions.length > 0
        ? skillActions.map((a) => ({
            kind: a.kind,
            text: a.text,
            ref_entity_id: a.refEntityId ?? undefined,
          }))
        : [
            {
              kind: "home_activity",
              text: `Cùng bé thực hành hoạt động nhận biết và trải nghiệm kỹ năng ${sk.name} trong sinh hoạt hằng ngày.`,
            },
          ];

    const label = masteryLabel({
      p_learn: pLearn,
      attempts_total: ms.attemptsTotal ?? touchedSessions,
    });
    items.push({
      skill_code: sk.code,
      name: sk.name,
      mastery_label: label,
      actions: formattedActions,
      alt_text: `Kỹ năng ${sk.name} (${sk.code}): Đang ở mức ${label}. Gợi ý hỗ trợ: ${formattedActions[0]?.text ?? ""}`,
    });
  }

  return items;
}

function buildReadyForNextSection(
  data: AggregatedTaxonomyData,
  prereqSuccessorsBySkillId: Map<number, (typeof skills.$inferSelect)[]>
): ReadyForNextSkillItem[] {
  const { allSkills, sessionIdsBySkillId, masteryMap } = data;
  const items: ReadyForNextSkillItem[] = [];

  for (const sk of allSkills) {
    const skId = Number(sk.id);
    const touchedSessions = sessionIdsBySkillId.get(skId)?.size ?? 0;
    if (touchedSessions < ADVANCED_REPORT_THRESHOLDS.MIN_READY_SESSIONS) {
      continue;
    }

    const ms = masteryMap.get(skId);
    if (!ms) {
      continue;
    }
    const pLearn = Number(ms.pLearn);
    if (pLearn < ADVANCED_REPORT_THRESHOLDS.READY_P_LEARN_FLOOR) {
      continue;
    }

    const successors = prereqSuccessorsBySkillId.get(skId) ?? [];
    if (successors.length === 0) {
      continue;
    }

    const nextSkill = successors[0];
    if (!nextSkill) {
      continue;
    }
    const label = masteryLabel({
      p_learn: pLearn,
      attempts_total: ms.attemptsTotal ?? touchedSessions,
    });

    items.push({
      skill_code: sk.code,
      name: sk.name,
      mastery_label: label,
      next_skill_code: nextSkill.code,
      next_skill_name: nextSkill.name,
      alt_text: `Kỹ năng ${sk.name} (${sk.code}) đã đạt mức ${label}. Sẵn sàng bước tiếp sang kỹ năng ${nextSkill.name} (${nextSkill.code}).`,
    });
  }

  return items;
}

function buildVersionMarkers(
  recentSessions: (typeof playSessions.$inferSelect)[],
  levelById: Map<number, typeof gameLevels.$inferSelect>
): VersionChangeMarker[] {
  const versionsByLevelId = new Map<number, Set<number>>();
  for (const s of recentSessions) {
    const lId = Number(s.gameLevelId);
    const v = s.contentVersion;
    if (lId && v !== null && v !== undefined) {
      const set = versionsByLevelId.get(lId) ?? new Set<number>();
      set.add(v);
      versionsByLevelId.set(lId, set);
    }
  }

  const markers: VersionChangeMarker[] = [];
  for (const [lId, vSet] of versionsByLevelId.entries()) {
    if (vSet.size > 1) {
      const lvl = levelById.get(lId);
      const code = lvl?.code ?? `Level #${lId}`;
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
  allSkills: (typeof skills.$inferSelect)[],
  strandById: Map<number, typeof strands.$inferSelect>
) {
  const skillById = new Map<number, typeof skills.$inferSelect>();
  const skillsByCompetencyId = new Map<
    number,
    (typeof skills.$inferSelect)[]
  >();
  const skillsByStrandId = new Map<number, (typeof skills.$inferSelect)[]>();

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
  recentSessions: (typeof playSessions.$inferSelect)[],
  skillsByLevelId: Map<number, number[]>,
  skillById: Map<number, typeof skills.$inferSelect>,
  strandById: Map<number, typeof strands.$inferSelect>
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

function buildReportLookupMaps(params: {
  allCompetencies: (typeof competencies.$inferSelect)[];
  allStrands: (typeof strands.$inferSelect)[];
  allLevels: (typeof gameLevels.$inferSelect)[];
  allMappings: (typeof contentSkillMap.$inferSelect)[];
  childMasteryList: (typeof masteryState.$inferSelect)[];
  actionSuggestionsList: (typeof skillActionSuggestions.$inferSelect)[];
  allPrereqs: (typeof skillPrerequisites.$inferSelect)[];
  skillById: Map<number, typeof skills.$inferSelect>;
}) {
  const competencyById = new Map<number, typeof competencies.$inferSelect>();
  for (const c of params.allCompetencies) {
    competencyById.set(Number(c.id), c);
  }

  const strandById = new Map<number, typeof strands.$inferSelect>();
  for (const s of params.allStrands) {
    strandById.set(Number(s.id), s);
  }

  const levelById = new Map<number, typeof gameLevels.$inferSelect>();
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

  const masteryMap = new Map<number, typeof masteryState.$inferSelect>();
  for (const ms of params.childMasteryList) {
    masteryMap.set(Number(ms.skillId), ms);
  }

  const actionsBySkillId = new Map<
    number,
    (typeof skillActionSuggestions.$inferSelect)[]
  >();
  for (const act of params.actionSuggestionsList) {
    const skId = Number(act.skillId);
    const list = actionsBySkillId.get(skId) ?? [];
    list.push(act);
    actionsBySkillId.set(skId, list);
  }

  const prereqSuccessorsBySkillId = new Map<
    number,
    (typeof skills.$inferSelect)[]
  >();
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
  const db = getOwnerDb();
  const { childId, period } = params;

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, childId));

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
    actionSuggestionsList,
    allPrereqs,
  ] = await Promise.all([
    db.select().from(competencies).orderBy(asc(competencies.position)),
    db.select().from(strands).orderBy(asc(strands.position)),
    db.select().from(skills).orderBy(asc(skills.position)),
    db
      .select()
      .from(contentSkillMap)
      .where(eq(contentSkillMap.entityType, "game_level")),
    db.select().from(gameLevels),
    db
      .select()
      .from(playSessions)
      .where(
        and(
          eq(playSessions.childProfileId, childId),
          gte(playSessions.startedAt, startDate)
        )
      )
      .orderBy(asc(playSessions.startedAt)),
    db
      .select()
      .from(masteryState)
      .where(eq(masteryState.childProfileId, childId)),
    db
      .select()
      .from(skillActionSuggestions)
      .orderBy(asc(skillActionSuggestions.orderNo)),
    db.select().from(skillPrerequisites),
  ]);

  const rawStrandById = new Map<number, typeof strands.$inferSelect>();
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
    actionSuggestionsList,
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

  const competencyItems = buildCompetencyItems(aggregatedData);
  const strandItems = buildStrandItems(aggregatedData);
  const skillItems = buildSkillItems(aggregatedData);
  const weeklyTrend = buildWeeklyTrend(recentSessions, startDate);
  const independenceLevel = buildIndependenceSection(
    recentSessions,
    childMasteryList
  );
  const needsReinforcement = buildReinforcementSection(
    aggregatedData,
    actionsBySkillId
  );
  const readyForNext = buildReadyForNextSection(
    aggregatedData,
    prereqSuccessorsBySkillId
  );
  const versionMarkers = buildVersionMarkers(recentSessions, levelById);

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
      competencies: competencyItems,
      strands: strandItems,
      skills: skillItems,
      weekly_trend: weeklyTrend,
      independence_level: independenceLevel,
      needs_reinforcement: needsReinforcement,
      ready_for_next: readyForNext,
    },
    version_markers: versionMarkers,
  };
}
