/**
 * Spec sở hữu: docs/specs/07-addon/personal-curriculum.md
 * Business rules: BR-PCU-01..08, D-P4M..D-P4P
 */

import { appError } from "@kidthink/auth";
import {
  type AccessTier,
  type CopySystemCurriculumInput,
  type CreatePersonalCurriculumInput,
  type CurriculumNextStepResult,
  type CurriculumPlayerItemRef,
  calculatePersonalCurriculumBalance,
  type PersonalCurriculumDetail,
  type PersonalCurriculumItemDetail,
  type PersonalCurriculumItemInput,
  type PersonalCurriculumSummary,
  type ReplacePersonalCurriculumItemsInput,
  resolvePersonalCurriculumNextStep,
  type UpdatePersonalCurriculumMetaInput,
} from "@kidthink/shared";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../client.ts";
import { childProfiles } from "../schema/child.ts";
import { lessons } from "../schema/content.ts";
import { curricula, curriculumItems } from "../schema/curriculum.ts";
import { gameLevels } from "../schema/game.ts";
import {
  personalCurricula,
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
  personalCurriculumItems,
} from "../schema/personal-curriculum.ts";
import { writeAudit } from "./audit.ts";

const DEFAULT_MAX_PERSONAL_CURRICULA = 5;
const COMPETENCY_LESSON_REGEX = /^(?:LES-)?(C[1-6])/i;
const COMPETENCY_GAME_REGEX = /^(?:GL-)?(C[1-6])/i;

interface UserCallerContext {
  userId: number;
  entitlements?: string[];
  currentTier?: AccessTier;
  ip?: string;
  userAgent?: string;
}

function resolveUserTier(entitlements: string[] = []): AccessTier {
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

function getAllowedTiers(userTier: AccessTier): AccessTier[] {
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

async function checkSavedQuota(
  db: ReturnType<typeof getDb>,
  userId: number,
  quotaLimit = DEFAULT_MAX_PERSONAL_CURRICULA
): Promise<void> {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalCurricula)
    .where(eq(personalCurricula.userId, userId));

  const currentCount = countResult?.count ?? 0;
  if (currentCount >= quotaLimit) {
    throw appError("QUOTA_EXCEEDED", {
      quota_key: "custom_curricula_saved",
      limit: quotaLimit,
      current: currentCount,
      message: `Bạn đã đạt giới hạn tối đa ${quotaLimit} lộ trình cá nhân đã lưu.`,
    });
  }
}

interface RawItemInput {
  id?: number;
  personalCurriculumId?: number;
  weekNo: number;
  sessionNo: number;
  position: number;
  entityType: string;
  entityId: number;
  isRequired?: boolean;
}

function buildLessonDetail(
  item: RawItemInput,
  lesson?: typeof lessons.$inferSelect
): PersonalCurriculumItemDetail {
  return {
    id: item.id ?? 0,
    personal_curriculum_id: item.personalCurriculumId ?? 0,
    week_no: item.weekNo,
    session_no: item.sessionNo,
    position: item.position,
    entity_type: "lesson",
    entity_id: item.entityId,
    code: lesson?.code,
    title: lesson?.titleVi ?? `Bài học #${item.entityId}`,
    is_required: item.isRequired !== false,
    access_tier: lesson?.accessTier as AccessTier | undefined,
    status: lesson?.status,
    competency_code: lesson?.code
      ?.match(COMPETENCY_LESSON_REGEX)?.[1]
      ?.toUpperCase(),
    difficulty: 1,
    estimated_minutes: 20,
    is_offline: false,
  };
}

function buildGameLevelDetail(
  item: RawItemInput,
  gl?: typeof gameLevels.$inferSelect
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
    title: gl?.titleVi ?? `Trò chơi #${item.entityId}`,
    is_required: item.isRequired !== false,
    access_tier: gl?.accessTier as AccessTier | undefined,
    status: gl?.status,
    competency_code: gl?.code?.match(COMPETENCY_GAME_REGEX)?.[1]?.toUpperCase(),
    difficulty: gl?.difficulty ?? 1,
    estimated_minutes: 10,
    is_offline: false,
  };
}

async function fetchAndEnrichItemMetadata(
  db: ReturnType<typeof getDb>,
  items: RawItemInput[]
): Promise<PersonalCurriculumItemDetail[]> {
  if (items.length === 0) {
    return [];
  }

  const lessonIds = items
    .filter((i) => i.entityType === "lesson")
    .map((i) => i.entityId);
  const gameLevelIds = items
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  const lessonMap = new Map<number, typeof lessons.$inferSelect>();
  if (lessonIds.length > 0) {
    const fetchedLessons = await db
      .select()
      .from(lessons)
      .where(inArray(lessons.id, lessonIds));
    for (const l of fetchedLessons) {
      lessonMap.set(l.id, l);
    }
  }

  const gameLevelMap = new Map<number, typeof gameLevels.$inferSelect>();
  if (gameLevelIds.length > 0) {
    const fetchedGameLevels = await db
      .select()
      .from(gameLevels)
      .where(inArray(gameLevels.id, gameLevelIds));
    for (const g of fetchedGameLevels) {
      gameLevelMap.set(g.id, g);
    }
  }

  const result: PersonalCurriculumItemDetail[] = [];
  for (const item of items) {
    if (item.entityType === "lesson") {
      result.push(buildLessonDetail(item, lessonMap.get(item.entityId)));
    } else {
      result.push(buildGameLevelDetail(item, gameLevelMap.get(item.entityId)));
    }
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

async function validateLessons(
  db: ReturnType<typeof getDb>,
  lessonIds: number[],
  allowedTiers: AccessTier[]
): Promise<void> {
  if (lessonIds.length === 0) {
    return;
  }
  const fetchedLessons = await db
    .select()
    .from(lessons)
    .where(inArray(lessons.id, lessonIds));
  for (const l of fetchedLessons) {
    if (l.status !== "published") {
      throw appError(
        "VALIDATION_FAILED",
        `BR-PCU-01: Bài học '${l.titleVi}' (${l.code}) chưa được xuất bản (status: ${l.status}).`
      );
    }
    if (!allowedTiers.includes(l.accessTier as AccessTier)) {
      throw appError(
        "TIER_LOCKED",
        `BR-PCU-01: Bài học '${l.titleVi}' yêu cầu gói ${l.accessTier}, vượt quyền tài khoản của bạn.`
      );
    }
  }
}

async function validateGameLevels(
  db: ReturnType<typeof getDb>,
  gameLevelIds: number[],
  allowedTiers: AccessTier[]
): Promise<void> {
  if (gameLevelIds.length === 0) {
    return;
  }
  const fetchedGameLevels = await db
    .select()
    .from(gameLevels)
    .where(inArray(gameLevels.id, gameLevelIds));
  for (const g of fetchedGameLevels) {
    if (g.status !== "published") {
      throw appError(
        "VALIDATION_FAILED",
        `BR-PCU-01: Trò chơi '${g.titleVi}' (${g.code}) chưa được xuất bản (status: ${g.status}).`
      );
    }
    if (!allowedTiers.includes(g.accessTier as AccessTier)) {
      throw appError(
        "TIER_LOCKED",
        `BR-PCU-01: Trò chơi '${g.titleVi}' yêu cầu gói ${g.accessTier}, vượt quyền tài khoản của bạn.`
      );
    }
  }
}

async function validateItemsForUser(
  db: ReturnType<typeof getDb>,
  items: PersonalCurriculumItemInput[],
  userTier: AccessTier
): Promise<void> {
  const allowedTiers = getAllowedTiers(userTier);
  const lessonIds = items
    .filter((i) => i.entity_type === "lesson")
    .map((i) => i.entity_id);
  const gameLevelIds = items
    .filter((i) => i.entity_type === "game_level")
    .map((i) => i.entity_id);

  await validateLessons(db, lessonIds, allowedTiers);
  await validateGameLevels(db, gameLevelIds, allowedTiers);
}

export async function createPersonalCurriculum(
  context: UserCallerContext,
  input: CreatePersonalCurriculumInput
): Promise<PersonalCurriculumDetail> {
  const entitlements = context.entitlements || [];
  if (!entitlements.includes("create_custom_curriculum")) {
    throw appError(
      "ENTITLEMENT_REQUIRED",
      "Tính năng tạo lộ trình học cá nhân yêu cầu gói bổ trợ Add-on Curriculum."
    );
  }

  const db = getDb();
  await checkSavedQuota(db, context.userId);

  const items = (input.items || []).map((i) => ({
    ...i,
    is_required: i.is_required !== false,
  }));
  const userTier = context.currentTier || resolveUserTier(entitlements);
  if (items.length > 0) {
    await validateItemsForUser(db, items, userTier);
  }

  const createdUuid = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(personalCurricula)
      .values({
        userId: context.userId,
        title: input.title,
        ageMin: input.age_min ?? null,
        ageMax: input.age_max ?? null,
        durationWeeks: input.duration_weeks ?? 8,
        sessionsPerWeek: input.sessions_per_week ?? 3,
        status: "draft",
        version: 1,
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(personalCurriculumItems).values(
        items.map((item) => ({
          personalCurriculumId: created.id,
          weekNo: item.week_no,
          sessionNo: item.session_no,
          position: item.position,
          entityType: item.entity_type,
          entityId: item.entity_id,
          isRequired: item.is_required,
        }))
      );
    }

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
  context: UserCallerContext
): Promise<PersonalCurriculumSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: personalCurricula.id,
      uuid: personalCurricula.uuid,
      userId: personalCurricula.userId,
      title: personalCurricula.title,
      ageMin: personalCurricula.ageMin,
      ageMax: personalCurricula.ageMax,
      durationWeeks: personalCurricula.durationWeeks,
      sessionsPerWeek: personalCurricula.sessionsPerWeek,
      status: personalCurricula.status,
      version: personalCurricula.version,
      createdAt: personalCurricula.createdAt,
      updatedAt: personalCurricula.updatedAt,
      itemCount: sql<number>`count(${personalCurriculumItems.id})::int`,
    })
    .from(personalCurricula)
    .leftJoin(
      personalCurriculumItems,
      eq(personalCurricula.id, personalCurriculumItems.personalCurriculumId)
    )
    .where(eq(personalCurricula.userId, context.userId))
    .groupBy(personalCurricula.id)
    .orderBy(desc(personalCurricula.createdAt));

  return rows.map((r) => ({
    id: r.id,
    uuid: r.uuid,
    user_id: r.userId,
    title: r.title,
    age_min: r.ageMin ?? undefined,
    age_max: r.ageMax ?? undefined,
    duration_weeks: r.durationWeeks,
    sessions_per_week: r.sessionsPerWeek,
    status: r.status,
    version: r.version,
    item_count: r.itemCount,
    created_at: new Date(r.createdAt),
    updated_at: new Date(r.updatedAt),
  }));
}

export async function getPersonalCurriculumByUuid(
  context: UserCallerContext,
  uuid: string
): Promise<PersonalCurriculumDetail> {
  const db = getDb();
  const [curriculum] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, uuid),
        eq(personalCurricula.userId, context.userId)
      )
    );

  if (!curriculum) {
    throw appError("NOT_FOUND", "Không tìm thấy lộ trình học cá nhân.");
  }

  const rawItems = await db
    .select()
    .from(personalCurriculumItems)
    .where(eq(personalCurriculumItems.personalCurriculumId, curriculum.id));

  const enrichedItems = await fetchAndEnrichItemMetadata(db, rawItems);

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
    status: curriculum.status,
    version: curriculum.version,
    created_at: new Date(curriculum.createdAt),
    updated_at: new Date(curriculum.updatedAt),
    items: enrichedItems,
    balance: report,
    warnings,
  };
}

export async function updatePersonalCurriculumMeta(
  context: UserCallerContext,
  uuid: string,
  input: UpdatePersonalCurriculumMetaInput
): Promise<PersonalCurriculumDetail> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, uuid),
        eq(personalCurricula.userId, context.userId)
      )
    );

  if (!existing) {
    throw appError("NOT_FOUND", "Không tìm thấy lộ trình học cá nhân.");
  }

  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw appError(
      "VERSION_CONFLICT",
      `Xung đột phiên bản: phiên bản hiện tại là ${existing.version}, kỳ vọng ${input.expected_version}. Vui lòng tải lại dữ liệu.`
    );
  }

  const updateData: Partial<typeof personalCurricula.$inferInsert> = {
    version: existing.version + 1,
    updatedAt: new Date(),
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.age_min !== undefined) {
    updateData.ageMin = input.age_min;
  }
  if (input.age_max !== undefined) {
    updateData.ageMax = input.age_max;
  }
  if (input.duration_weeks !== undefined) {
    updateData.durationWeeks = input.duration_weeks;
  }
  if (input.sessions_per_week !== undefined) {
    updateData.sessionsPerWeek = input.sessions_per_week;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(personalCurricula)
      .set(updateData)
      .where(eq(personalCurricula.id, existing.id));

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: existing.uuid,
      before_data: { version: existing.version, status: existing.status },
      after_data: { version: existing.version + 1, changes: input },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return getPersonalCurriculumByUuid(context, uuid);
}

export async function replacePersonalCurriculumItems(
  context: UserCallerContext,
  uuid: string,
  input: ReplacePersonalCurriculumItemsInput
): Promise<PersonalCurriculumDetail> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, uuid),
        eq(personalCurricula.userId, context.userId)
      )
    );

  if (!existing) {
    throw appError("NOT_FOUND", "Không tìm thấy lộ trình học cá nhân.");
  }

  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw appError(
      "VERSION_CONFLICT",
      `Xung đột phiên bản: phiên bản hiện tại là ${existing.version}, kỳ vọng ${input.expected_version}. Vui lòng tải lại dữ liệu.`
    );
  }

  const userTier = context.currentTier || resolveUserTier(context.entitlements);
  await validateItemsForUser(db, input.items, userTier);

  await db.transaction(async (tx) => {
    await tx
      .delete(personalCurriculumItems)
      .where(eq(personalCurriculumItems.personalCurriculumId, existing.id));

    if (input.items.length > 0) {
      await tx.insert(personalCurriculumItems).values(
        input.items.map((item) => ({
          personalCurriculumId: existing.id,
          weekNo: item.week_no,
          sessionNo: item.session_no,
          position: item.position,
          entityType: item.entity_type,
          entityId: item.entity_id,
          isRequired: item.is_required !== false,
        }))
      );
    }

    await tx
      .update(personalCurricula)
      .set({
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(personalCurricula.id, existing.id));

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "content_created",
      entity_type: "personal_curriculum",
      entity_id: existing.uuid,
      after_data: {
        version: existing.version + 1,
        item_count: input.items.length,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return getPersonalCurriculumByUuid(context, uuid);
}

export async function copySystemCurriculum(
  context: UserCallerContext,
  input: CopySystemCurriculumInput
): Promise<PersonalCurriculumDetail> {
  const entitlements = context.entitlements || [];
  if (!entitlements.includes("create_custom_curriculum")) {
    throw appError(
      "ENTITLEMENT_REQUIRED",
      "Tính năng sao chép lộ trình yêu cầu gói Add-on Curriculum."
    );
  }

  const db = getDb();
  await checkSavedQuota(db, context.userId);

  const [systemCurriculum] = await db
    .select()
    .from(curricula)
    .where(
      and(
        eq(curricula.code, input.system_curriculum_code),
        eq(curricula.status, "published")
      )
    );

  if (!systemCurriculum) {
    throw appError(
      "NOT_FOUND",
      `Không tìm thấy chương trình hệ thống '${input.system_curriculum_code}' đã xuất bản.`
    );
  }

  const sysItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, systemCurriculum.id))
    .orderBy(
      asc(curriculumItems.weekNo),
      asc(curriculumItems.sessionNo),
      asc(curriculumItems.position)
    );

  const userTier = context.currentTier || resolveUserTier(entitlements);

  // Validate items
  const itemsToCopy: PersonalCurriculumItemInput[] = [];
  for (const it of sysItems) {
    itemsToCopy.push({
      week_no: it.weekNo,
      session_no: it.sessionNo,
      position: it.position,
      entity_type: it.entityType as "lesson" | "game_level",
      entity_id: it.entityId,
      is_required: it.isRequired,
    });
  }

  await validateItemsForUser(db, itemsToCopy, userTier);

  const createdUuid = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(personalCurricula)
      .values({
        userId: context.userId,
        title: input.title || `Bản sao - ${systemCurriculum.titleVi}`,
        ageMin: systemCurriculum.targetAgeMin,
        ageMax: systemCurriculum.targetAgeMax,
        durationWeeks: systemCurriculum.durationWeeks,
        sessionsPerWeek: systemCurriculum.sessionsPerWeek,
        status: "draft",
        version: 1,
      })
      .returning();

    if (itemsToCopy.length > 0) {
      await tx.insert(personalCurriculumItems).values(
        itemsToCopy.map((item) => ({
          personalCurriculumId: created.id,
          weekNo: item.week_no,
          sessionNo: item.session_no,
          position: item.position,
          entityType: item.entity_type,
          entityId: item.entity_id,
          isRequired: item.is_required !== false,
        }))
      );
    }

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
  context: UserCallerContext,
  uuid: string
): Promise<{ ok: boolean }> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, uuid),
        eq(personalCurricula.userId, context.userId)
      )
    );

  if (!existing) {
    throw appError("NOT_FOUND", "Không tìm thấy lộ trình học cá nhân.");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(personalCurricula)
      .where(eq(personalCurricula.id, existing.id));

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
  context: UserCallerContext,
  childUuid: string,
  personalCurriculumUuid: string
): Promise<{ enrollment_id: number; status: string; enrolled_at: string }> {
  const db = getDb();

  // 1. Verify child ownership (BR-PCU-02)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, context.userId)
      )
    );

  if (!child) {
    throw appError("NOT_FOUND", "Không tìm thấy hồ sơ trẻ thuộc tài khoản.");
  }

  // 2. Verify curriculum ownership (BR-PCU-02)
  const [curriculum] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, personalCurriculumUuid),
        eq(personalCurricula.userId, context.userId)
      )
    );

  if (!curriculum) {
    throw appError(
      "NOT_FOUND",
      "Không tìm thấy lộ trình học cá nhân thuộc tài khoản."
    );
  }

  if (curriculum.status !== "ready") {
    throw appError(
      "VALIDATION_FAILED",
      "Lộ trình học cá nhân cần ở trạng thái 'ready' (sẵn sàng) để ghi danh cho trẻ."
    );
  }

  const enrollment = await db.transaction(async (tx) => {
    // 3. Deactivate previous active personal enrollment
    await tx
      .update(personalCurriculumEnrollments)
      .set({ status: "withdrawn" })
      .where(
        and(
          eq(personalCurriculumEnrollments.childId, child.id),
          eq(personalCurriculumEnrollments.status, "active")
        )
      );

    // 4. Create new enrollment
    const [enr] = await tx
      .insert(personalCurriculumEnrollments)
      .values({
        childId: child.id,
        personalCurriculumId: curriculum.id,
        status: "active",
      })
      .returning();

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
    status: enrollment.status,
    enrolled_at: enrollment.enrolledAt.toISOString(),
  };
}

export async function resolveChildPersonalCurriculumNextStep(
  context: UserCallerContext,
  childUuid: string
): Promise<{
  active_enrollment: {
    id: number;
    personal_curriculum_uuid: string;
    title: string;
  } | null;
  next_step: CurriculumNextStepResult | null;
}> {
  const db = getDb();

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, context.userId)
      )
    );

  if (!child) {
    throw appError("NOT_FOUND", "Không tìm thấy hồ sơ trẻ thuộc tài khoản.");
  }

  const [enrollment] = await db
    .select({
      id: personalCurriculumEnrollments.id,
      curriculumId: personalCurriculumEnrollments.personalCurriculumId,
      status: personalCurriculumEnrollments.status,
      uuid: personalCurricula.uuid,
      title: personalCurricula.title,
      durationWeeks: personalCurricula.durationWeeks,
    })
    .from(personalCurriculumEnrollments)
    .innerJoin(
      personalCurricula,
      eq(
        personalCurriculumEnrollments.personalCurriculumId,
        personalCurricula.id
      )
    )
    .where(
      and(
        eq(personalCurriculumEnrollments.childId, child.id),
        eq(personalCurriculumEnrollments.status, "active")
      )
    );

  if (!enrollment) {
    return { active_enrollment: null, next_step: null };
  }

  const rawItems = await db
    .select()
    .from(personalCurriculumItems)
    .where(
      eq(personalCurriculumItems.personalCurriculumId, enrollment.curriculumId)
    );

  const enrichedItems = await fetchAndEnrichItemMetadata(db, rawItems);

  const progressRows = await db
    .select({
      itemId: personalCurriculumItemProgress.personalCurriculumItemId,
      status: personalCurriculumItemProgress.status,
    })
    .from(personalCurriculumItemProgress)
    .where(
      and(
        eq(personalCurriculumItemProgress.enrollmentId, enrollment.id),
        eq(personalCurriculumItemProgress.status, "completed")
      )
    );

  const completedItemIds = new Set(progressRows.map((p) => p.itemId));
  const userTier = context.currentTier || resolveUserTier(context.entitlements);
  const allowedTiers = getAllowedTiers(userTier);

  const playerItems: Array<CurriculumPlayerItemRef & { status?: string }> =
    enrichedItems.map((item) => ({
      id: item.id || 0,
      curriculum_id: enrollment.curriculumId,
      week_no: item.week_no,
      session_no: item.session_no,
      position: item.position,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      code: item.code,
      title: item.title,
      is_required: item.is_required,
      access_tier: (item.access_tier || "free") as AccessTier,
      status: item.status,
    }));

  const nextStep = resolvePersonalCurriculumNextStep({
    durationWeeks: enrollment.durationWeeks,
    items: playerItems,
    completedItemIds,
    allowedTiers,
  });

  return {
    active_enrollment: {
      id: enrollment.id,
      personal_curriculum_uuid: enrollment.uuid,
      title: enrollment.title,
    },
    next_step: nextStep,
  };
}

export async function completeChildPersonalCurriculumItem(
  context: UserCallerContext,
  childUuid: string,
  personalCurriculumItemId: number
): Promise<{ ok: boolean; status: string; completed_at: string }> {
  const db = getDb();

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, context.userId)
      )
    );

  if (!child) {
    throw appError("NOT_FOUND", "Không tìm thấy hồ sơ trẻ thuộc tài khoản.");
  }

  const [enrollment] = await db
    .select()
    .from(personalCurriculumEnrollments)
    .where(
      and(
        eq(personalCurriculumEnrollments.childId, child.id),
        eq(personalCurriculumEnrollments.status, "active")
      )
    );

  if (!enrollment) {
    throw appError(
      "NOT_FOUND",
      "Trẻ chưa có lộ trình cá nhân nào đang hoạt động."
    );
  }

  const [item] = await db
    .select()
    .from(personalCurriculumItems)
    .where(
      and(
        eq(personalCurriculumItems.id, personalCurriculumItemId),
        eq(
          personalCurriculumItems.personalCurriculumId,
          enrollment.personalCurriculumId
        )
      )
    );

  if (!item) {
    throw appError(
      "NOT_FOUND",
      "Mục bài học không thuộc lộ trình cá nhân mà trẻ đang học."
    );
  }

  const now = new Date();
  const progress = await db.transaction(async (tx) => {
    const [prog] = await tx
      .insert(personalCurriculumItemProgress)
      .values({
        enrollmentId: enrollment.id,
        childId: child.id,
        personalCurriculumItemId: item.id,
        status: "completed",
        completedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          personalCurriculumItemProgress.enrollmentId,
          personalCurriculumItemProgress.personalCurriculumItemId,
        ],
        set: {
          status: "completed",
          completedAt: now,
          updatedAt: now,
        },
      })
      .returning();

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
    status: progress.status,
    completed_at: progress.completedAt?.toISOString() || now.toISOString(),
  };
}
