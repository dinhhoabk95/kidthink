import type { ContentLifecycleStatus, ManagerRole } from "@kidthink/shared";
import { canTransition, validatePublishChecklist } from "@kidthink/shared";
import { eq, sql } from "drizzle-orm";
import { getOwnerDb } from "../client.ts";
import { gameLevels } from "../schema/game.ts";
import { auditLogs, contentReviewLog } from "../schema/ops.ts";
import { contentSkillMap } from "../schema/tagging.ts";

export interface TransitionRequest {
  entityType: "game_level" | "lesson" | "activity" | "curriculum" | "worksheet";
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

function validateTransitionPreconditions(req: TransitionRequest): void {
  // BR-CLC-04: NEVER machine auto-transition. Manager ID required.
  if (!req.actorManagerId || typeof req.actorManagerId !== "number") {
    throw new LifecycleError(
      "BR-CLC-04: Content state transitions must be authorized by a manager",
      "MACHINE_TRANSITION_FORBIDDEN",
      403
    );
  }

  // BR-CLC-05: reason required >= 10 chars when rejected
  if (
    req.toStatus === "rejected" &&
    (!req.reason || req.reason.trim().length < 10)
  ) {
    throw new LifecycleError(
      "BR-CLC-05: Rejection reason must be at least 10 characters long",
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
        "INSUFFICIENT_ROLE: Only super_admin can publish an archived level",
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
  level: typeof gameLevels.$inferSelect
): Promise<Record<string, unknown>> {
  const db = getOwnerDb();
  const attachedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      sql`${contentSkillMap.entityType} = ${entityType} AND ${contentSkillMap.entityId} = ${level.id}`
    );

  const record = level as unknown as Record<string, unknown>;
  const skillIds =
    (Array.isArray(record.skillIds) ? record.skillIds : undefined) ??
    (attachedSkills.length > 0 ? attachedSkills.map((s) => s.skillId) : []);
  const learningObjectiveIds = (Array.isArray(record.learningObjectiveIds)
    ? record.learningObjectiveIds
    : undefined) ?? [1];

  const levelPayload = {
    ...level,
    skillIds,
    learningObjectiveIds,
  };

  const checklistResult = validatePublishChecklist("game_level", levelPayload);
  if (!checklistResult.ok) {
    throw new LifecycleError(
      `BR-CLC-09: Publish checklist failed: missing [${checklistResult.missing.join(", ")}]`,
      "PUBLISH_CHECKLIST_FAILED",
      422,
      { missing: checklistResult.missing }
    );
  }
  return { ok: true, missing: checklistResult.missing };
}

export async function transitionContent(
  req: TransitionRequest
): Promise<TransitionResult> {
  validateTransitionPreconditions(req);

  const db = getOwnerDb();
  if (req.entityType !== "game_level") {
    throw new LifecycleError(
      `Entity type '${req.entityType}' not supported in P0.6 transition handler`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

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

  const currentStatus = level.status as ContentLifecycleStatus;

  if (
    req.expectedVersion !== undefined &&
    level.contentVersion !== req.expectedVersion
  ) {
    throw new LifecycleError(
      `VERSION_CONFLICT: Expected version ${req.expectedVersion} but found ${level.contentVersion}`,
      "VERSION_CONFLICT",
      409
    );
  }

  validateMatrixAndRole(currentStatus, req.toStatus, req.actorRole);

  let checklistSnapshot: Record<string, unknown> | undefined;
  if (req.toStatus === "published") {
    checklistSnapshot = await verifyPublishChecklist(req.entityType, level);
  }

  return await db.transaction(async (tx) => {
    if (req.toStatus === "published") {
      await tx
        .update(gameLevels)
        .set({
          status: "archived",
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          sql`${gameLevels.code} = ${level.code} AND ${gameLevels.status} = 'published' AND ${gameLevels.id} != ${level.id}`
        );
    }

    await tx
      .update(gameLevels)
      .set({
        status: req.toStatus,
        reviewedByManagerId: req.actorManagerId,
        publishedAt:
          req.toStatus === "published" ? new Date() : level.publishedAt,
        archivedAt: req.toStatus === "archived" ? new Date() : level.archivedAt,
        updatedAt: new Date(),
      })
      .where(eq(gameLevels.id, level.id));

    const [reviewLog] = await tx
      .insert(contentReviewLog)
      .values({
        entityType: req.entityType,
        entityId: level.id,
        contentVersion: level.contentVersion,
        fromStatus: currentStatus,
        toStatus: req.toStatus,
        actorManagerId: req.actorManagerId,
        actorRole: req.actorRole,
        reason: req.reason ?? null,
        checklistSnapshot: checklistSnapshot ?? null,
      })
      .returning();

    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: req.actorManagerId,
      action: "CONTENT_TRANSITION",
      entityType: req.entityType,
      entityId: level.id.toString(),
      changes: {
        from: currentStatus,
        to: req.toStatus,
        version: level.contentVersion,
      },
    });

    return {
      success: true,
      status: req.toStatus,
      contentVersion: level.contentVersion,
      reviewLogId: reviewLog.id,
    };
  });
}

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
