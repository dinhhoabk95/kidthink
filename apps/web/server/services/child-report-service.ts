import { masteryLabel } from "@mindkid/adaptive";
import { isValidParentGateToken } from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import type {
  MasteryStateEntity,
  SkillEntity,
  SkillPrerequisiteEntity,
} from "@mindkid/db";
import { CHILD_STATUS } from "@mindkid/db";
import { ParentGateRequiredError } from "@mindkid/errors/auth";
import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import {
  type BasicReportPeriod,
  computeRemainingPlaySeconds,
  getDateIct,
  parseDateIct,
  validateCustomPlayCap,
} from "@mindkid/shared";
import { buildAdvancedReport } from "#server/services/advanced-report";
import { buildBasicReport } from "#server/services/basic-report";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export async function updateChildPlaySettings(params: {
  userId: number;
  childUuid: string;
  dailyPlayCapMinutes: number;
  gateToken?: string;
  parentGateSecret?: string;
}) {
  const secret = params.parentGateSecret ?? requireEnv("PARENT_GATE_SECRET");
  const gateToken = params.gateToken ?? "";
  if (
    !(gateToken && isValidParentGateToken(gateToken, params.userId, secret))
  ) {
    throw new ParentGateRequiredError(
      "Cần xác nhận cổng người lớn để cập nhật cài đặt thời gian chơi."
    );
  }

  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError();
  }

  const activeEntitlements = await repos.entitlements.listActiveForUser(
    params.userId
  );
  const keys = new Set(activeEntitlements.map((row) => row.entitlementKey));
  let tier: "login" | "standard" | "premium" = "login";
  if (keys.has("play_premium_games")) {
    tier = "premium";
  } else if (keys.has("play_standard_games")) {
    tier = "standard";
  }

  if (!validateCustomPlayCap(params.dailyPlayCapMinutes, tier)) {
    throw new ValidationError({
      message: `Hạn mức ${params.dailyPlayCapMinutes} phút vượt quá trần của gói (${tier}).`,
    });
  }

  const updated = await repos.childProfiles.update(child.id, params.userId, {
    dailyPlayCapMinutes: params.dailyPlayCapMinutes,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new InternalError("Cập nhật cài đặt thất bại");
  }

  return {
    uuid: updated.uuid,
    daily_play_cap_minutes: updated.dailyPlayCapMinutes,
  };
}

export async function getChildPlayBudget(params: {
  userId: number;
  childUuid: string;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError();
  }

  const dateIct = getDateIct();
  const stats = await repos.analyticsRollup.getChildDailyStat(
    child.id,
    dateIct
  );
  const usedSeconds = stats?.totalPlayTimeSeconds || 0;
  const usedMinutes = Math.floor(usedSeconds / 60);
  const capMinutes = child.dailyPlayCapMinutes;
  const remainingSeconds = computeRemainingPlaySeconds(
    stats ?? null,
    capMinutes
  );
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const tomorrowIct = getDateIct(Date.now() + 86_400_000);
  const resetsAt = parseDateIct(tomorrowIct).toISOString();

  return {
    cap_minutes: capMinutes,
    used_minutes: usedMinutes,
    remaining_minutes: remainingMinutes,
    resets_at: resetsAt,
  };
}

export async function grantChildExtraPlayTime(params: {
  userId: number;
  childUuid: string;
  minutes: number;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (!child) {
    throw new NotFoundError();
  }

  const dateIct = getDateIct();
  const stats = await repos.analyticsRollup.getChildDailyStat(
    child.id,
    dateIct
  );
  const alreadyGranted = stats?.extraTimeGrantedMinutes || 0;
  if (alreadyGranted + params.minutes > 30) {
    throw new ValidationError({
      message: `Đã cấp ${alreadyGranted} phút hôm nay; tối đa 30 phút/ngày.`,
    });
  }

  await repos.analyticsRollup.grantExtraTimeMinutes(
    child.id,
    dateIct,
    params.minutes
  );

  return {
    success: true,
    granted_minutes: params.minutes,
    daily_granted_total: alreadyGranted + params.minutes,
  };
}

interface ReinforcementSkill {
  code: string;
  name: string;
  mastery_label: string;
  attempts_total: number;
}

interface ReadyForNextSkill {
  code: string;
  name: string;
  next_skill_code?: string;
  next_skill_name?: string;
}

function buildSkillProgressEntry(params: {
  skill: SkillEntity;
  masteryBySkillId: Map<number, MasteryStateEntity>;
  allPrereqs: SkillPrerequisiteEntity[];
  skillsById: Map<number, SkillEntity>;
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
  const m = masteryBySkillId.get(skill.id);
  const pLearn = m ? Number(m.pLearn) : 0.1;
  const attemptsTotal = m ? m.attemptsTotal : 0;
  const label = masteryLabel({
    p_learn: pLearn,
    attempts_total: attemptsTotal,
  });

  if (attemptsTotal >= 3 && pLearn < 0.4) {
    skillsNeedingReinforcement.push({
      code: skill.code,
      name: skill.name,
      mastery_label: label,
      attempts_total: attemptsTotal,
    });
  }

  if (pLearn >= 0.8) {
    for (const succ of allPrereqs) {
      if (succ.prerequisiteId !== skill.id) {
        continue;
      }
      const nextSkill = skillsById.get(succ.skillId);
      const nextMastery = nextSkill
        ? masteryBySkillId.get(nextSkill.id)
        : undefined;
      if (nextSkill && (!nextMastery || Number(nextMastery.pLearn) < 0.8)) {
        skillsReadyForNext.push({
          code: skill.code,
          name: skill.name,
          next_skill_code: nextSkill.code,
          next_skill_name: nextSkill.name,
        });
      }
    }
  }

  return {
    code: skill.code,
    name: skill.name,
    mastery_label: label,
    attempts_total: attemptsTotal,
  };
}

export async function getChildMasteryProgressReport(params: {
  userId: number;
  childUuid: string;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (
    !child ||
    (child.status !== CHILD_STATUS.ACTIVE &&
      child.status !== CHILD_STATUS.ARCHIVED)
  ) {
    throw new ChildNotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const userEntitlements = await resolveUserActiveEntitlements(params.userId);
  if (!userEntitlements.includes("view_basic_report")) {
    throw new EntitlementRequiredError(
      "Tài khoản cần có gói Standard hoặc Premium để xem báo cáo tiến độ chi tiết."
    );
  }

  const [
    allCompetencies,
    allStrands,
    allSkills,
    allPrereqs,
    masteryRows,
    badgeRows,
  ] = await Promise.all([
    repos.taxonomy.listCompetencies(),
    repos.taxonomy.listStrands(),
    repos.taxonomy.listSkills(),
    repos.taxonomy.listPrerequisites(),
    repos.mastery.listForChild(child.id),
    repos.badges.listForChild(child.id),
  ]);

  const masteryBySkillId = new Map(masteryRows.map((r) => [r.skillId, r]));
  const skillsById = new Map(allSkills.map((s) => [s.id, s]));
  const skillsNeedingReinforcement: ReinforcementSkill[] = [];
  const skillsReadyForNext: ReadyForNextSkill[] = [];

  const competenciesData = allCompetencies.map((comp) => ({
    code: comp.code,
    label: comp.name,
    strands: allStrands
      .filter((st) => st.competencyId === comp.id)
      .map((st) => ({
        code: st.code,
        name: st.name,
        skills: allSkills
          .filter((sk) => sk.strandId === st.id)
          .map((sk) =>
            buildSkillProgressEntry({
              skill: sk,
              masteryBySkillId,
              allPrereqs,
              skillsById,
              skillsNeedingReinforcement,
              skillsReadyForNext,
            })
          ),
      })),
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
    badges: badgeRows.map((b) => ({
      badge_code: b.badgeCode,
      awarded_at: new Date(b.awardedAt).toISOString(),
    })),
  };
}

export async function getChildBasicReportForUser(params: {
  userId: number;
  childUuid: string;
  period: BasicReportPeriod;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (
    !child ||
    (child.status !== CHILD_STATUS.ACTIVE &&
      child.status !== CHILD_STATUS.ARCHIVED)
  ) {
    throw new ChildNotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const activeEntitlements = await resolveUserActiveEntitlements(params.userId);
  if (!activeEntitlements.includes("view_basic_report")) {
    const allUserEntitlements = await repos.entitlements.listAllForUser(
      params.userId
    );
    const hasBasicHistory = allUserEntitlements.some(
      (row) => row.entitlementKey === "view_basic_report"
    );
    if (hasBasicHistory) {
      throw new EntitlementRequiredError(
        "Quyền xem báo cáo cơ bản của tài khoản đã hết hiệu lực."
      );
    }
  }

  return await buildBasicReport({
    childId: child.id,
    period: params.period,
  });
}

export async function getChildAdvancedReportForUser(params: {
  userId: number;
  childUuid: string;
  period: "30d" | "90d";
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (
    !child ||
    (child.status !== CHILD_STATUS.ACTIVE &&
      child.status !== CHILD_STATUS.ARCHIVED)
  ) {
    throw new ChildNotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const userEntitlements = await resolveUserActiveEntitlements(params.userId);
  if (!userEntitlements.includes("view_advanced_report")) {
    throw new EntitlementRequiredError(
      {
        required_entitlement: "view_advanced_report",
        required_package: "standard",
      },
      "Tài khoản cần có gói Standard hoặc Premium để xem báo cáo nâng cao."
    );
  }

  return await buildAdvancedReport({
    childId: child.id,
    period: params.period,
  });
}
