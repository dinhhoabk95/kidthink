import type { ContentLifecycleStatus, ManagerRole } from "@mindkid/shared";
import { eq, sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { gameLevels } from "#src/schema/game";
import { contentReviewLog } from "#src/schema/ops";
import { playSessions } from "#src/schema/play";
import { contentSkillMap } from "#src/schema/tagging";
import { writeAudit } from "./audit.ts";
import { LifecycleError } from "./content-lifecycle.ts";

export interface CreateVersionResult {
  code: string;
  contentVersion: number;
  id: number;
  status: "draft";
}

export async function createNewVersion(
  entityType: "game_level" | "lesson" | "curriculum",
  code: string,
  actorManagerId: number
): Promise<CreateVersionResult> {
  if (!actorManagerId || typeof actorManagerId !== "number") {
    throw new LifecycleError(
      "BR-CLC-04: Version creation must be authorized by a manager",
      "MACHINE_TRANSITION_FORBIDDEN",
      403
    );
  }

  const db = getOwnerDb();

  if (entityType !== "game_level") {
    throw new LifecycleError(
      `Entity type '${entityType}' not supported in P0.6 versioning`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  // Check if a draft already exists for this code
  const existingDraft = await db
    .select()
    .from(gameLevels)
    .where(
      sql`${gameLevels.code} = ${code} AND ${gameLevels.status} = 'draft'`
    );

  if (existingDraft.length > 0) {
    throw new LifecycleError(
      `VERSION_ALREADY_DRAFTED: Draft version already exists for code '${code}'`,
      "VERSION_CONFLICT",
      409
    );
  }

  // Find latest version number and source version to copy
  const levels = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, code))
    .orderBy(sql`${gameLevels.contentVersion} DESC`);

  if (levels.length === 0) {
    throw new LifecycleError(
      `Entity with code '${code}' not found`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  const firstLevel = levels[0];
  if (!firstLevel) {
    throw new LifecycleError(
      `Entity with code '${code}' not found`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  const maxVersion = firstLevel.contentVersion;
  const sourceLevel =
    levels.find((l) => l.status === "published") ?? firstLevel;
  const nextVersion = maxVersion + 1;

  // Insert new version row copying content from sourceLevel
  const [newLevel] = await db
    .insert(gameLevels)
    .values({
      entityId: sourceLevel.entityId, // Lineage anchor preserved
      code: sourceLevel.code,
      contentVersion: nextVersion,
      templateCode: sourceLevel.templateCode,
      title: sourceLevel.title,
      description: sourceLevel.description,
      instruction: sourceLevel.instruction,
      instructionAudioPath: sourceLevel.instructionAudioPath,
      contentPack: sourceLevel.contentPack,
      difficultyParams: sourceLevel.difficultyParams,
      themeId: sourceLevel.themeId,
      ageMin: sourceLevel.ageMin,
      ageMax: sourceLevel.ageMax,
      difficulty: sourceLevel.difficulty,
      accessTier: sourceLevel.accessTier,
      thumbnailEmoji: sourceLevel.thumbnailEmoji,
      status: "draft",
      origin: sourceLevel.origin,
      authoredIn: sourceLevel.authoredIn,
      createdByManagerId: actorManagerId,
    })
    .returning();

  if (!newLevel) {
    throw new Error("Failed to create version draft");
  }

  // Copy contentSkillMap entries to new version
  const sourceSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      sql`${contentSkillMap.entityType} = ${entityType} AND ${contentSkillMap.entityId} = ${sourceLevel.id}`
    );

  if (sourceSkills.length > 0) {
    await db.insert(contentSkillMap).values(
      sourceSkills.map((s) => ({
        entityType,
        entityId: newLevel.id,
        skillId: s.skillId,
        weight: s.weight,
      }))
    );
  }

  return {
    code: newLevel.code,
    contentVersion: newLevel.contentVersion,
    id: newLevel.id,
    status: "draft",
  };
}

export async function rollbackVersion(
  entityType: "game_level" | "lesson" | "curriculum",
  code: string,
  targetVersion: number,
  actorManagerId: number,
  actorRole: ManagerRole
): Promise<{ status: "published"; contentVersion: number }> {
  // BR-CLC-04: Manager ID required
  if (!actorManagerId || typeof actorManagerId !== "number") {
    throw new LifecycleError(
      "BR-CLC-04: Rollback must be authorized by a manager",
      "MACHINE_TRANSITION_FORBIDDEN",
      403
    );
  }

  // Rollback to archived version permitted for super_admin
  if (actorRole !== "super_admin") {
    throw new LifecycleError(
      "INSUFFICIENT_ROLE: Only super_admin can perform version rollback",
      "INSUFFICIENT_ROLE",
      403
    );
  }

  const db = getOwnerDb();

  if (entityType !== "game_level") {
    throw new LifecycleError(
      `Entity type '${entityType}' not supported in P0.6 rollback`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  const [targetLevel] = await db
    .select()
    .from(gameLevels)
    .where(
      sql`${gameLevels.code} = ${code} AND ${gameLevels.contentVersion} = ${targetVersion}`
    );

  if (!targetLevel) {
    throw new LifecycleError(
      `Version ${targetVersion} for code '${code}' not found`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  if (targetLevel.status === "published") {
    throw new LifecycleError(
      `CANNOT_ROLLBACK_TO_CURRENT: Version ${targetVersion} is already published`,
      "VERSION_CONFLICT",
      409
    );
  }

  // Rollback in transaction: BR-CLC-07 & BR-VER-06
  return await db.transaction(async (tx) => {
    // Archive currently published version
    await tx
      .update(gameLevels)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        sql`${gameLevels.code} = ${code} AND ${gameLevels.status} = 'published'`
      );

    // Set target version to published WITHOUT changing version number (BR-VER-06)
    await tx
      .update(gameLevels)
      .set({
        status: "published",
        publishedAt: new Date(),
        reviewedByManagerId: actorManagerId,
        updatedAt: new Date(),
      })
      .where(eq(gameLevels.id, targetLevel.id));

    // Write review log
    await tx.insert(contentReviewLog).values({
      entityType,
      entityId: targetLevel.id,
      contentVersion: targetLevel.contentVersion, // BR-VER-06: version stays targetVersion
      fromStatus: targetLevel.status as ContentLifecycleStatus,
      toStatus: "published",
      actorManagerId,
      actorRole,
      reason: `Rollback to version ${targetVersion}`,
    });

    // Write audit log
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: actorManagerId,
      action: "content_rolled_back",
      entity_type: entityType,
      entity_id: targetLevel.id.toString(),
      after_data: {
        code,
        rollbackToVersion: targetLevel.contentVersion,
      },
      reason: `Rollback to version ${targetVersion}`,
    });

    return {
      status: "published",
      contentVersion: targetLevel.contentVersion,
    };
  });
}

/**
 * BR-CLC-08: Hard deletion allowed ONLY IF entity was never published AND has no telemetry.
 */
export async function deleteContentEntity(
  entityType: "game_level" | "lesson" | "curriculum",
  id: number
): Promise<{ deleted: boolean }> {
  const db = getOwnerDb();

  if (entityType !== "game_level") {
    throw new LifecycleError(
      `Entity type '${entityType}' not supported for deletion`,
      "ENTITY_NOT_FOUND",
      404
    );
  }

  const [level] = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.id, id));

  if (!level) {
    throw new LifecycleError(`Entity ${id} not found`, "ENTITY_NOT_FOUND", 404);
  }

  // If ever published (publishedAt is set or status is published/archived) -> reject deletion
  if (
    level.publishedAt !== null ||
    level.status === "published" ||
    level.status === "archived"
  ) {
    throw new LifecycleError(
      "BR-CLC-08: Hard deletion forbidden for content that has been published",
      "CONTENT_IN_USE",
      409,
      { reason: "was_published" }
    );
  }

  // Check telemetry / play sessions pointing to this level id
  const sessions = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.gameLevelId, id));

  if (sessions.length > 0) {
    throw new LifecycleError(
      "BR-CLC-08: Hard deletion forbidden for content with recorded telemetry",
      "CONTENT_IN_USE",
      409,
      { telemetryCount: sessions.length }
    );
  }

  await db.delete(gameLevels).where(eq(gameLevels.id, id));
  return { deleted: true };
}
