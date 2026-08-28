import {
  childBadges,
  childProfiles,
  competencies,
  getOwnerDb,
  masteryState,
  skills,
  strands,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  setResponseStatus,
} from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export type StageVisualStatus = "not_started" | "learning" | "stable";

export interface MapMilestoneStage {
  strand_code: string;
  strand_name: string;
  competency_code: string;
  status: StageVisualStatus;
  has_star: boolean;
  is_current_focus: boolean;
}

export interface MapBadgePayload {
  badge_code: string;
  awarded_at: string;
}

export interface ChildPlayMapResponse {
  child: {
    uuid: string;
    display_name: string;
    avatar_id: string | null;
  };
  active_regions: Array<{
    competency_code: string;
    competency_name: string;
    stages: MapMilestoneStage[];
  }>;
  badges: MapBadgePayload[];
}

interface SkillMasteryInfo {
  bestPLearn: number;
  attemptsTotal: number;
}

function evaluateStrandStage(params: {
  strand: typeof strands.$inferSelect;
  stSkills: (typeof skills.$inferSelect)[];
  competenciesList: (typeof competencies.$inferSelect)[];
  masteryBySkillId: Map<number, SkillMasteryInfo>;
  foundFirstLearning: boolean;
}): { stage: MapMilestoneStage; isFirstLearning: boolean } {
  const {
    strand,
    stSkills,
    competenciesList,
    masteryBySkillId,
    foundFirstLearning,
  } = params;
  const compId = Number(strand.competencyId);

  let hasTouch = false;
  let allStable = stSkills.length > 0;

  for (const sk of stSkills) {
    const m = masteryBySkillId.get(Number(sk.id));
    if (m && (m.attemptsTotal > 0 || m.bestPLearn > 0.1)) {
      hasTouch = true;
    }
    if (!m || m.bestPLearn < 0.8) {
      allStable = false;
    }
  }

  let status: StageVisualStatus = "not_started";
  let hasStar = false;
  let isCurrentFocus = false;
  let markedFirstLearning = false;

  if (allStable) {
    status = "stable";
    hasStar = true;
  } else if (hasTouch) {
    status = "learning";
    if (!foundFirstLearning) {
      isCurrentFocus = true;
      markedFirstLearning = true;
    }
  }

  const stage: MapMilestoneStage = {
    strand_code: strand.code,
    strand_name: strand.name,
    competency_code:
      competenciesList.find((c) => Number(c.id) === compId)?.code ?? "C1",
    status,
    has_star: hasStar,
    is_current_focus: isCurrentFocus,
  };

  return { stage, isFirstLearning: markedFirstLearning };
}

function buildActiveRegions(params: {
  allCompetencies: (typeof competencies.$inferSelect)[];
  allStrands: (typeof strands.$inferSelect)[];
  allSkills: (typeof skills.$inferSelect)[];
  masteryBySkillId: Map<number, SkillMasteryInfo>;
}) {
  const { allCompetencies, allStrands, allSkills, masteryBySkillId } = params;

  const skillsByStrandId = new Map<number, typeof allSkills>();
  for (const sk of allSkills) {
    const strandId = Number(sk.strandId);
    const list = skillsByStrandId.get(strandId) ?? [];
    list.push(sk);
    skillsByStrandId.set(strandId, list);
  }

  let foundFirstLearning = false;
  const strandsByCompetencyId = new Map<number, MapMilestoneStage[]>();

  for (const st of allStrands) {
    const compId = Number(st.competencyId);
    const stSkills = skillsByStrandId.get(Number(st.id)) ?? [];

    const { stage, isFirstLearning } = evaluateStrandStage({
      strand: st,
      stSkills,
      competenciesList: allCompetencies,
      masteryBySkillId,
      foundFirstLearning,
    });

    if (isFirstLearning) {
      foundFirstLearning = true;
    }

    const list = strandsByCompetencyId.get(compId) ?? [];
    list.push(stage);
    strandsByCompetencyId.set(compId, list);
  }

  return allCompetencies.slice(0, 2).map((c) => ({
    competency_code: c.code,
    competency_name: c.name,
    stages: strandsByCompetencyId.get(Number(c.id)) ?? [],
  }));
}

/**
 * BR-PRG-02, BR-PRG-03, BR-PRG-04, BR-PRG-05, D-MJ, D-MK & spec §7.1
 * Child Progress Map:
 * - Reads best_p_learn to guarantee strictly monotonic visual status (never regresses).
 * - Forbids raw p_learn, percentages, numeric scoreboards, and cross-child ranking.
 * - Displays 1-2 active learning regions for preschool age group.
 */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const candidateUuid = getCookie(event, "active_child_id");

  if (!candidateUuid) {
    setResponseStatus(event, 428);
    throw createError({
      statusCode: 428,
      statusMessage: "CHILD_SELECTION_REQUIRED",
      data: {
        code: "CHILD_SELECTION_REQUIRED",
        message: "Vui lòng chọn hồ sơ trẻ trước khi xem bản đồ tiến độ.",
      },
    });
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify DB ownership and active child status
  const [activeChild] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, candidateUuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!activeChild) {
    deleteCookie(event, "active_child_id", { path: "/" });
    setResponseStatus(event, 428);
    throw createError({
      statusCode: 428,
      statusMessage: "CHILD_SELECTION_REQUIRED",
      data: {
        code: "CHILD_SELECTION_REQUIRED",
        message:
          "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại.",
      },
    });
  }

  const childId = Number(activeChild.id);

  // 2+3+4. Taxonomy, mastery và badge không phụ thuộc nhau — chỉ phụ thuộc
  // `childId` ở bước 1. Chờ tuần tự là năm lượt round-trip nối đuôi trên pool
  // `max: 1`; gom vào một `Promise.all` để driver pipeline chúng.
  const [allCompetencies, allStrands, allSkills, childMasteryRows, badgeRows] =
    await Promise.all([
      db.select().from(competencies).orderBy(competencies.position),
      db.select().from(strands).orderBy(strands.position),
      db.select().from(skills).orderBy(skills.position),
      db
        .select()
        .from(masteryState)
        .where(eq(masteryState.childProfileId, childId)),
      db
        .select()
        .from(childBadges)
        .where(eq(childBadges.childProfileId, childId))
        .orderBy(childBadges.awardedAt),
    ]);

  const masteryBySkillId = new Map(
    childMasteryRows.map((row) => [
      Number(row.skillId),
      {
        bestPLearn: Number(row.bestPLearn),
        attemptsTotal: row.attemptsTotal,
      },
    ])
  );

  const activeRegions = buildActiveRegions({
    allCompetencies,
    allStrands,
    allSkills,
    masteryBySkillId,
  });

  const badges: MapBadgePayload[] = badgeRows.map((b) => ({
    badge_code: b.badgeCode,
    awarded_at: new Date(b.awardedAt).toISOString(),
  }));

  const response: ChildPlayMapResponse = {
    child: {
      uuid: activeChild.uuid,
      display_name: activeChild.displayName,
      avatar_id: activeChild.avatarId,
    },
    active_regions: activeRegions,
    badges,
  };

  return response;
});
