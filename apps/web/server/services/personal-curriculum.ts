/**
 * Spec sở hữu: docs/specs/07-addon/personal-curriculum.md
 * Business rules: BR-PCU-01..08, D-P4M..D-P4P
 */

import { writeAudit } from "@mindkid/audit";
import {
  ACCESS_TIER_CODEC,
  CONTENT_ENTITY_TYPE,
  CONTENT_ENTITY_TYPE_CODEC,
  PERSONAL_CURRICULUM_STATUS,
  PERSONAL_CURRICULUM_STATUS_CODEC,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { QuotaExceededError, TierLockedError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  ModerationBlockedError,
  VersionConflictError,
} from "@mindkid/errors/content";
import {
  CurriculumNotFoundError,
  PersonalCurriculumNotFoundError,
} from "@mindkid/errors/curriculum";
import { moderateText } from "@mindkid/moderation";
import {
  type AccessTier,
  type CopySystemCurriculumInput,
  type CreatePersonalCurriculumInput,
  type CurriculumNextStepResult,
  calculatePersonalCurriculumBalance,
  getEffectiveTier,
  type PersonalCurriculumDetail,
  type PersonalCurriculumItemInput,
  type PersonalCurriculumSummary,
  type ReplacePersonalCurriculumItemsInput,
  type UpdatePersonalCurriculumMetaInput,
} from "@mindkid/shared";
import {
  assertPersonalCurriculumEntitlement,
  enrichPersonalCurriculumItems,
  getPersonalAllowedTiers,
  type PersonalCurriculumCallerContext,
  resolvePersonalUserTier,
  runCompleteChildPersonalCurriculumItem,
  runEnrollChildInPersonalCurriculum,
  runResolveChildPersonalCurriculumNextStep,
} from "#server/services/personal-curriculum-enrollment";
import { useRepositories } from "#server/utils/repositories";

const DEFAULT_MAX_PERSONAL_CURRICULA = 5;

async function checkSavedQuota(
  repos: MindKidRepositories,
  userId: number,
  quotaLimit = DEFAULT_MAX_PERSONAL_CURRICULA
): Promise<void> {
  const currentCount = await repos.personalCurricula.countByUser(userId);
  if (currentCount >= quotaLimit) {
    throw new QuotaExceededError(
      `Bạn đã đạt hạn mức giới hạn tối đa ${quotaLimit} lộ trình cá nhân đã lưu.`
    );
  }
}

function assertTitleModerationPassed(title: string): void {
  const modResult = moderateText(title, { allowNegativeAssertions: true });
  if (!modResult.passed) {
    throw new ModerationBlockedError(
      "Tiêu đề lộ trình học chứa nội dung không phù hợp cho trẻ em."
    );
  }
}

async function validateGameLevels(
  repos: MindKidRepositories,
  gameLevelIds: number[],
  allowedTiers: AccessTier[],
  curriculumTier?: AccessTier | null
): Promise<void> {
  if (gameLevelIds.length === 0) {
    return;
  }
  const uniqueGameLevelIds = [...new Set(gameLevelIds)];
  const fetchedGameLevels = await repos.gameLevels.mapByIds(uniqueGameLevelIds);
  if (fetchedGameLevels.size !== uniqueGameLevelIds.length) {
    throw new ValidationError("Một hoặc nhiều màn chơi không tồn tại");
  }
  for (const g of fetchedGameLevels.values()) {
    const levelTier = ACCESS_TIER_CODEC.toLabel(g.accessTier);
    const effectiveTier = curriculumTier
      ? getEffectiveTier(levelTier, curriculumTier)
      : levelTier;
    if (!allowedTiers.includes(effectiveTier)) {
      throw new TierLockedError(
        {
          access_tier: effectiveTier,
        },
        `BR-PCU-01: Trò chơi '${g.title}' yêu cầu gói ${effectiveTier}, vượt quyền tài khoản của bạn.`
      );
    }
  }
}

async function validateItemsForUser(
  repos: MindKidRepositories,
  items: PersonalCurriculumItemInput[],
  userTier: AccessTier,
  curriculumTier?: AccessTier | null
): Promise<void> {
  const allowedTiers = getPersonalAllowedTiers(userTier);
  const gameLevelIds = items
    .filter((i) => i.entity_type === "game_level")
    .map((i) => i.entity_id);

  await validateGameLevels(repos, gameLevelIds, allowedTiers, curriculumTier);
}

export async function createPersonalCurriculum(
  context: PersonalCurriculumCallerContext,
  input: CreatePersonalCurriculumInput
): Promise<PersonalCurriculumDetail> {
  const entitlements = context.entitlements || [];
  assertPersonalCurriculumEntitlement(entitlements);
  assertTitleModerationPassed(input.title);

  const repos = useRepositories();
  await checkSavedQuota(repos, context.userId);

  const items = (input.items || []).map((i) => ({
    ...i,
    is_required: i.is_required !== false,
  }));
  const userTier = context.currentTier || resolvePersonalUserTier(entitlements);
  if (items.length > 0) {
    await validateItemsForUser(repos, items, userTier);
  }

  const createdUuid = await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const created = await txRepos.personalCurricula.createWithItems({
      userId: context.userId,
      title: input.title,
      ageMin: input.age_min ?? null,
      ageMax: input.age_max ?? null,
      durationWeeks: input.duration_weeks ?? 8,
      sessionsPerWeek: input.sessions_per_week ?? 3,
      status: PERSONAL_CURRICULUM_STATUS.DRAFT,
      items: items.map((item) => ({
        weekNo: item.week_no,
        sessionNo: item.session_no,
        position: item.position,
        entityType: CONTENT_ENTITY_TYPE_CODEC.toCode(item.entity_type),
        entityId: item.entity_id,
        isRequired: item.is_required,
      })),
    });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: created.uuid,
      after_data: {
        title: created.title,
        duration_weeks: created.durationWeeks,
        sessions_per_week: created.sessionsPerWeek,
        items_count: items.length,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });

    return created.uuid;
  });

  return getPersonalCurriculumByUuid(context, createdUuid);
}

export async function listPersonalCurricula(
  context: PersonalCurriculumCallerContext
): Promise<PersonalCurriculumSummary[]> {
  const repos = useRepositories();
  const rows = await repos.personalCurricula.listByUserWithItems(
    context.userId
  );

  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    user_id: r.userId,
    title: r.title,
    age_min: r.ageMin ?? undefined,
    age_max: r.ageMax ?? undefined,
    duration_weeks: r.durationWeeks,
    sessions_per_week: r.sessionsPerWeek,
    status: PERSONAL_CURRICULUM_STATUS_CODEC.toLabel(r.status),
    version: r.version,
    item_count: r.items.length,
    created_at: new Date(r.createdAt),
    updated_at: new Date(r.updatedAt),
  }));
}

export async function getPersonalCurriculumByUuid(
  context: PersonalCurriculumCallerContext,
  uuid: string
): Promise<PersonalCurriculumDetail> {
  const repos = useRepositories();
  const curriculum = await repos.personalCurricula.findByUuidForUser(
    uuid,
    context.userId
  );

  if (!curriculum) {
    throw new PersonalCurriculumNotFoundError(uuid);
  }

  const rawItems = await repos.personalCurricula.listItems(curriculum.id);
  const enrichedItems = await enrichPersonalCurriculumItems(repos, rawItems);

  const { report, warnings } = calculatePersonalCurriculumBalance({
    duration_weeks: curriculum.durationWeeks,
    sessions_per_week: curriculum.sessionsPerWeek,
    items: enrichedItems,
  });

  return {
    id: curriculum.id,
    uuid: curriculum.uuid,
    user_id: curriculum.userId,
    title: curriculum.title,
    age_min: curriculum.ageMin ?? undefined,
    age_max: curriculum.ageMax ?? undefined,
    duration_weeks: curriculum.durationWeeks,
    sessions_per_week: curriculum.sessionsPerWeek,
    status: PERSONAL_CURRICULUM_STATUS_CODEC.toLabel(curriculum.status),
    version: curriculum.version,
    created_at: new Date(curriculum.createdAt),
    updated_at: new Date(curriculum.updatedAt),
    items: enrichedItems,
    balance: report,
    warnings,
  };
}

export async function updatePersonalCurriculumMeta(
  context: PersonalCurriculumCallerContext,
  uuid: string,
  input: UpdatePersonalCurriculumMetaInput
): Promise<PersonalCurriculumDetail> {
  const repos = useRepositories();
  const existing = await repos.personalCurricula.findByUuidForUser(
    uuid,
    context.userId
  );

  if (!existing) {
    throw new PersonalCurriculumNotFoundError(uuid);
  }

  assertPersonalCurriculumEntitlement(context.entitlements);
  if (input.title !== undefined) {
    assertTitleModerationPassed(input.title);
  }

  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw new VersionConflictError(
      `Xung đột phiên bản: phiên bản hiện tại là ${existing.version}, kỳ vọng ${input.expected_version}. Vui lòng tải lại dữ liệu.`
    );
  }

  await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const updated = await txRepos.personalCurricula.updateVersioned(
      existing.id,
      context.userId,
      existing.version,
      {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.age_min === undefined ? {} : { ageMin: input.age_min }),
        ...(input.age_max === undefined ? {} : { ageMax: input.age_max }),
        ...(input.duration_weeks === undefined
          ? {}
          : { durationWeeks: input.duration_weeks }),
        ...(input.sessions_per_week === undefined
          ? {}
          : { sessionsPerWeek: input.sessions_per_week }),
        ...(input.status === undefined
          ? {}
          : { status: PERSONAL_CURRICULUM_STATUS_CODEC.toCode(input.status) }),
      }
    );

    if (!updated) {
      throw new VersionConflictError(
        "Xung đột phiên bản khi cập nhật lộ trình học cá nhân. Vui lòng tải lại dữ liệu."
      );
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: existing.uuid,
      before_data: {
        version: existing.version,
        status: PERSONAL_CURRICULUM_STATUS_CODEC.toLabel(existing.status),
      },
      after_data: { version: updated.version, changes: input },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return getPersonalCurriculumByUuid(context, uuid);
}

export async function replacePersonalCurriculumItems(
  context: PersonalCurriculumCallerContext,
  uuid: string,
  input: ReplacePersonalCurriculumItemsInput
): Promise<PersonalCurriculumDetail> {
  const repos = useRepositories();
  const existing = await repos.personalCurricula.findByUuidForUser(
    uuid,
    context.userId
  );

  if (!existing) {
    throw new PersonalCurriculumNotFoundError(uuid);
  }

  assertPersonalCurriculumEntitlement(context.entitlements);

  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw new VersionConflictError(
      `Xung đột phiên bản: phiên bản hiện tại là ${existing.version}, kỳ vọng ${input.expected_version}. Vui lòng tải lại dữ liệu.`
    );
  }

  const userTier =
    context.currentTier || resolvePersonalUserTier(context.entitlements);
  await validateItemsForUser(repos, input.items, userTier);

  await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const updated = await txRepos.personalCurricula.updateVersioned(
      existing.id,
      context.userId,
      existing.version,
      {
        items: input.items.map((item) => ({
          weekNo: item.week_no,
          sessionNo: item.session_no,
          position: item.position,
          entityType: CONTENT_ENTITY_TYPE_CODEC.toCode(item.entity_type),
          entityId: item.entity_id,
          isRequired: item.is_required !== false,
        })),
      }
    );

    if (!updated) {
      throw new VersionConflictError(
        "Xung đột phiên bản khi cập nhật lộ trình học cá nhân. Vui lòng tải lại dữ liệu."
      );
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: existing.uuid,
      after_data: {
        version: updated.version,
        item_count: input.items.length,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return getPersonalCurriculumByUuid(context, uuid);
}

export async function copySystemCurriculum(
  context: PersonalCurriculumCallerContext,
  input: CopySystemCurriculumInput
): Promise<PersonalCurriculumDetail> {
  const entitlements = context.entitlements || [];
  assertPersonalCurriculumEntitlement(
    entitlements,
    "Tính năng sao chép lộ trình yêu cầu gói Add-on Curriculum."
  );
  if (input.title !== undefined) {
    assertTitleModerationPassed(input.title);
  }

  const repos = useRepositories();
  await checkSavedQuota(repos, context.userId);

  const systemCurriculum = await repos.curricula.findByCode(
    input.system_curriculum_code
  );

  if (!systemCurriculum) {
    throw new CurriculumNotFoundError(input.system_curriculum_code);
  }

  const sysItems = await repos.curricula.listItems([systemCurriculum.id]);

  const userTier = context.currentTier || resolvePersonalUserTier(entitlements);
  const systemCurriculumTier = ACCESS_TIER_CODEC.toLabel(
    systemCurriculum.accessTier
  );
  const allowedTiers = getPersonalAllowedTiers(userTier);
  if (!allowedTiers.includes(systemCurriculumTier)) {
    throw new TierLockedError(
      {
        access_tier: systemCurriculumTier,
      },
      `BR-PCU-01: Lộ trình '${systemCurriculum.title}' yêu cầu gói ${systemCurriculumTier}, vượt quyền tài khoản của bạn.`
    );
  }

  const itemsToCopy: PersonalCurriculumItemInput[] = [];
  for (const it of sysItems) {
    if (it.entityType !== CONTENT_ENTITY_TYPE.GAME_LEVEL) {
      continue;
    }
    itemsToCopy.push({
      week_no: it.weekNo,
      session_no: it.sessionNo,
      position: it.position,
      entity_type: "game_level",
      entity_id: it.entityId,
      is_required: it.isRequired,
    });
  }

  await validateItemsForUser(
    repos,
    itemsToCopy,
    userTier,
    systemCurriculumTier
  );

  const copiedTitle = input.title || `Bản sao - ${systemCurriculum.title}`;
  assertTitleModerationPassed(copiedTitle);

  const createdUuid = await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const created = await txRepos.personalCurricula.createWithItems({
      userId: context.userId,
      title: copiedTitle,
      ageMin: systemCurriculum.targetAgeMin,
      ageMax: systemCurriculum.targetAgeMax,
      durationWeeks: systemCurriculum.durationWeeks,
      sessionsPerWeek: systemCurriculum.sessionsPerWeek,
      status: PERSONAL_CURRICULUM_STATUS.DRAFT,
      items: itemsToCopy.map((item) => ({
        weekNo: item.week_no,
        sessionNo: item.session_no,
        position: item.position,
        entityType: CONTENT_ENTITY_TYPE_CODEC.toCode(item.entity_type),
        entityId: item.entity_id,
        isRequired: item.is_required !== false,
      })),
    });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: created.uuid,
      after_data: {
        source_system_code: input.system_curriculum_code,
        copied_items: itemsToCopy.length,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });

    return created.uuid;
  });

  return getPersonalCurriculumByUuid(context, createdUuid);
}

export async function deletePersonalCurriculum(
  context: PersonalCurriculumCallerContext,
  uuid: string
): Promise<{ ok: boolean }> {
  const repos = useRepositories();
  const existing = await repos.personalCurricula.findByUuidForUser(
    uuid,
    context.userId
  );

  if (!existing) {
    throw new PersonalCurriculumNotFoundError(uuid);
  }

  await repos.personalCurricula.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.personalCurricula.deleteForUser(existing.id, context.userId);

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_deleted",
      entity_type: "personal_curriculum",
      entity_id: existing.uuid,
      reason: "Người dùng xoá lộ trình học cá nhân",
      before_data: { uuid: existing.uuid, title: existing.title },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return { ok: true };
}

export async function enrollChildInPersonalCurriculum(
  context: PersonalCurriculumCallerContext,
  childUuid: string,
  personalCurriculumUuid: string
): Promise<{ enrollment_id: number; status: string; enrolled_at: string }> {
  return await runEnrollChildInPersonalCurriculum(
    context,
    childUuid,
    personalCurriculumUuid
  );
}

export async function resolveChildPersonalCurriculumNextStep(
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
  return await runResolveChildPersonalCurriculumNextStep(context, childUuid);
}

export async function completeChildPersonalCurriculumItem(
  context: PersonalCurriculumCallerContext,
  childUuid: string,
  personalCurriculumItemId: number
): Promise<{ ok: boolean; status: string; completed_at: string }> {
  return await runCompleteChildPersonalCurriculumItem(
    context,
    childUuid,
    personalCurriculumItemId
  );
}
