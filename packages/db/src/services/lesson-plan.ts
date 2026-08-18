/**
 * Spec sở hữu: docs/specs/07-addon/lesson-plan-creator.md
 * Business rules: BR-LPC-01..09, D-P4A..D-P4D
 */

import { appError } from "@mindkid/auth";
import {
  type ActivitySnapshot,
  buildActivitySnapshot,
  buildCustomNoteSnapshot,
  buildGameLevelSnapshot,
  type CreateLessonPlanInput,
  canAccessTier,
  type GameLevelSnapshot,
  type LessonPlanDetail,
  type LessonPlanItem,
  type LessonPlanItemInput,
  type LessonPlanItemSnapshot,
  type LessonPlanItemType,
  type LessonPlanSummary,
  type ReplaceLessonPlanItemsInput,
  type UpdateLessonPlanMetaInput,
} from "@mindkid/shared";
import { and, asc, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { getDb } from "../client.ts";
import { activities, lessonActivities, lessons } from "../schema/content.ts";
import { gameLevels } from "../schema/game.ts";
import { notificationDeliveries, notifications } from "../schema/ops.ts";
import { lessonPlanItems, lessonPlans } from "../schema/planner.ts";
import { writeAudit } from "./audit.ts";

const DEFAULT_LESSON_PLANS_PER_MONTH = 20;

interface PreparedItem {
  position: number;
  itemType: LessonPlanItemType;
  itemCode: string | null;
  sourceEntityId: number | null;
  sourceContentVersion: number | null;
  customInstruction: string | null;
  snapshot: LessonPlanItemSnapshot;
}

function getStartOfMonthIct(date = new Date()): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month, 1, -7, 0, 0, 0));
}

function getNextMonthStartIct(date = new Date()): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1, -7, 0, 0, 0));
}

async function checkMonthlyQuota(
  db: ReturnType<typeof getDb>,
  userId: number,
  quotaLimit: number,
  now: Date
): Promise<void> {
  const startOfMonth = getStartOfMonthIct(now);
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessonPlans)
    .where(
      and(
        eq(lessonPlans.userId, userId),
        gte(lessonPlans.createdAt, startOfMonth)
      )
    );

  const currentCount = countResult?.count ?? 0;
  if (currentCount >= quotaLimit) {
    throw appError("QUOTA_EXCEEDED", {
      quota_key: "lesson_plans_per_month",
      limit: quotaLimit,
      current: currentCount,
      resets_at: getNextMonthStartIct(now).toISOString(),
    });
  }
}

async function resolveActivityItem(
  db: ReturnType<typeof getDb>,
  item: LessonPlanItemInput,
  position: number,
  entitlements: string[]
): Promise<PreparedItem> {
  const itemCode = item.item_code;
  const sourceEntityId = item.source_entity_id;
  if (!itemCode && sourceEntityId === undefined) {
    throw appError(
      "VALIDATION_FAILED",
      "Mục activity cần có item_code hoặc source_entity_id."
    );
  }

  const whereClause = itemCode
    ? eq(activities.code, itemCode)
    : eq(activities.entityId, sourceEntityId ?? 0);

  const [act] = await db
    .select()
    .from(activities)
    .where(and(whereClause, eq(activities.status, "published")))
    .orderBy(desc(activities.contentVersion))
    .limit(1);

  if (!act) {
    throw appError(
      "NOT_FOUND",
      `Không tìm thấy hoạt động ${itemCode || sourceEntityId} đã duyệt.`
    );
  }

  if (!canAccessTier(act.accessTier, entitlements)) {
    throw appError("TIER_LOCKED", {
      access_tier: act.accessTier,
      required_entitlement: `play_${act.accessTier}_games`,
    });
  }

  return {
    position,
    itemType: "activity",
    itemCode: act.code,
    sourceEntityId: act.entityId,
    sourceContentVersion: act.contentVersion,
    customInstruction: item.custom_instruction ?? null,
    snapshot: buildActivitySnapshot(act),
  };
}

async function resolveGameLevelItem(
  db: ReturnType<typeof getDb>,
  item: LessonPlanItemInput,
  position: number,
  entitlements: string[]
): Promise<PreparedItem> {
  const itemCode = item.item_code;
  const sourceEntityId = item.source_entity_id;
  if (!itemCode && sourceEntityId === undefined) {
    throw appError(
      "VALIDATION_FAILED",
      "Mục game_level cần có item_code hoặc source_entity_id."
    );
  }

  const whereClause = itemCode
    ? eq(gameLevels.code, itemCode)
    : eq(gameLevels.entityId, sourceEntityId ?? 0);

  const [level] = await db
    .select()
    .from(gameLevels)
    .where(and(whereClause, eq(gameLevels.status, "published")))
    .orderBy(desc(gameLevels.contentVersion))
    .limit(1);

  if (!level) {
    throw appError(
      "NOT_FOUND",
      `Không tìm thấy trò chơi ${itemCode || sourceEntityId} đã duyệt.`
    );
  }

  if (!canAccessTier(level.accessTier, entitlements)) {
    throw appError("TIER_LOCKED", {
      access_tier: level.accessTier,
      required_entitlement: `play_${level.accessTier}_games`,
    });
  }

  return {
    position,
    itemType: "game_level",
    itemCode: level.code,
    sourceEntityId: level.entityId,
    sourceContentVersion: level.contentVersion,
    customInstruction: item.custom_instruction ?? null,
    snapshot: buildGameLevelSnapshot({
      ...level,
      difficultyParams:
        (level.difficultyParams as Record<string, unknown> | null) ?? null,
    }),
  };
}

function resolveCustomNoteItem(
  item: LessonPlanItemInput,
  position: number
): PreparedItem {
  const noteContent = item.custom_note || item.custom_instruction || "";
  const noteSnapshot = buildCustomNoteSnapshot({ content: noteContent });

  return {
    position,
    itemType: "custom_note",
    itemCode: null,
    sourceEntityId: null,
    sourceContentVersion: null,
    customInstruction: item.custom_instruction ?? null,
    snapshot: noteSnapshot,
  };
}

async function prepareSingleItem(
  db: ReturnType<typeof getDb>,
  item: LessonPlanItemInput,
  position: number,
  entitlements: string[]
): Promise<PreparedItem> {
  if (item.item_type === "activity") {
    return await resolveActivityItem(db, item, position, entitlements);
  }
  if (item.item_type === "game_level") {
    return await resolveGameLevelItem(db, item, position, entitlements);
  }
  return resolveCustomNoteItem(item, position);
}

async function copyFromSourceLesson(
  db: ReturnType<typeof getDb>,
  userId: number,
  input: CreateLessonPlanInput,
  entitlements: string[]
): Promise<LessonPlanDetail> {
  const sourceCode = input.source_lesson_code || "";
  const [sourceLesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.code, sourceCode), eq(lessons.status, "published")))
    .orderBy(desc(lessons.contentVersion))
    .limit(1);

  if (!sourceLesson) {
    throw appError("NOT_FOUND", "Không tìm thấy bài học nguồn đã duyệt.");
  }

  if (!canAccessTier(sourceLesson.accessTier, entitlements)) {
    throw appError("TIER_LOCKED", {
      access_tier: sourceLesson.accessTier,
      required_entitlement: `play_${sourceLesson.accessTier}_games`,
    });
  }

  const attachedActivities = await db
    .select({
      activity: activities,
      position: lessonActivities.position,
    })
    .from(lessonActivities)
    .innerJoin(activities, eq(lessonActivities.activityId, activities.id))
    .where(
      and(
        eq(lessonActivities.lessonId, sourceLesson.id),
        eq(activities.status, "published")
      )
    )
    .orderBy(asc(lessonActivities.position));

  for (const item of attachedActivities) {
    if (!canAccessTier(item.activity.accessTier, entitlements)) {
      throw appError("TIER_LOCKED", {
        access_tier: item.activity.accessTier,
        required_entitlement: `play_${item.activity.accessTier}_games`,
      });
    }
  }

  return await db.transaction(async (tx) => {
    const [insertedPlan] = await tx
      .insert(lessonPlans)
      .values({
        userId,
        title: input.title || sourceLesson.title,
        targetAge: input.target_age ?? sourceLesson.targetAgeMin ?? null,
        estimatedMinutes:
          input.estimated_minutes ?? sourceLesson.estimatedMinutes ?? null,
        notes: input.notes ?? null,
        sourceLessonCode: sourceLesson.code,
        version: 1,
      })
      .returning();

    let insertedItems: LessonPlanItem[] = [];

    if (attachedActivities.length > 0) {
      const itemsToInsert = attachedActivities.map((row, idx) => ({
        lessonPlanId: insertedPlan.id,
        position: idx,
        itemType: "activity" as const,
        itemCode: row.activity.code,
        sourceEntityId: row.activity.entityId,
        sourceContentVersion: row.activity.contentVersion,
        customInstruction: null,
        snapshot: buildActivitySnapshot(row.activity),
      }));

      const rows = await tx
        .insert(lessonPlanItems)
        .values(itemsToInsert)
        .returning();

      insertedItems = rows.map((r) => ({
        id: r.id,
        lesson_plan_id: r.lessonPlanId,
        position: r.position,
        item_type: r.itemType,
        item_code: r.itemCode,
        source_entity_id: r.sourceEntityId,
        source_content_version: r.sourceContentVersion,
        custom_instruction: r.customInstruction,
        snapshot: r.snapshot as ActivitySnapshot,
        created_at: r.createdAt.toISOString(),
      }));
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_created",
      entity_type: "lesson_plan",
      entity_id: insertedPlan.uuid,
      after_data: {
        id: insertedPlan.id,
        uuid: insertedPlan.uuid,
        title: insertedPlan.title,
        source_lesson_code: sourceLesson.code,
        item_count: insertedItems.length,
      },
    });

    return {
      id: insertedPlan.id,
      uuid: insertedPlan.uuid,
      user_id: insertedPlan.userId,
      title: insertedPlan.title,
      target_age: insertedPlan.targetAge,
      estimated_minutes: insertedPlan.estimatedMinutes,
      notes: insertedPlan.notes,
      source_lesson_code: insertedPlan.sourceLessonCode,
      version: insertedPlan.version,
      item_count: insertedItems.length,
      created_at: insertedPlan.createdAt.toISOString(),
      updated_at: insertedPlan.updatedAt.toISOString(),
      items: insertedItems,
    };
  });
}

async function createBlankPlan(
  db: ReturnType<typeof getDb>,
  userId: number,
  input: CreateLessonPlanInput
): Promise<LessonPlanDetail> {
  return await db.transaction(async (tx) => {
    const [insertedPlan] = await tx
      .insert(lessonPlans)
      .values({
        userId,
        title: input.title,
        targetAge: input.target_age ?? null,
        estimatedMinutes: input.estimated_minutes ?? null,
        notes: input.notes ?? null,
        sourceLessonCode: null,
        version: 1,
      })
      .returning();

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_created",
      entity_type: "lesson_plan",
      entity_id: insertedPlan.uuid,
      after_data: {
        id: insertedPlan.id,
        uuid: insertedPlan.uuid,
        title: insertedPlan.title,
      },
    });

    return {
      id: insertedPlan.id,
      uuid: insertedPlan.uuid,
      user_id: insertedPlan.userId,
      title: insertedPlan.title,
      target_age: insertedPlan.targetAge,
      estimated_minutes: insertedPlan.estimatedMinutes,
      notes: insertedPlan.notes,
      source_lesson_code: null,
      version: insertedPlan.version,
      item_count: 0,
      created_at: insertedPlan.createdAt.toISOString(),
      updated_at: insertedPlan.updatedAt.toISOString(),
      items: [],
    };
  });
}

export async function createLessonPlan(
  userId: number,
  input: CreateLessonPlanInput,
  options?: {
    userEntitlements?: string[];
    monthlyQuotaLimit?: number;
    now?: Date;
  }
): Promise<LessonPlanDetail> {
  const db = getDb();
  const now = options?.now ?? new Date();
  const entitlements = options?.userEntitlements ?? [
    "create_lesson_plan",
    "duplicate_lesson",
    "play_free_games",
    "play_login_games",
  ];
  const quotaLimit =
    options?.monthlyQuotaLimit ?? DEFAULT_LESSON_PLANS_PER_MONTH;

  const requiredEntitlement = input.source_lesson_code
    ? "duplicate_lesson"
    : "create_lesson_plan";
  if (
    !(
      entitlements.includes(requiredEntitlement) ||
      entitlements.includes("create_lesson_plan")
    )
  ) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_entitlement: requiredEntitlement,
    });
  }

  await checkMonthlyQuota(db, userId, quotaLimit, now);

  if (input.source_lesson_code) {
    return await copyFromSourceLesson(db, userId, input, entitlements);
  }

  return await createBlankPlan(db, userId, input);
}

export async function listLessonPlans(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ plans: LessonPlanSummary[]; total: number }> {
  const db = getDb();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessonPlans)
    .where(eq(lessonPlans.userId, userId));
  const total = totalResult?.count ?? 0;

  const plans = await db
    .select({
      id: lessonPlans.id,
      uuid: lessonPlans.uuid,
      userId: lessonPlans.userId,
      title: lessonPlans.title,
      targetAge: lessonPlans.targetAge,
      estimatedMinutes: lessonPlans.estimatedMinutes,
      notes: lessonPlans.notes,
      sourceLessonCode: lessonPlans.sourceLessonCode,
      version: lessonPlans.version,
      createdAt: lessonPlans.createdAt,
      updatedAt: lessonPlans.updatedAt,
      itemCount: sql<number>`(
        select count(*)::int from ${lessonPlanItems}
        where ${lessonPlanItems.lessonPlanId} = ${lessonPlans.id}
      )`,
    })
    .from(lessonPlans)
    .where(eq(lessonPlans.userId, userId))
    .orderBy(desc(lessonPlans.updatedAt))
    .limit(limit)
    .offset(offset);

  return {
    plans: plans.map((p) => ({
      id: p.id,
      uuid: p.uuid,
      user_id: p.userId,
      title: p.title,
      target_age: p.targetAge,
      estimated_minutes: p.estimatedMinutes,
      notes: p.notes,
      source_lesson_code: p.sourceLessonCode,
      version: p.version,
      item_count: p.itemCount,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    })),
    total,
  };
}

async function findLatestPublishedVersions(
  db: ReturnType<typeof getDb>,
  actCodes: string[],
  glCodes: string[]
): Promise<{ actMap: Map<string, number>; glMap: Map<string, number> }> {
  const actMap = new Map<string, number>();
  const glMap = new Map<string, number>();

  if (actCodes.length > 0) {
    const publishedActs = await db
      .select({
        code: activities.code,
        version: activities.contentVersion,
      })
      .from(activities)
      .where(
        and(
          inArray(activities.code, actCodes),
          eq(activities.status, "published")
        )
      );

    for (const row of publishedActs) {
      actMap.set(row.code, row.version);
    }
  }

  if (glCodes.length > 0) {
    const publishedLevels = await db
      .select({
        code: gameLevels.code,
        version: gameLevels.contentVersion,
      })
      .from(gameLevels)
      .where(
        and(
          inArray(gameLevels.code, glCodes),
          eq(gameLevels.status, "published")
        )
      );

    for (const row of publishedLevels) {
      glMap.set(row.code, row.version);
    }
  }

  return { actMap, glMap };
}

export async function getLessonPlanByUuid(
  userId: number,
  planUuid: string
): Promise<LessonPlanDetail> {
  const db = getDb();
  const [plan] = await db
    .select()
    .from(lessonPlans)
    .where(and(eq(lessonPlans.uuid, planUuid), eq(lessonPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw appError("NOT_FOUND", "Không tìm thấy giáo án.");
  }

  const rawItems = await db
    .select()
    .from(lessonPlanItems)
    .where(eq(lessonPlanItems.lessonPlanId, plan.id))
    .orderBy(asc(lessonPlanItems.position));

  const actCodes = rawItems
    .filter((i) => i.itemType === "activity" && i.itemCode)
    .map((i) => i.itemCode as string);
  const glCodes = rawItems
    .filter((i) => i.itemType === "game_level" && i.itemCode)
    .map((i) => i.itemCode as string);

  const { actMap, glMap } = await findLatestPublishedVersions(
    db,
    actCodes,
    glCodes
  );

  const items: LessonPlanItem[] = rawItems.map((item) => {
    let latestVersion: number | null = null;
    let hasUpdate = false;

    if (item.itemType === "activity" && item.itemCode) {
      latestVersion = actMap.get(item.itemCode) ?? null;
      hasUpdate =
        latestVersion !== null &&
        item.sourceContentVersion !== null &&
        latestVersion > item.sourceContentVersion;
    } else if (item.itemType === "game_level" && item.itemCode) {
      latestVersion = glMap.get(item.itemCode) ?? null;
      hasUpdate =
        latestVersion !== null &&
        item.sourceContentVersion !== null &&
        latestVersion > item.sourceContentVersion;
    }

    return {
      id: item.id,
      lesson_plan_id: item.lessonPlanId,
      position: item.position,
      item_type: item.itemType,
      item_code: item.itemCode,
      source_entity_id: item.sourceEntityId,
      source_content_version: item.sourceContentVersion,
      custom_instruction: item.customInstruction,
      snapshot: item.snapshot as LessonPlanItemSnapshot,
      created_at: item.createdAt.toISOString(),
      has_update: hasUpdate,
      latest_version: latestVersion ?? undefined,
    };
  });

  return {
    id: plan.id,
    uuid: plan.uuid,
    user_id: plan.userId,
    title: plan.title,
    target_age: plan.targetAge,
    estimated_minutes: plan.estimatedMinutes,
    notes: plan.notes,
    source_lesson_code: plan.sourceLessonCode,
    version: plan.version,
    item_count: items.length,
    created_at: plan.createdAt.toISOString(),
    updated_at: plan.updatedAt.toISOString(),
    items,
  };
}

export async function updateLessonPlanMeta(
  userId: number,
  planUuid: string,
  input: UpdateLessonPlanMetaInput
): Promise<LessonPlanSummary> {
  const db = getDb();
  const [plan] = await db
    .select()
    .from(lessonPlans)
    .where(and(eq(lessonPlans.uuid, planUuid), eq(lessonPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw appError("NOT_FOUND", "Không tìm thấy giáo án.");
  }

  if (
    input.expected_version !== undefined &&
    plan.version !== input.expected_version
  ) {
    throw appError(
      "VERSION_CONFLICT",
      "Phiên bản giáo án đã thay đổi. Vui lòng tải lại trang."
    );
  }

  const { updated, count } = await db.transaction(async (tx) => {
    const targetAge =
      input.target_age === undefined ? plan.targetAge : input.target_age;
    const estimatedMinutes =
      input.estimated_minutes === undefined
        ? plan.estimatedMinutes
        : input.estimated_minutes;
    const notes = input.notes === undefined ? plan.notes : input.notes;

    const [updatedPlan] = await tx
      .update(lessonPlans)
      .set({
        title: input.title ?? plan.title,
        targetAge,
        estimatedMinutes,
        notes,
        version: plan.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(lessonPlans.id, plan.id))
      .returning();

    const [countResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(lessonPlanItems)
      .where(eq(lessonPlanItems.lessonPlanId, plan.id));

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_approved",
      entity_type: "lesson_plan",
      entity_id: plan.uuid,
      after_data: {
        title: updatedPlan.title,
        version: updatedPlan.version,
      },
    });

    return { updated: updatedPlan, count: countResult?.count ?? 0 };
  });

  return {
    id: updated.id,
    uuid: updated.uuid,
    user_id: updated.userId,
    title: updated.title,
    target_age: updated.targetAge,
    estimated_minutes: updated.estimatedMinutes,
    notes: updated.notes,
    source_lesson_code: updated.sourceLessonCode,
    version: updated.version,
    item_count: count,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  };
}

export async function replaceLessonPlanItems(
  userId: number,
  planUuid: string,
  input: ReplaceLessonPlanItemsInput,
  options?: {
    userEntitlements?: string[];
  }
): Promise<LessonPlanDetail> {
  const db = getDb();
  const entitlements = options?.userEntitlements ?? [
    "customize_lesson",
    "create_lesson_plan",
    "play_free_games",
    "play_login_games",
  ];

  if (
    !(
      entitlements.includes("customize_lesson") ||
      entitlements.includes("create_lesson_plan")
    )
  ) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_entitlement: "customize_lesson",
    });
  }

  const [plan] = await db
    .select()
    .from(lessonPlans)
    .where(and(eq(lessonPlans.uuid, planUuid), eq(lessonPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw appError("NOT_FOUND", "Không tìm thấy giáo án.");
  }

  if (plan.version !== input.expected_version) {
    throw appError(
      "VERSION_CONFLICT",
      "Phiên bản giáo án đã thay đổi. Vui lòng tải lại trang."
    );
  }

  const preparedItems: PreparedItem[] = [];
  for (let i = 0; i < input.items.length; i++) {
    const prepared = await prepareSingleItem(
      db,
      input.items[i],
      i,
      entitlements
    );
    preparedItems.push(prepared);
  }

  return await db.transaction(async (tx) => {
    await tx
      .delete(lessonPlanItems)
      .where(eq(lessonPlanItems.lessonPlanId, plan.id));

    let insertedRows: (typeof lessonPlanItems.$inferSelect)[] = [];
    if (preparedItems.length > 0) {
      insertedRows = await tx
        .insert(lessonPlanItems)
        .values(
          preparedItems.map((item) => ({
            lessonPlanId: plan.id,
            position: item.position,
            itemType: item.itemType,
            itemCode: item.itemCode,
            sourceEntityId: item.sourceEntityId,
            sourceContentVersion: item.sourceContentVersion,
            customInstruction: item.customInstruction,
            snapshot: item.snapshot,
          }))
        )
        .returning();
    }

    const [p] = await tx
      .update(lessonPlans)
      .set({
        version: plan.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(lessonPlans.id, plan.id))
      .returning();

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_approved",
      entity_type: "lesson_plan",
      entity_id: plan.uuid,
      after_data: {
        version: p.version,
        item_count: insertedRows.length,
      },
    });

    const items: LessonPlanItem[] = insertedRows.map((r) => ({
      id: r.id,
      lesson_plan_id: r.lessonPlanId,
      position: r.position,
      item_type: r.itemType,
      item_code: r.itemCode,
      source_entity_id: r.sourceEntityId,
      source_content_version: r.sourceContentVersion,
      custom_instruction: r.customInstruction,
      snapshot: r.snapshot as LessonPlanItemSnapshot,
      created_at: r.createdAt.toISOString(),
    }));

    return {
      id: p.id,
      uuid: p.uuid,
      user_id: p.userId,
      title: p.title,
      target_age: p.targetAge,
      estimated_minutes: p.estimatedMinutes,
      notes: p.notes,
      source_lesson_code: p.sourceLessonCode,
      version: p.version,
      item_count: items.length,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
      items,
    };
  });
}

async function fetchRefreshedActivitySnapshot(
  db: ReturnType<typeof getDb>,
  code: string,
  entitlements: string[]
): Promise<{ snapshot: ActivitySnapshot; version: number }> {
  const [act] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.code, code), eq(activities.status, "published")))
    .orderBy(desc(activities.contentVersion))
    .limit(1);

  if (!act) {
    throw appError("NOT_FOUND", "Không tìm thấy phiên bản hoạt động đã duyệt.");
  }

  if (!canAccessTier(act.accessTier, entitlements)) {
    throw appError("TIER_LOCKED", {
      access_tier: act.accessTier,
      required_entitlement: `play_${act.accessTier}_games`,
    });
  }

  return {
    snapshot: buildActivitySnapshot(act),
    version: act.contentVersion,
  };
}

async function fetchRefreshedGameLevelSnapshot(
  db: ReturnType<typeof getDb>,
  code: string,
  entitlements: string[]
): Promise<{ snapshot: GameLevelSnapshot; version: number }> {
  const [level] = await db
    .select()
    .from(gameLevels)
    .where(and(eq(gameLevels.code, code), eq(gameLevels.status, "published")))
    .orderBy(desc(gameLevels.contentVersion))
    .limit(1);

  if (!level) {
    throw appError("NOT_FOUND", "Không tìm thấy phiên bản trò chơi đã duyệt.");
  }

  if (!canAccessTier(level.accessTier, entitlements)) {
    throw appError("TIER_LOCKED", {
      access_tier: level.accessTier,
      required_entitlement: `play_${level.accessTier}_games`,
    });
  }

  return {
    snapshot: buildGameLevelSnapshot({
      ...level,
      difficultyParams:
        (level.difficultyParams as Record<string, unknown> | null) ?? null,
    }),
    version: level.contentVersion,
  };
}

export async function refreshLessonPlanItem(
  userId: number,
  planUuid: string,
  position: number,
  options?: {
    userEntitlements?: string[];
  }
): Promise<LessonPlanDetail> {
  const db = getDb();
  const entitlements = options?.userEntitlements ?? [
    "customize_lesson",
    "create_lesson_plan",
    "play_free_games",
    "play_login_games",
  ];

  const [plan] = await db
    .select()
    .from(lessonPlans)
    .where(and(eq(lessonPlans.uuid, planUuid), eq(lessonPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw appError("NOT_FOUND", "Không tìm thấy giáo án.");
  }

  const [item] = await db
    .select()
    .from(lessonPlanItems)
    .where(
      and(
        eq(lessonPlanItems.lessonPlanId, plan.id),
        eq(lessonPlanItems.position, position)
      )
    )
    .limit(1);

  if (!item) {
    throw appError("NOT_FOUND", "Không tìm thấy mục cần cập nhật.");
  }

  if (item.itemType === "custom_note") {
    return await getLessonPlanByUuid(userId, planUuid);
  }

  let newSnapshot: ActivitySnapshot | GameLevelSnapshot | null = null;
  let newVersion: number | null = null;

  if (item.itemType === "activity") {
    const refreshed = await fetchRefreshedActivitySnapshot(
      db,
      item.itemCode ?? "",
      entitlements
    );
    newSnapshot = refreshed.snapshot;
    newVersion = refreshed.version;
  } else if (item.itemType === "game_level") {
    const refreshed = await fetchRefreshedGameLevelSnapshot(
      db,
      item.itemCode ?? "",
      entitlements
    );
    newSnapshot = refreshed.snapshot;
    newVersion = refreshed.version;
  }

  if (newSnapshot && newVersion !== null) {
    await db
      .update(lessonPlanItems)
      .set({
        snapshot: newSnapshot,
        sourceContentVersion: newVersion,
      })
      .where(eq(lessonPlanItems.id, item.id));
  }

  return await getLessonPlanByUuid(userId, planUuid);
}

export async function deleteLessonPlan(
  userId: number,
  planUuid: string
): Promise<{ success: boolean }> {
  const db = getDb();
  const [plan] = await db
    .select()
    .from(lessonPlans)
    .where(and(eq(lessonPlans.uuid, planUuid), eq(lessonPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw appError("NOT_FOUND", "Không tìm thấy giáo án.");
  }

  await db.transaction(async (tx) => {
    await tx.delete(lessonPlans).where(eq(lessonPlans.id, plan.id));
    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_deleted",
      entity_type: "lesson_plan",
      entity_id: plan.uuid,
      before_data: {
        id: plan.id,
        title: plan.title,
      },
      reason: "Xóa giáo án cá nhân",
    });
  });

  return { success: true };
}

export async function exportLessonPlan(
  userId: number,
  planUuid: string,
  options?: {
    userEntitlements?: string[];
  }
): Promise<{ plan_uuid: string; export_token: string }> {
  const entitlements = options?.userEntitlements ?? [
    "create_lesson_plan",
    "export_pdf",
  ];

  if (!entitlements.includes("export_pdf")) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_entitlement: "export_pdf",
    });
  }

  const detail = await getLessonPlanByUuid(userId, planUuid);

  return {
    plan_uuid: detail.uuid,
    export_token: `exp_${detail.uuid}_${Date.now()}`,
  };
}

export async function notifyLessonPlanSourceUpdated(
  entityType: "lesson" | "activity" | "game_level",
  entityId: number,
  newVersion: number,
  entityCode: string
): Promise<number> {
  const db = getDb();

  let matchedUsers: { userId: number; planTitle: string }[] = [];

  if (entityType === "lesson") {
    matchedUsers = await db
      .select({
        userId: lessonPlans.userId,
        planTitle: lessonPlans.title,
      })
      .from(lessonPlans)
      .where(eq(lessonPlans.sourceLessonCode, entityCode));
  } else {
    matchedUsers = await db
      .select({
        userId: lessonPlans.userId,
        planTitle: lessonPlans.title,
      })
      .from(lessonPlanItems)
      .innerJoin(lessonPlans, eq(lessonPlanItems.lessonPlanId, lessonPlans.id))
      .where(
        and(
          eq(lessonPlanItems.itemType, entityType),
          or(
            eq(lessonPlanItems.itemCode, entityCode),
            eq(lessonPlanItems.sourceEntityId, entityId)
          )
        )
      )
      .groupBy(lessonPlans.userId, lessonPlans.title);
  }

  if (matchedUsers.length === 0) {
    return 0;
  }

  for (const match of matchedUsers) {
    const [notif] = await db
      .insert(notifications)
      .values({
        recipientType: "user",
        recipientId: match.userId,
        templateCode: "lesson_plan_source_updated",
        payload: {
          entity_type: entityType,
          entity_id: entityId,
          entity_code: entityCode,
          new_version: newVersion,
          plan_title: match.planTitle,
        },
      })
      .returning();

    if (notif) {
      await db.insert(notificationDeliveries).values({
        notificationId: notif.id,
        channel: "in_app",
        status: "dispatched",
      });
    }
  }

  return matchedUsers.length;
}
