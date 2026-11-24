import {
  ACCESS_TIER_CODEC,
  ACTOR_TYPE,
  CHILD_STATUS,
  type ChildProfileEntity,
  CONTENT_ENTITY_TYPE,
  CURRICULUM_PROGRESS_STATUS,
  type CurriculumEntity,
  ENROLLMENT_STATUS,
  ENROLLMENT_STATUS_CODEC,
} from "@mindkid/db";
import { TierLockedError } from "@mindkid/errors/billing";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { AlreadyEnrolledError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  allowedTiers,
  type EntitlementKey,
  getEffectiveTier,
  resolveNextStep,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import type { H3Event } from "h3";
import { resolveEnrolledChildCurriculum } from "#server/utils/curriculum-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface RankedChildFlow {
  readonly code: string;
  readonly title: string;
  readonly session_count: number;
  readonly age_label: string;
  readonly fits_age: boolean;
  readonly age_gap: number;
  readonly recommend_score: number;
  readonly warning?: string;
}

function computeAgeGap(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): number {
  const { childAge, targetAgeMin, targetAgeMax } = input;
  if (targetAgeMin != null && childAge < targetAgeMin) {
    return targetAgeMin - childAge;
  }
  if (targetAgeMax != null && childAge > targetAgeMax) {
    return childAge - targetAgeMax;
  }
  return 0;
}

function buildAgeRecommendationWarning(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): string | undefined {
  if (computeAgeGap(input) === 0) {
    return undefined;
  }
  const { childAge, targetAgeMin, targetAgeMax } = input;
  return `Chương trình này gợi ý cho trẻ ${targetAgeMin ?? 3}–${targetAgeMax ?? 6} tuổi, bé nhà bạn ${childAge} tuổi`;
}

export function computeAgeRecommendationWarning(
  child: Pick<ChildProfileEntity, "birthYear">,
  curriculum: Pick<CurriculumEntity, "targetAgeMin" | "targetAgeMax">
): string | undefined {
  const currentYear = new Date().getFullYear();
  return buildAgeRecommendationWarning({
    childAge: currentYear - child.birthYear,
    targetAgeMin: curriculum.targetAgeMin,
    targetAgeMax: curriculum.targetAgeMax,
  });
}

export function computeEnrollmentAgeGap(
  child: Pick<ChildProfileEntity, "birthYear">,
  curriculum: Pick<CurriculumEntity, "targetAgeMin" | "targetAgeMax">
): number {
  const currentYear = new Date().getFullYear();
  return computeAgeGap({
    childAge: currentYear - child.birthYear,
    targetAgeMin: curriculum.targetAgeMin,
    targetAgeMax: curriculum.targetAgeMax,
  });
}

export async function listChildCurriculumFlows(params: {
  userId: number;
  childUuid: string;
}): Promise<{ flows: RankedChildFlow[] }> {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const rows = await repos.curricula.listPublished();
  const orderedRows = [...rows].sort((a, b) => a.code.localeCompare(b.code));
  if (orderedRows.length === 0) {
    return { flows: [] };
  }

  const itemCountByCurriculum = await repos.curricula.countItemsByCurricula(
    orderedRows.map((row) => row.id)
  );
  const childAge = new Date().getFullYear() - child.birthYear;

  const flows = orderedRows
    .map((row) => {
      const actualItems = itemCountByCurriculum.get(row.id) ?? 0;
      const sessionCount =
        actualItems > 0 ? actualItems : row.durationWeeks * row.sessionsPerWeek;
      const ageGap = computeAgeGap({
        childAge,
        targetAgeMin: row.targetAgeMin,
        targetAgeMax: row.targetAgeMax,
      });
      const warning = buildAgeRecommendationWarning({
        childAge,
        targetAgeMin: row.targetAgeMin,
        targetAgeMax: row.targetAgeMax,
      });
      return {
        code: row.code,
        title: row.title,
        session_count: sessionCount,
        age_label: `${row.targetAgeMin ?? 3}–${row.targetAgeMax ?? 6}`,
        fits_age: ageGap === 0,
        age_gap: ageGap,
        recommend_score: Math.max(0, 100 - ageGap * 25),
        ...(warning ? { warning } : {}),
      };
    })
    .sort((a, b) => a.age_gap - b.age_gap || a.code.localeCompare(b.code));

  return { flows };
}

export async function getNextChildCurriculumStep(params: {
  event: H3Event;
  userId: number;
  childUuid: string;
  isOptional: boolean;
}) {
  const { enrollment, items, weeks, completedItemIds, userAllowedTiers } =
    params.isOptional
      ? await resolveEnrolledChildCurriculum(
          params.event,
          params.userId,
          params.childUuid,
          { requireActive: false, requireEnrollment: false }
        )
      : await resolveEnrolledChildCurriculum(
          params.event,
          params.userId,
          params.childUuid,
          { requireActive: false }
        );

  if (!enrollment) {
    return null;
  }

  const nextStep = resolveNextStep({
    durationWeeks: enrollment.duration_weeks,
    weeks,
    items,
    completedItemIds,
    allowedTiers: userAllowedTiers,
  });

  const { curricula } = useOwnerRepositories();
  if (enrollment.status === "completed" && nextStep.curriculum_progress < 1.0) {
    await curricula.updateEnrollmentStatus(
      enrollment.id,
      ENROLLMENT_STATUS.ACTIVE
    );
  } else if (enrollment.status === "active" && nextStep.is_completed) {
    await curricula.updateEnrollmentStatus(
      enrollment.id,
      ENROLLMENT_STATUS.COMPLETED
    );
  }

  return {
    week_no: nextStep.week_no,
    session_no: nextStep.session_no,
    item: nextStep.item,
    week_progress: nextStep.week_progress,
    curriculum_progress: nextStep.curriculum_progress,
    week_blocked_by_tier: nextStep.week_blocked_by_tier,
    is_completed: nextStep.is_completed,
    next_curriculum_suggestion: nextStep.next_curriculum_suggestion,
  };
}

export async function completeChildCurriculumItem(params: {
  userId: number;
  childUuid: string;
  curriculumItemId: number;
  entitlements?: readonly EntitlementKey[];
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const enrollment = await repos.curricula.findEnrollmentForChild(
    child.id,
    true
  );
  if (!enrollment) {
    throw new NotFoundError("Bé chưa ghi danh chương trình nào.");
  }

  const item = await repos.curricula.findItemById(
    params.curriculumItemId,
    enrollment.curriculumId
  );
  if (!item) {
    throw new NotFoundError("Không tìm thấy hoạt động trong chương trình học.");
  }

  const curriculumTier = ACCESS_TIER_CODEC.toLabel(
    enrollment.curriculum.accessTier
  );
  let levelTier: AccessTier = "premium";
  if (item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL) {
    const gl = await repos.gameLevels.findById(item.entityId);
    if (gl) {
      levelTier = ACCESS_TIER_CODEC.toLabel(gl.accessTier);
    }
  }
  const effectiveTier = getEffectiveTier(levelTier, curriculumTier);
  const activeKeys = params.entitlements
    ? [...params.entitlements]
    : await resolveUserActiveEntitlements(params.userId);
  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(params.userId),
      active_child_id: String(child.id),
    },
    activeKeys
  );
  const canAccessViaPremiumCurriculum =
    curriculumTier === "premium" &&
    activeKeys.includes("access_premium_curriculum") &&
    userAllowedTiers.includes(levelTier);

  if (
    !(userAllowedTiers.includes(effectiveTier) || canAccessViaPremiumCurriculum)
  ) {
    throw new TierLockedError({
      access_tier: effectiveTier,
      required_entitlement: TIER_ENTITLEMENT[effectiveTier],
    });
  }

  await repos.curricula.upsertItemProgress({
    enrollmentId: enrollment.id,
    childId: child.id,
    curriculumItemId: item.id,
    status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
  });

  return {
    ok: true,
    item_id: item.id,
    completed: true,
  };
}

export async function enrollChildInCurriculum(params: {
  userId: number;
  childUuid: string;
  curriculumCode: string;
  ipAddress: string | null;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const existingActive = await repos.curricula.findEnrollmentForChild(
    child.id,
    true
  );
  if (existingActive) {
    throw new AlreadyEnrolledError(
      "Trẻ đang tham gia một chương trình học khác."
    );
  }

  const curriculum = await repos.curricula.findByCode(
    params.curriculumCode.trim()
  );
  if (!curriculum) {
    throw new NotFoundError("Không tìm thấy chương trình học.");
  }

  const ageGap = computeEnrollmentAgeGap(child, curriculum);
  const ageWarning = computeAgeRecommendationWarning(child, curriculum);

  const [activeKeys, items] = await Promise.all([
    resolveUserActiveEntitlements(params.userId),
    repos.curricula.listItems(curriculum.id),
  ]);
  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(params.userId),
      active_child_id: String(child.id),
    },
    activeKeys
  );

  const curriculumTier = ACCESS_TIER_CODEC.toLabel(curriculum.accessTier);
  const mandatoryItems = items.filter((it) => it.isRequired !== false);
  if (mandatoryItems.length > 0) {
    const glEntityIds = mandatoryItems
      .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL)
      .map((i) => i.entityId);
    const glMap = await repos.gameLevels.mapByIds(glEntityIds);

    const hasAccessibleMandatoryItem = mandatoryItems.some((item) => {
      const gl =
        item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL
          ? glMap.get(item.entityId)
          : undefined;
      const levelTier = gl
        ? ACCESS_TIER_CODEC.toLabel(gl.accessTier)
        : "premium";
      const effectiveTier = getEffectiveTier(levelTier, curriculumTier);
      return (
        userAllowedTiers.includes(effectiveTier) ||
        (curriculumTier === "premium" &&
          activeKeys.includes("access_premium_curriculum") &&
          userAllowedTiers.includes(levelTier))
      );
    });
    if (!hasAccessibleMandatoryItem) {
      throw new ValidationError(
        "Không có bài học bắt buộc nào mở được với gói tài khoản hiện tại."
      );
    }
  } else {
    const canAccessCurriculum =
      userAllowedTiers.includes(curriculumTier) ||
      (curriculumTier === "premium" &&
        activeKeys.includes("access_premium_curriculum"));
    if (!canAccessCurriculum) {
      throw new TierLockedError({
        access_tier: curriculumTier,
        required_entitlement: TIER_ENTITLEMENT[curriculumTier],
      });
    }
  }

  const enrollment = await repos.curricula.enrollChild(child.id, curriculum.id);

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.USER,
    actorId: params.userId,
    action: "curriculum.enrolled",
    entityType: "curriculum_enrollment",
    entityId: String(enrollment.id),
    ipAddress: params.ipAddress,
    afterData: {
      child_id: child.id,
      child_uuid: child.uuid,
      curriculum_code: curriculum.code,
      curriculum_version: 1,
      age_gap: ageGap,
      age_warning: ageWarning ?? null,
    },
  });

  return {
    enrollment_id: enrollment.id,
    curriculum_code: curriculum.code,
    curriculum_version: 1,
    status: ENROLLMENT_STATUS_CODEC.toLabel(enrollment.status),
    enrolled_at: enrollment.enrolledAt,
    age_gap: ageGap,
    warning: ageWarning,
  };
}

export async function withdrawChildCurriculumEnrollment(params: {
  userId: number;
  childUuid: string;
  ipAddress: string | null;
  enrollmentId?: number;
}) {
  const repos = useOwnerRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    params.childUuid,
    params.userId
  );
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  const activeEnrollment = await repos.curricula.findEnrollmentForChild(
    child.id,
    true,
    params.enrollmentId
  );
  if (!activeEnrollment) {
    throw new NotFoundError("Bé không có lộ trình học nào đang hoạt động.");
  }

  const updated = await repos.curricula.withdrawEnrollment(activeEnrollment.id);
  if (!updated) {
    throw new InternalError("WITHDRAW_FAILED");
  }

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.USER,
    actorId: params.userId,
    action: "curriculum.withdrawn",
    entityType: "curriculum_enrollment",
    entityId: String(activeEnrollment.id),
    ipAddress: params.ipAddress,
    afterData: {
      child_id: child.id,
      child_uuid: child.uuid,
      curriculum_code: activeEnrollment.curriculum.code,
      curriculum_version: 1,
    },
  });

  return {
    status: ENROLLMENT_STATUS_CODEC.toLabel(updated.status),
    enrollment_id: updated.id,
  };
}
