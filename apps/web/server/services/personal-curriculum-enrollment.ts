/**
 * Spec sở hữu: docs/specs/07-addon/personal-curriculum.md
 * Business rules: BR-PCU-02..08 (enrollment & next-step progression)
 */

import { writeAudit } from "@mindkid/audit";
import {
  ACCESS_TIER_CODEC,
  CHILD_STATUS,
  CONTENT_ENTITY_TYPE,
  type ContentEntityType,
  CURRICULUM_PROGRESS_STATUS_CODEC,
  ENROLLMENT_STATUS_CODEC,
  type GameLevelEntity,
  PERSONAL_CURRICULUM_STATUS,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import {
  EntitlementRequiredError,
  TierLockedError,
} from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { ValidationError } from "@mindkid/errors/common";
import { PersonalCurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  type CurriculumNextStepResult,
  type CurriculumPlayerItemRef,
  type PersonalCurriculumItemDetail,
  resolvePersonalCurriculumNextStep,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import { useRepositories } from "#server/utils/repositories";

const COMPETENCY_GAME_REGEX = /^(?:GL-)?(C[1-6])/i;

export interface PersonalCurriculumCallerContext {
  userId: number;
  entitlements?: string[];
  currentTier?: AccessTier;
  ip?: string;
  userAgent?: string;
}

export interface RawPersonalItemInput {
  id?: number;
  personalCurriculumId?: number;
  weekNo: number;
  sessionNo: number;
  position: number;
  entityType: ContentEntityType;
  entityId: number;
  isRequired?: boolean;
}

export function assertPersonalCurriculumEntitlement(
  entitlements?: readonly string[],
  message = "Tính năng lộ trình học cá nhân yêu cầu gói bổ trợ Add-on Curriculum."
): void {
  if (!entitlements?.includes("create_custom_curriculum")) {
    throw new EntitlementRequiredError(message, {
      cause: {
        required_entitlement: "create_custom_curriculum",
      },
    });
  }
}

export function resolvePersonalUserTier(
  entitlements: string[] = []
): AccessTier {
  if (entitlements.includes("play_premium_games")) {
    return "premium";
  }
  if (entitlements.includes("play_standard_games")) {
    return "standard";
  }
  if (entitlements.includes("play_login_games")) {
    return "login";
  }
  return "free";
}

export function getPersonalAllowedTiers(userTier: AccessTier): AccessTier[] {
  switch (userTier) {
    case "premium":
      return ["free", "login", "standard", "premium"];
    case "standard":
      return ["free", "login", "standard"];
    case "login":
      return ["free", "login"];
    default:
      return ["free"];
  }
}

function buildGameLevelDetail(
  item: RawPersonalItemInput,
  gl?: GameLevelEntity
): PersonalCurriculumItemDetail {
  return {
    id: item.id ?? 0,
    personal_curriculum_id: item.personalCurriculumId ?? 0,
    week_no: item.weekNo,
    session_no: item.sessionNo,
    position: item.position,
    entity_type: "game_level",
    entity_id: item.entityId,
    code: gl?.code,
    title: gl?.title ?? `Trò chơi #${item.entityId}`,
    is_required: item.isRequired !== false,
    access_tier: gl ? ACCESS_TIER_CODEC.toLabel(gl.accessTier) : undefined,
    status: gl ? "published" : undefined,
    competency_code: gl?.code?.match(COMPETENCY_GAME_REGEX)?.[1]?.toUpperCase(),
    difficulty: gl?.difficulty ?? 1,
    estimated_minutes: 10,
  };
}

export async function enrichPersonalCurriculumItems(
  repos: MindKidRepositories,
  items: readonly {
    readonly id?: number;
    readonly weekNo: number;
    readonly sessionNo: number;
    readonly position: number;
    readonly entityType: ContentEntityType;
    readonly entityId: number;
    readonly isRequired?: boolean;
  }[]
): Promise<PersonalCurriculumItemDetail[]> {
  if (items.length === 0) {
    return [];
  }

  const gameLevelIds = items
    .filter((i) => i.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL)
    .map((i) => i.entityId);

  const gameLevelMap = await repos.gameLevels.mapByIds(gameLevelIds);

  const result: PersonalCurriculumItemDetail[] = [];
  for (const item of items) {
    result.push(buildGameLevelDetail(item, gameLevelMap.get(item.entityId)));
  }

  return result.sort((a, b) => {
    if (a.week_no !== b.week_no) {
      return a.week_no - b.week_no;
    }
    if (a.session_no !== b.session_no) {
      return a.session_no - b.session_no;
    }
    return a.position - b.position;
  });
}

export async function runEnrollChildInPersonalCurriculum(
  context: PersonalCurriculumCallerContext,
  childUuid: string,
  personalCurriculumUuid: string
): Promise<{ enrollment_id: number; status: string; enrolled_at: string }> {
  const repos = useRepositories();

  const [child, curriculum] = await Promise.all([
    repos.childProfiles.findByUuidForUser(childUuid, context.userId),
    repos.personalCurricula.findByUuidForUser(
      personalCurriculumUuid,
      context.userId
    ),
  ]);

  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(childUuid);
  }

  if (!curriculum) {
    throw new PersonalCurriculumNotFoundError(personalCurriculumUuid);
  }

  assertPersonalCurriculumEntitlement(context.entitlements);

  if (curriculum.status !== PERSONAL_CURRICULUM_STATUS.READY) {
    throw new ValidationError(
      "Lộ trình học cá nhân cần ở trạng thái 'ready' (sẵn sàng) để ghi danh cho trẻ."
    );
  }

  const enrollment = await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const enr = await txRepos.personalCurricula.enrollChild(
      child.id,
      curriculum.id
    );

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum_enrollment",
      entity_id: String(enr.id),
      after_data: {
        child_uuid: child.uuid,
        personal_curriculum_uuid: curriculum.uuid,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });

    return enr;
  });

  return {
    enrollment_id: enrollment.id,
    status: ENROLLMENT_STATUS_CODEC.toLabel(enrollment.status),
    enrolled_at: enrollment.enrolledAt.toISOString(),
  };
}

export async function runResolveChildPersonalCurriculumNextStep(
  context: PersonalCurriculumCallerContext,
  childUuid: string
): Promise<{
  active_enrollment: {
    id: number;
    personal_curriculum_uuid: string;
    title: string;
  } | null;
  next_step: CurriculumNextStepResult | null;
}> {
  const repos = useRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    childUuid,
    context.userId
  );

  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(childUuid);
  }

  assertPersonalCurriculumEntitlement(context.entitlements);

  const enrollment = await repos.personalCurricula.findActiveEnrollmentForChild(
    child.id
  );

  if (!enrollment) {
    return { active_enrollment: null, next_step: null };
  }

  const [rawItems, completedIds] = await Promise.all([
    repos.personalCurricula.listItems(enrollment.personalCurriculumId),
    repos.personalCurricula.listCompletedItemIds(enrollment.id),
  ]);

  const enrichedItems = await enrichPersonalCurriculumItems(repos, rawItems);
  const completedItemIds = new Set(completedIds);
  const userTier =
    context.currentTier || resolvePersonalUserTier(context.entitlements);
  const allowedTiers = getPersonalAllowedTiers(userTier);

  const playerItems: Array<CurriculumPlayerItemRef & { status?: string }> =
    enrichedItems.map((item) => ({
      id: item.id || 0,
      curriculum_id: enrollment.personalCurriculumId,
      week_no: item.week_no,
      session_no: item.session_no,
      position: item.position,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      code: item.code,
      title: item.title,
      is_required: item.is_required,
      access_tier: item.access_tier ?? "premium",
      status: item.status,
    }));

  const nextStep = resolvePersonalCurriculumNextStep({
    durationWeeks: enrollment.personalCurriculum.durationWeeks,
    items: playerItems,
    completedItemIds,
    allowedTiers,
  });

  return {
    active_enrollment: {
      id: enrollment.id,
      personal_curriculum_uuid: enrollment.personalCurriculum.uuid,
      title: enrollment.personalCurriculum.title,
    },
    next_step: nextStep,
  };
}

export async function runCompleteChildPersonalCurriculumItem(
  context: PersonalCurriculumCallerContext,
  childUuid: string,
  personalCurriculumItemId: number
): Promise<{ ok: boolean; status: string; completed_at: string }> {
  const repos = useRepositories();
  const child = await repos.childProfiles.findByUuidForUser(
    childUuid,
    context.userId
  );

  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(childUuid);
  }

  assertPersonalCurriculumEntitlement(context.entitlements);

  const enrollment = await repos.personalCurricula.findActiveEnrollmentForChild(
    child.id
  );

  if (!enrollment) {
    throw new PersonalCurriculumNotFoundError("active_enrollment");
  }

  const item = await repos.personalCurricula.findItemById(
    personalCurriculumItemId,
    enrollment.personalCurriculumId
  );

  if (!item) {
    throw new PersonalCurriculumNotFoundError(String(personalCurriculumItemId));
  }

  const userTier =
    context.currentTier || resolvePersonalUserTier(context.entitlements);
  const allowedTiers = getPersonalAllowedTiers(userTier);
  if (item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL) {
    const gl = await repos.gameLevels.findById(item.entityId);
    const itemTier = gl ? ACCESS_TIER_CODEC.toLabel(gl.accessTier) : "premium";
    if (!allowedTiers.includes(itemTier)) {
      throw new TierLockedError({
        access_tier: itemTier,
        required_entitlement: TIER_ENTITLEMENT[itemTier],
      });
    }
  }

  const now = new Date();
  const progress = await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const prog = await txRepos.personalCurricula.upsertItemProgress({
      enrollmentId: enrollment.id,
      childId: child.id,
      personalCurriculumItemId: item.id,
      completedAt: now,
    });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum_item_progress",
      entity_id: String(prog.id),
      after_data: {
        child_uuid: child.uuid,
        item_id: item.id,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });

    return prog;
  });

  return {
    ok: true,
    status: CURRICULUM_PROGRESS_STATUS_CODEC.toLabel(progress.status),
    completed_at: progress.completedAt?.toISOString() || now.toISOString(),
  };
}
