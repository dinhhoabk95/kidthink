import {
  ACCESS_TIER_CODEC,
  CHILD_STATUS,
  type ChildProfileEntity,
  CONTENT_ENTITY_TYPE,
  CONTENT_ENTITY_TYPE_CODEC,
  ENROLLMENT_STATUS_CODEC,
} from "@mindkid/db";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  allowedTiers,
  type CurriculumPlayerItemRef,
  type CurriculumPlayerWeekGoal,
  getEffectiveTier,
} from "@mindkid/shared";
import type { H3Event } from "h3";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface EnrolledChildCurriculumDetails {
  id: number;
  childId: number;
  curriculumId: number;
  enrolledAt: Date;
  status: string;
  curriculum_code: string;
  curriculum_version: number;
  curriculum_title: string;
  duration_weeks: number;
  sessions_per_week: number;
}

export interface ResolvedCurriculumData {
  child: ChildProfileEntity;
  enrollment: EnrolledChildCurriculumDetails;
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}

export interface OptionalEnrollmentCurriculumData {
  child: ChildProfileEntity;
  enrollment: EnrolledChildCurriculumDetails | null;
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}

export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options: { requireActive?: boolean; requireEnrollment: false }
): Promise<OptionalEnrollmentCurriculumData>;
export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options?: { requireActive?: boolean; requireEnrollment?: true }
): Promise<ResolvedCurriculumData>;
export async function resolveEnrolledChildCurriculum(
  _event: H3Event,
  userId: number,
  childUuid: string,
  options: { requireActive?: boolean; requireEnrollment?: boolean } = {
    requireActive: true,
    requireEnrollment: true,
  }
): Promise<ResolvedCurriculumData | OptionalEnrollmentCurriculumData> {
  const { childProfiles, curricula, gameLevels } = useOwnerRepositories();

  const child = await childProfiles.findByUuidForUser(childUuid, userId);
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(childUuid);
  }

  const rawEnrollment = await curricula.findEnrollmentForChild(
    child.id,
    options.requireActive === true
  );

  if (!rawEnrollment) {
    if (options.requireEnrollment === false) {
      const allowed = await resolveUserActiveEntitlements(userId);
      const userAllowedTiers = await allowedTiers(
        {
          kind: "user",
          user_id: String(userId),
          active_child_id: String(child.id),
        },
        allowed
      );
      return {
        child,
        enrollment: null,
        items: [],
        weeks: [],
        completedItemIds: new Set<number>(),
        userAllowedTiers,
      };
    }
    throw new CurriculumNotFoundError();
  }

  const enrollment: EnrolledChildCurriculumDetails = {
    id: rawEnrollment.id,
    childId: rawEnrollment.childId,
    curriculumId: rawEnrollment.curriculumId,
    enrolledAt: rawEnrollment.enrolledAt,
    status: ENROLLMENT_STATUS_CODEC.toLabel(rawEnrollment.status),
    curriculum_code: rawEnrollment.curriculum.code,
    curriculum_title: rawEnrollment.curriculum.title,
    duration_weeks: rawEnrollment.curriculum.durationWeeks,
    sessions_per_week: rawEnrollment.curriculum.sessionsPerWeek,
    curriculum_version: 1,
  };

  const [rawItems, rawWeeks, progressRows, activeKeys] = await Promise.all([
    curricula.listItems(enrollment.curriculumId),
    curricula.listWeeks(enrollment.curriculumId),
    curricula.listCompletedProgress(enrollment.id),
    resolveUserActiveEntitlements(userId),
  ]);

  const gameLevelEntityIds = rawItems
    .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL)
    .map((i) => i.entityId);

  const levelsById = await gameLevels.mapByIds(gameLevelEntityIds);
  const curriculumTier = ACCESS_TIER_CODEC.toLabel(
    rawEnrollment.curriculum.accessTier
  );

  const items: CurriculumPlayerItemRef[] = rawItems.map((item) => {
    const gl =
      item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL
        ? levelsById.get(item.entityId)
        : undefined;
    const levelTier = gl ? ACCESS_TIER_CODEC.toLabel(gl.accessTier) : "premium";
    return {
      id: item.id,
      curriculum_id: item.curriculumId,
      week_no: item.weekNo,
      session_no: item.sessionNo,
      position: item.position,
      entity_type: "game_level",
      entity_id: item.entityId,
      code: gl
        ? gl.code
        : `${CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType)}_${item.entityId}`,
      title: gl ? gl.title : "Trò chơi",
      is_required: item.isRequired,
      access_tier: getEffectiveTier(levelTier, curriculumTier),
    };
  });

  const weeks: CurriculumPlayerWeekGoal[] = rawWeeks.map((w) => ({
    week_no: w.weekNo,
    goal: w.goal,
  }));

  const completedItemIds = new Set<number>(
    progressRows.map((p) => p.curriculumItemId)
  );

  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(child.id),
    },
    activeKeys
  );

  return {
    child,
    enrollment,
    items,
    weeks,
    completedItemIds,
    userAllowedTiers,
  };
}
