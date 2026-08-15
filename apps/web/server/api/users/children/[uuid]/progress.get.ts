import { masteryLabel } from "@kidthink/adaptive";
import { AppError } from "@kidthink/auth";
import {
  childBadges,
  childProfiles,
  competencies,
  getOwnerDb,
  masteryState,
  skillPrerequisites,
  skills,
  strands,
} from "@kidthink/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

interface SkillMasteryData {
  pLearn: number;
  emaCorrect: number;
  attemptsTotal: number;
  bestPLearn: number;
}

interface ReinforcementSkill {
  code: string;
  name_vi: string;
  mastery_label: string;
  attempts_total: number;
}

interface ReadyForNextSkill {
  code: string;
  name_vi: string;
  next_skill_code?: string;
  next_skill_name?: string;
}

function processSkillProgress(params: {
  skill: typeof skills.$inferSelect;
  masteryBySkillId: Map<number, SkillMasteryData>;
  allPrereqs: (typeof skillPrerequisites.$inferSelect)[];
  skillsById: Map<number, typeof skills.$inferSelect>;
  skillsNeedingReinforcement: ReinforcementSkill[];
  skillsReadyForNext: ReadyForNextSkill[];
}) {
  const {
    skill,
    masteryBySkillId,
    allPrereqs,
    skillsById,
    skillsNeedingReinforcement,
    skillsReadyForNext,
  } = params;

  const m = masteryBySkillId.get(Number(skill.id));
  const pLearn = m ? m.pLearn : 0.1;
  const attemptsTotal = m ? m.attemptsTotal : 0;
  const label = masteryLabel({
    p_learn: pLearn,
    attempts_total: attemptsTotal,
  });

  if (attemptsTotal >= 3 && pLearn < 0.4) {
    skillsNeedingReinforcement.push({
      code: skill.code,
      name_vi: skill.nameVi,
      mastery_label: label,
      attempts_total: attemptsTotal,
    });
  }

  if (pLearn >= 0.8) {
    const successors = allPrereqs.filter(
      (pr) => Number(pr.prerequisiteSkillId) === Number(skill.id)
    );
    for (const succ of successors) {
      const nextSkill = skillsById.get(Number(succ.skillId));
      if (nextSkill) {
        const nextMastery = masteryBySkillId.get(Number(nextSkill.id));
        if (!nextMastery || nextMastery.pLearn < 0.8) {
          skillsReadyForNext.push({
            code: skill.code,
            name_vi: skill.nameVi,
            next_skill_code: nextSkill.code,
            next_skill_name: nextSkill.nameVi,
          });
        }
      }
    }
  }

  return {
    code: skill.code,
    name: skill.nameVi,
    mastery_label: label,
    attempts_total: attemptsTotal,
  };
}

function buildCompetenciesProgressReport(params: {
  allCompetencies: (typeof competencies.$inferSelect)[];
  allStrands: (typeof strands.$inferSelect)[];
  allSkills: (typeof skills.$inferSelect)[];
  allPrereqs: (typeof skillPrerequisites.$inferSelect)[];
  masteryBySkillId: Map<number, SkillMasteryData>;
}) {
  const {
    allCompetencies,
    allStrands,
    allSkills,
    allPrereqs,
    masteryBySkillId,
  } = params;

  const skillsNeedingReinforcement: ReinforcementSkill[] = [];
  const skillsReadyForNext: ReadyForNextSkill[] = [];
  const skillsById = new Map(allSkills.map((s) => [Number(s.id), s]));

  const competenciesData = allCompetencies.map((comp) => {
    const compStrands = allStrands.filter(
      (st) => Number(st.competencyId) === Number(comp.id)
    );

    const strandsData = compStrands.map((st) => {
      const strandSkills = allSkills.filter(
        (sk) => Number(sk.strandId) === Number(st.id)
      );

      const skillsData = strandSkills.map((sk) =>
        processSkillProgress({
          skill: sk,
          masteryBySkillId,
          allPrereqs,
          skillsById,
          skillsNeedingReinforcement,
          skillsReadyForNext,
        })
      );

      return {
        code: st.code,
        name: st.nameVi,
        skills: skillsData,
      };
    });

    return {
      code: comp.code,
      label: comp.nameVi,
      strands: strandsData,
    };
  });

  return {
    competenciesData,
    skillsNeedingReinforcement,
    skillsReadyForNext,
  };
}

/**
 * BR-PRG-05, BR-PRG-08, D-MO & spec §7.3, §7.4, §8
 * Adult Progress & Mastery Report:
 * - Requires view_basic_report entitlement (free preview lacks access -> 403).
 * - Standard non-diagnostic Vietnamese labels.
 * - Surfaces skills needing reinforcement (<0.4 with >=3 attempts) and ready for next in DAG.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const childUuid = getRouterParam(event, "uuid");

    if (!childUuid) {
      setResponseStatus(event, 400);
      throw createError({
        statusCode: 400,
        statusMessage: "CHILD_UUID_REQUIRED",
        data: {
          code: "CHILD_UUID_REQUIRED",
          message: "Mã định danh trẻ là bắt buộc.",
        },
      });
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // 1. Verify child ownership
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, childUuid),
          eq(childProfiles.userId, userId),
          inArray(childProfiles.status, ["active", "archived"])
        )
      );

    if (!child) {
      setResponseStatus(event, 404);
      throw createError({
        statusCode: 404,
        statusMessage: "CHILD_NOT_FOUND",
        data: {
          code: "CHILD_NOT_FOUND",
          message: "Không tìm thấy hồ sơ trẻ.",
        },
      });
    }

    // 2. Gate report access via view_basic_report entitlement
    const userEntitlements = await resolveUserActiveEntitlements(userId);
    const hasReportAccess = userEntitlements.includes("view_basic_report");

    if (!hasReportAccess) {
      setResponseStatus(event, 403);
      throw createError({
        statusCode: 403,
        statusMessage: "ENTITLEMENT_REQUIRED",
        data: {
          code: "ENTITLEMENT_REQUIRED",
          message:
            "Tài khoản cần có gói Standard hoặc Premium để xem báo cáo tiến độ chi tiết.",
        },
      });
    }

    const childId = Number(child.id);

    // 3. Query taxonomy data
    const allCompetencies = await db
      .select()
      .from(competencies)
      .orderBy(competencies.position);

    const allStrands = await db
      .select()
      .from(strands)
      .orderBy(strands.position);

    const allSkills = await db.select().from(skills).orderBy(skills.position);
    const allPrereqs = await db.select().from(skillPrerequisites);

    // 4. Query child's mastery state
    const masteryRows = await db
      .select()
      .from(masteryState)
      .where(eq(masteryState.childProfileId, childId));

    const masteryBySkillId = new Map(
      masteryRows.map((r) => [
        Number(r.skillId),
        {
          pLearn: Number(r.pLearn),
          emaCorrect: Number(r.emaCorrect),
          attemptsTotal: r.attemptsTotal,
          bestPLearn: Number(r.bestPLearn),
        },
      ])
    );

    // 5. Structure competencies, strands, skills
    const { competenciesData, skillsNeedingReinforcement, skillsReadyForNext } =
      buildCompetenciesProgressReport({
        allCompetencies,
        allStrands,
        allSkills,
        allPrereqs,
        masteryBySkillId,
      });

    // 6. Query badges (BR-PRG-04)
    const badgeRows = await db
      .select()
      .from(childBadges)
      .where(eq(childBadges.childProfileId, childId))
      .orderBy(childBadges.awardedAt);

    const badges = badgeRows.map((b) => ({
      badge_code: b.badgeCode,
      awarded_at: new Date(b.awardedAt).toISOString(),
    }));

    return {
      child: {
        uuid: child.uuid,
        display_name: child.displayName,
        avatar_id: child.avatarId,
      },
      competencies: competenciesData,
      skills_needing_reinforcement: skillsNeedingReinforcement,
      skills_ready_for_next: skillsReadyForNext,
      badges,
    };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    if (errorObj?.statusCode) {
      throw err;
    }
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
