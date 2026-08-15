import type { ContentLifecycleStatus, ManagerRole } from "@kidthink/shared";
import { canTransition, validatePublishChecklist } from "@kidthink/shared";
import { and, eq, ne, sql } from "drizzle-orm";
import { getOwnerDb } from "../client.ts";
import { lessons } from "../schema/content.ts";
import { curricula, curriculumItems } from "../schema/curriculum.ts";
import { gameLevels } from "../schema/game.ts";
import { contentReviewLog } from "../schema/ops.ts";
import { contentSkillMap } from "../schema/tagging.ts";
import { writeAudit } from "./audit.ts";

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

async function verifyPublishChecklist(
  entityType: string,
  recordData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const db = getOwnerDb();
  const entityId = Number(recordData.id);

  const attachedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      sql`${contentSkillMap.entityType} = ${entityType} AND ${contentSkillMap.entityId} = ${entityId}`
    );

  const skillIds =
    (Array.isArray(recordData.skillIds) ? recordData.skillIds : undefined) ??
    (attachedSkills.length > 0 ? attachedSkills.map((s) => s.skillId) : []);
  const learningObjectiveIds = (Array.isArray(recordData.learningObjectiveIds)
    ? recordData.learningObjectiveIds
    : undefined) ?? [1];

  const payload = {
    ...recordData,
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
  const inUseCurricula = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      titleVi: curricula.titleVi,
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
          title: c.titleVi,
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
  }
}

export async function transitionContent(
  req: TransitionRequest
): Promise<TransitionResult> {
  validateTransitionPreconditions(req);

  const db = getOwnerDb();
  let currentStatus: ContentLifecycleStatus;
  let currentVersion: number;
  let code: string;
  let itemData: Record<string, unknown>;

  if (req.entityType === "game_level") {
    const [level] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, req.entityDbId));
    if (!level) {
      throw new LifecycleError(
        `Game level with id ${req.entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    currentStatus = level.status as ContentLifecycleStatus;
    currentVersion = level.contentVersion;
    code = level.code;
    itemData = level as unknown as Record<string, unknown>;
  } else if (req.entityType === "lesson") {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, req.entityDbId));
    if (!lesson) {
      throw new LifecycleError(
        `Lesson with id ${req.entityDbId} not found`,
        "ENTITY_NOT_FOUND",
        404
      );
    }
    currentStatus = lesson.status as ContentLifecycleStatus;
    currentVersion = lesson.contentVersion;
    code = lesson.code;
    itemData = lesson as unknown as Record<string, unknown>;
  } else {
    throw new LifecycleError(
      `Entity type '${req.entityType}' not supported in transition handler`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

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

  // BR-PUB-05: Check if content is referenced in active published curriculum when archiving
  if (req.toStatus === "archived") {
    await checkContentInUse(req.entityType, req.entityDbId);
  }

  let checklistSnapshot: Record<string, unknown> | undefined;
  if (req.toStatus === "published") {
    checklistSnapshot = await verifyPublishChecklist(req.entityType, itemData);
  }

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
        entityType: req.entityType as "game_level" | "lesson",
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
    const res = validatePublishChecklist(item.entityType, item.payload);
    if (!res.ok) {
      return { ok: false, failedIndex: i, missing: res.missing };
    }
  }
  return { ok: true };
}
