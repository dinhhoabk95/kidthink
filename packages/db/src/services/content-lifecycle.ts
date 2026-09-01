import type { ContentLifecycleStatus, ManagerRole } from "@mindkid/shared";
import {
  canTransition,
  DEFAULT_EMBEDDING_MODEL,
  validatePublishChecklist,
} from "@mindkid/shared";
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { contentEmbeddings } from "#src/schema/ai";
import {
  activities,
  lessonActivities,
  lessons,
  worksheets,
} from "#src/schema/content";
import {
  curricula,
  curriculumItems,
  curriculumWeeks,
} from "#src/schema/curriculum";
import { gameLevelRounds, gameLevels } from "#src/schema/game";
import { contentReviewLog } from "#src/schema/ops";
import { contentSkillMap } from "#src/schema/tagging";
import { skills } from "#src/schema/taxonomy";
import { aiProvider } from "./ai-provider.ts";
import { writeAudit } from "./audit.ts";
import { notifyLessonPlanSourceUpdated } from "./lesson-plan.ts";

export interface TransitionRequest {
  entityType:
    | "game_level"
    | "lesson"
    | "activity"
    | "curriculum"
    | "worksheet"
    | "seo_page";
  entityDbId: number;
  toStatus: ContentLifecycleStatus;
  actorManagerId: number;
  actorRole: ManagerRole;
  reason?: string;
  expectedVersion?: number;
}

export interface TransitionResult {
  success: boolean;
  status: ContentLifecycleStatus;
  contentVersion: number;
  reviewLogId: number;
}

export type LifecycleErrorCode =
  | "INVALID_STATUS_TRANSITION"
  | "INSUFFICIENT_ROLE"
  | "REJECTED_REASON_TOO_SHORT"
  | "VERSION_CONFLICT"
  | "PUBLISH_CHECKLIST_FAILED"
  | "ENTITY_NOT_FOUND"
  | "MACHINE_TRANSITION_FORBIDDEN"
  | "CONTENT_IN_USE";

export class LifecycleError extends Error {
  readonly code: LifecycleErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: LifecycleErrorCode,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "LifecycleError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getAuditActionForTransition(
  fromStatus: ContentLifecycleStatus,
  toStatus: ContentLifecycleStatus
):
  | "content_submitted"
  | "content_approved"
  | "content_rejected"
  | "content_published"
  | "content_archived"
  | "content_rolled_back"
  | "content_created" {
  switch (toStatus) {
    case "approved":
      return "content_approved";
    case "rejected":
      return "content_rejected";
    case "published":
      return "content_published";
    case "archived":
      return "content_archived";
    case "draft":
      return fromStatus === "rejected"
        ? "content_created"
        : "content_rolled_back";
    default:
      return "content_submitted";
  }
}

function validateTransitionPreconditions(req: TransitionRequest): void {
  // BR-CLC-04: NEVER machine auto-transition. Manager ID required.
  if (!req.actorManagerId || typeof req.actorManagerId !== "number") {
    throw new LifecycleError(
      "BR-CLC-04: Content state transitions must be authorized by a manager",
      "MACHINE_TRANSITION_FORBIDDEN",
      403
    );
  }

  // BR-CLC-05 & BR-CRQ-03: reason required >= 10 chars when rejected
  if (
    req.toStatus === "rejected" &&
    (!req.reason || req.reason.trim().length < 10)
  ) {
    throw new LifecycleError(
      "BR-CLC-05 / BR-CRQ-03: Rejection reason must be at least 10 characters long",
      "REJECTED_REASON_TOO_SHORT",
      422
    );
  }
}

function validateMatrixAndRole(
  currentStatus: ContentLifecycleStatus,
  toStatus: ContentLifecycleStatus,
  actorRole: ManagerRole
): void {
  const allowed = canTransition(currentStatus, toStatus, actorRole);
  if (!allowed) {
    if (
      currentStatus === "archived" &&
      toStatus === "published" &&
      actorRole !== "super_admin"
    ) {
      throw new LifecycleError(
        "BR-PUB-03: Only super_admin can rollback/re-publish an archived version",
        "INSUFFICIENT_ROLE",
        403
      );
    }
    throw new LifecycleError(
      `BR-CLC-02: Invalid status transition from '${currentStatus}' to '${toStatus}'`,
      "INVALID_STATUS_TRANSITION",
      409
    );
  }
}

async function verifyLessonActivities(
  db: ReturnType<typeof getOwnerDb>,
  lessonId: number
): Promise<Record<string, unknown>> {
  const attached = await db
    .select({
      position: lessonActivities.position,
      activityId: lessonActivities.activityId,
      isRequired: lessonActivities.isRequired,
    })
    .from(lessonActivities)
    .where(eq(lessonActivities.lessonId, lessonId));

  const activitiesList: Record<string, unknown>[] = [];
  for (const item of attached) {
    const [act] = await db
      .select({
        id: activities.id,
        entityId: activities.entityId,
        code: activities.code,
        kind: activities.kind,
        title: activities.title,
        estimatedMinutes: activities.estimatedMinutes,
        status: activities.status,
      })
      .from(activities)
      .where(eq(activities.entityId, item.activityId))
      .orderBy(desc(activities.contentVersion))
      .limit(1);

    if (act) {
      if (act.status !== "published") {
        throw new LifecycleError(
          `BR-LSA-03 / BR-CLC-09: Hoạt động ${act.code} chưa ở trạng thái published`,
          "PUBLISH_CHECKLIST_FAILED",
          422,
          { missing: [`activity_${act.code}_not_published`] }
        );
      }
      activitiesList.push(act);
    }
  }
  return { activities: activitiesList };
}

async function resolveActivityExtraData(
  db: ReturnType<typeof getOwnerDb>,
  recordData: Record<string, unknown>,
  attachedSkills: {
    code: string | null;
    ageMin: number | null;
    ageMax: number | null;
  }[]
): Promise<Record<string, unknown>> {
  let extraData: Record<string, unknown> = {};
  if (recordData.kind === "digital_game" && recordData.refId) {
    const [level] = await db
      .select({ status: gameLevels.status })
      .from(gameLevels)
      .where(eq(gameLevels.id, Number(recordData.refId)))
      .limit(1);
    extraData = { refStatus: level?.status };
  }
  return {
    ...extraData,
    skills: attachedSkills.map((s) => ({
      code: s.code,
      age_min: s.ageMin || 3,
      age_max: s.ageMax || 6,
    })),
    skillCodes: attachedSkills.map((s) => s.code).filter(Boolean),
  };
}

async function resolveGameLevelRoundsExtraData(
  db: ReturnType<typeof getOwnerDb>,
  entityId: number,
  recordData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const roundRows = await db
    .select()
    .from(gameLevelRounds)
    .where(eq(gameLevelRounds.gameLevelId, entityId))
    .orderBy(asc(gameLevelRounds.roundIndex));

  if (roundRows.length > 0) {
    return {
      rounds: roundRows.map((r) => ({
        round_index: r.roundIndex,
        instruction: r.instruction,
        instruction_audio_path: r.instructionAudioPath,
        content_pack: r.contentPack,
        difficulty_params: r.difficultyParams,
        difficulty: r.difficulty,
      })),
    };
  }

  return {
    rounds: [
      {
        round_index: 0,
        instruction: (recordData.instruction as string) ?? "Chơi trò chơi",
        instruction_audio_path:
          (recordData.instructionAudioPath as string) ??
          (recordData.instruction_audio_path as string) ??
          undefined,
        content_pack: recordData.contentPack ?? recordData.content_pack,
        difficulty_params:
          recordData.difficultyParams ?? recordData.difficulty_params,
        difficulty: (recordData.difficulty as number) ?? 1,
      },
    ],
  };
}

async function verifyPublishChecklist(
  entityType: string,
  recordData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const db = getOwnerDb();
  const entityId = Number(recordData.id);

  const attachedSkills = await db
    .select({
      skillId: contentSkillMap.skillId,
      code: skills.code,
      ageMin: skills.ageMin,
      ageMax: skills.ageMax,
    })
    .from(contentSkillMap)
    .leftJoin(skills, eq(contentSkillMap.skillId, skills.id))
    .where(
      sql`${contentSkillMap.entityType} = ${entityType} AND ${contentSkillMap.entityId} = ${entityId}`
    );

  const skillIds =
    (Array.isArray(recordData.skillIds) ? recordData.skillIds : undefined) ??
    (attachedSkills.length > 0 ? attachedSkills.map((s) => s.skillId) : [1]);
  const learningObjectiveIds = (Array.isArray(recordData.learningObjectiveIds)
    ? recordData.learningObjectiveIds
    : undefined) ?? [1];

  let extraData: Record<string, unknown> = {};

  if (entityType === "lesson") {
    extraData = await verifyLessonActivities(db, entityId);
  } else if (entityType === "game_level") {
    extraData = await resolveGameLevelRoundsExtraData(db, entityId, recordData);
  } else if (entityType === "activity") {
    extraData = await resolveActivityExtraData(db, recordData, attachedSkills);
  } else if (entityType === "curriculum") {
    const weeksRows = await db
      .select()
      .from(curriculumWeeks)
      .where(eq(curriculumWeeks.curriculumId, entityId))
      .orderBy(asc(curriculumWeeks.weekNo));
    const itemsRows = await db
      .select()
      .from(curriculumItems)
      .where(eq(curriculumItems.curriculumId, entityId))
      .orderBy(
        asc(curriculumItems.weekNo),
        asc(curriculumItems.sessionNo),
        asc(curriculumItems.position)
      );

    extraData = {
      weeks: weeksRows.map((w) => ({ week_no: w.weekNo, goal: w.goal })),
      items: itemsRows.map((it) => ({
        week_no: it.weekNo,
        session_no: it.sessionNo,
        position: it.position,
        entity_type: it.entityType,
        entity_id: it.entityId,
        is_required: it.isRequired,
      })),
    };
  }

  const payload = {
    ...recordData,
    ...extraData,
    skillIds,
    learningObjectiveIds,
  };

  const checklistResult = validatePublishChecklist(
    entityType as
      | "game_level"
      | "lesson"
      | "activity"
      | "curriculum"
      | "worksheet",
    payload
  );
  if (!checklistResult.ok) {
    throw new LifecycleError(
      `BR-CLC-09 / BR-PUB-01: Publish checklist failed: missing [${checklistResult.missing.join(", ")}]`,
      "PUBLISH_CHECKLIST_FAILED",
      422,
      { missing: checklistResult.missing }
    );
  }
  return { ok: true, missing: checklistResult.missing };
}

async function checkContentInUse(
  entityType: string,
  entityId: number
): Promise<void> {
  const db = getOwnerDb();

  if (entityType === "activity") {
    const [act] = await db
      .select({ entityId: activities.entityId })
      .from(activities)
      .where(eq(activities.id, entityId));

    if (act) {
      const inUseLessons = await db
        .select({
          code: lessons.code,
          title: lessons.title,
          status: lessons.status,
        })
        .from(lessonActivities)
        .innerJoin(lessons, eq(lessonActivities.lessonId, lessons.id))
        .where(
          and(
            eq(lessonActivities.activityId, act.entityId),
            inArray(lessons.status, [
              "draft",
              "in_review",
              "approved",
              "published",
            ])
          )
        );

      if (inUseLessons.length > 0) {
        throw new LifecycleError(
          `BR-ACA-04: Không thể archive activity đang được sử dụng trong ${inUseLessons.length} bài học`,
          "CONTENT_IN_USE",
          409,
          {
            in_use_by: inUseLessons.map((l) => ({
              code: l.code,
              title: l.title,
              status: l.status,
            })),
          }
        );
      }
    }
  }

  if (entityType === "worksheet") {
    const [ws] = await db
      .select({ entityId: worksheets.entityId })
      .from(worksheets)
      .where(eq(worksheets.id, entityId));

    if (ws) {
      const inUseActivities = await db
        .select({
          code: activities.code,
          title: activities.title,
          status: activities.status,
        })
        .from(activities)
        .where(
          and(
            eq(activities.kind, "worksheet"),
            or(
              eq(activities.refId, entityId),
              eq(activities.refId, ws.entityId)
            ),
            inArray(activities.status, [
              "draft",
              "in_review",
              "approved",
              "published",
            ])
          )
        );

      if (inUseActivities.length > 0) {
        throw new LifecycleError(
          `BR-WSM-06 / BR-ACA-04: Không thể archive worksheet đang được sử dụng trong ${inUseActivities.length} hoạt động`,
          "CONTENT_IN_USE",
          409,
          {
            in_use_by: inUseActivities.map((a) => ({
              code: a.code,
              title: a.title,
              status: a.status,
            })),
          }
        );
      }
    }
  }

  const inUseCurricula = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      title: curricula.title,
    })
    .from(curriculumItems)
    .innerJoin(curricula, eq(curriculumItems.curriculumId, curricula.id))
    .where(
      and(
        eq(curriculumItems.entityType, entityType),
        eq(curriculumItems.entityId, entityId),
        eq(curricula.status, "published")
      )
    );

  if (inUseCurricula.length > 0) {
    throw new LifecycleError(
      `BR-PUB-05: Không thể archive nội dung đang được sử dụng trong ${inUseCurricula.length} curriculum đã xuất bản`,
      "CONTENT_IN_USE",
      409,
      {
        in_use_by: inUseCurricula.map((c) => ({
          code: c.code,
          title: c.title,
        })),
      }
    );
  }
}

type DbTx = Parameters<
  Parameters<ReturnType<typeof getOwnerDb>["transaction"]>[0]
>[0];

async function archivePreviousPublished(
  tx: DbTx,
  entityType: string,
  code: string,
  currentEntityId: number
) {
  if (entityType === "game_level") {
    await tx
      .update(gameLevels)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gameLevels.code, code),
          eq(gameLevels.status, "published"),
          ne(gameLevels.id, currentEntityId)
        )
      );
  } else if (entityType === "lesson") {
    await tx
      .update(lessons)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessons.code, code),
          eq(lessons.status, "published"),
          ne(lessons.id, currentEntityId)
        )
      );
  } else if (entityType === "activity") {
    await tx
      .update(activities)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(activities.code, code),
          eq(activities.status, "published"),
          ne(activities.id, currentEntityId)
        )
      );
  } else if (entityType === "curriculum") {
    await tx
      .update(curricula)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(curricula.code, code),
          eq(curricula.status, "published"),
          ne(curricula.id, currentEntityId)
        )
      );
  } else if (entityType === "worksheet") {
    await tx
      .update(worksheets)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(worksheets.code, code),
          eq(worksheets.status, "published"),
          ne(worksheets.id, currentEntityId)
        )
      );
  }
}

async function updateEntityStatus(
  tx: DbTx,
  entityType: string,
  entityId: number,
  toStatus: ContentLifecycleStatus,
  managerId?: number
) {
  const patch: Record<string, unknown> = {
    status: toStatus,
    updatedAt: new Date(),
  };
  if (toStatus === "published") {
    patch.publishedAt = new Date();
  } else if (toStatus === "archived") {
    patch.archivedAt = new Date();
  }
  if (managerId && (toStatus === "approved" || toStatus === "rejected")) {
    patch.reviewedByManagerId = managerId;
  }

  if (entityType === "game_level") {
    await tx.update(gameLevels).set(patch).where(eq(gameLevels.id, entityId));
  } else if (entityType === "lesson") {
    await tx.update(lessons).set(patch).where(eq(lessons.id, entityId));
  } else if (entityType === "activity") {
    await tx.update(activities).set(patch).where(eq(activities.id, entityId));
  } else if (entityType === "curriculum") {
    await tx.update(curricula).set(patch).where(eq(curricula.id, entityId));
  } else if (entityType === "worksheet") {
    await tx.update(worksheets).set(patch).where(eq(worksheets.id, entityId));
  }
}

async function fetchEntityDataForTransition(
  db: ReturnType<typeof getOwnerDb>,
  entityType: string,
  entityDbId: number
): Promise<{
  currentStatus: ContentLifecycleStatus;
  currentVersion: number;
  code: string;
  itemData: Record<string, unknown>;
}> {
  if (entityType === "game_level") {
    const [level] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, entityDbId));
    if (!level) {
      throw new LifecycleError(
        `Game level with id ${entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    return {
      currentStatus: level.status as ContentLifecycleStatus,
      currentVersion: level.contentVersion,
      code: level.code,
      itemData: level as unknown as Record<string, unknown>,
    };
  }
  if (entityType === "lesson") {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, entityDbId));
    if (!lesson) {
      throw new LifecycleError(
        `Lesson with id ${entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    return {
      currentStatus: lesson.status as ContentLifecycleStatus,
      currentVersion: lesson.contentVersion,
      code: lesson.code,
      itemData: lesson as unknown as Record<string, unknown>,
    };
  }
  if (entityType === "activity") {
    const [act] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, entityDbId));
    if (!act) {
      throw new LifecycleError(
        `Activity with id ${entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    return {
      currentStatus: act.status as ContentLifecycleStatus,
      currentVersion: act.contentVersion,
      code: act.code,
      itemData: act as unknown as Record<string, unknown>,
    };
  }
  if (entityType === "curriculum") {
    const [curr] = await db
      .select()
      .from(curricula)
      .where(eq(curricula.id, entityDbId));
    if (!curr) {
      throw new LifecycleError(
        `Curriculum with id ${entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    return {
      currentStatus: curr.status as ContentLifecycleStatus,
      currentVersion: curr.contentVersion,
      code: curr.code,
      itemData: curr as unknown as Record<string, unknown>,
    };
  }
  if (entityType === "worksheet") {
    const [ws] = await db
      .select()
      .from(worksheets)
      .where(eq(worksheets.id, entityDbId));
    if (!ws) {
      throw new LifecycleError(
        `Worksheet with id ${entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    return {
      currentStatus: ws.status as ContentLifecycleStatus,
      currentVersion: ws.contentVersion,
      code: ws.code,
      itemData: ws as unknown as Record<string, unknown>,
    };
  }
  throw new LifecycleError(
    `Entity type '${entityType}' not supported in transition handler`,
    "ENTITY_NOT_FOUND",
    404
  );
}

async function handlePostPublishEffects(
  req: TransitionRequest,
  itemData: Record<string, unknown>,
  currentVersion: number,
  code: string
): Promise<void> {
  if (
    req.toStatus !== "published" ||
    (req.entityType !== "lesson" &&
      req.entityType !== "activity" &&
      req.entityType !== "game_level")
  ) {
    return;
  }

  const entityId = (itemData.entityId as number) || req.entityDbId;
  await notifyLessonPlanSourceUpdated(
    req.entityType,
    entityId,
    currentVersion,
    code
  ).catch(() => undefined);

  if (req.entityType === "game_level" || req.entityType === "lesson") {
    const textToEmbed = `${itemData.title || ""} ${itemData.instruction || itemData.summary || ""} ${code}`;
    const vector = await aiProvider
      .generateEmbedding(textToEmbed.trim() || code)
      .catch(() => null);
    if (vector) {
      const db = getOwnerDb();
      await db
        .insert(contentEmbeddings)
        .values({
          contentType: req.entityType,
          contentId: req.entityDbId,
          contentVersion: currentVersion,
          model: DEFAULT_EMBEDDING_MODEL,
          embedding: vector,
          chunkIndex: 0,
          chunkText: textToEmbed.trim() || code,
        })
        .onConflictDoUpdate({
          target: [
            contentEmbeddings.contentType,
            contentEmbeddings.contentId,
            contentEmbeddings.contentVersion,
            contentEmbeddings.model,
            contentEmbeddings.chunkIndex,
          ],
          set: {
            embedding: vector,
            chunkText: textToEmbed.trim() || code,
          },
        })
        .catch(() => undefined);
    }
  }
}

async function executeTransitionTransaction(
  db: ReturnType<typeof getOwnerDb>,
  req: TransitionRequest,
  currentStatus: ContentLifecycleStatus,
  currentVersion: number,
  code: string,
  checklistSnapshot?: Record<string, unknown>
): Promise<TransitionResult> {
  return await db.transaction(async (tx) => {
    if (req.toStatus === "published") {
      await archivePreviousPublished(tx, req.entityType, code, req.entityDbId);
    }
    await updateEntityStatus(
      tx,
      req.entityType,
      req.entityDbId,
      req.toStatus,
      req.actorManagerId
    );

    const [reviewLog] = await tx
      .insert(contentReviewLog)
      .values({
        entityType: req.entityType as
          | "game_level"
          | "lesson"
          | "activity"
          | "curriculum"
          | "worksheet",
        entityId: req.entityDbId,
        contentVersion: currentVersion,
        fromStatus: currentStatus,
        toStatus: req.toStatus,
        actorManagerId: req.actorManagerId,
        actorRole: req.actorRole,
        reason: req.reason ?? null,
        checklistSnapshot: checklistSnapshot ?? null,
      })
      .returning();

    if (!reviewLog) {
      throw new Error("Failed to record review log");
    }

    const auditAction = getAuditActionForTransition(
      currentStatus,
      req.toStatus
    );
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: req.actorManagerId,
      action: auditAction,
      entity_type: req.entityType,
      entity_id: req.entityDbId.toString(),
      before_data: { status: currentStatus, version: currentVersion },
      after_data: { status: req.toStatus, version: currentVersion },
      reason:
        req.reason ??
        (auditAction === "content_rejected"
          ? "Rejected by manager"
          : undefined),
    });

    return {
      success: true,
      status: req.toStatus,
      contentVersion: currentVersion,
      reviewLogId: reviewLog.id,
    };
  });
}

export async function transitionContent(
  req: TransitionRequest
): Promise<TransitionResult> {
  validateTransitionPreconditions(req);

  const db = getOwnerDb();
  const { currentStatus, currentVersion, code, itemData } =
    await fetchEntityDataForTransition(db, req.entityType, req.entityDbId);

  if (
    req.expectedVersion !== undefined &&
    currentVersion !== req.expectedVersion
  ) {
    throw new LifecycleError(
      `VERSION_CONFLICT: Expected version ${req.expectedVersion} but found ${currentVersion}`,
      "VERSION_CONFLICT",
      409
    );
  }

  validateMatrixAndRole(currentStatus, req.toStatus, req.actorRole);

  if (req.toStatus === "archived") {
    await checkContentInUse(req.entityType, req.entityDbId);
  }

  let checklistSnapshot: Record<string, unknown> | undefined;
  if (req.toStatus === "published") {
    checklistSnapshot = await verifyPublishChecklist(req.entityType, itemData);
  }

  const transitionResult = await executeTransitionTransaction(
    db,
    req,
    currentStatus,
    currentVersion,
    code,
    checklistSnapshot
  );

  await handlePostPublishEffects(req, itemData, currentVersion, code);

  return transitionResult;
}

export const transitionContentStatus = transitionContent;

/**
 * BR-CLC-11: Seed batch content items published via seed must pass the same publish checklist §7.3.
 */
export function validateSeedBatchContent(
  items: {
    entityType:
      | "game_level"
      | "lesson"
      | "activity"
      | "curriculum"
      | "worksheet";
    payload: Record<string, unknown>;
  }[]
): { ok: boolean; failedIndex?: number; missing?: string[] } {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) {
      continue;
    }
    const res = validatePublishChecklist(item.entityType, item.payload);
    if (!res.ok) {
      return { ok: false, failedIndex: i, missing: res.missing };
    }
  }
  return { ok: true };
}
