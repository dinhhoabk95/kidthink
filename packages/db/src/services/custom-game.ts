/**
 * Spec sở hữu: docs/specs/07-addon/custom-game-builder.md
 * Business rules: BR-CGB-01..10, BR-GLM-01..10
 */

import { appError } from "@mindkid/auth";
import { getGameTemplate } from "@mindkid/game-engine";
import {
  type CreateCustomGameInput,
  type CustomGameValidationResult,
  type UpdateCustomGameInput,
  validateCustomGameContent,
} from "@mindkid/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "#src/client";
import { childProfiles } from "#src/schema/child";
import { type CustomGame, customGames } from "#src/schema/custom-game";
import { writeAudit } from "./audit.ts";

export const DEFAULT_CUSTOM_GAMES_SAVED_QUOTA = 10;

/**
 * Checks the user's custom game saved quota (BR-CGB-08).
 */
export async function checkCustomGamesQuota(
  db: ReturnType<typeof getDb>,
  userId: number,
  quotaLimit = DEFAULT_CUSTOM_GAMES_SAVED_QUOTA
): Promise<number> {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customGames)
    .where(eq(customGames.userId, userId));

  const currentCount = countResult?.count ?? 0;
  if (currentCount >= quotaLimit) {
    throw appError("QUOTA_EXCEEDED", {
      quota_key: "custom_games_saved",
      limit: quotaLimit,
      current: currentCount,
      message: `Bạn đã đạt giới hạn tối đa ${quotaLimit} trò chơi tùy chỉnh đã lưu.`,
    });
  }

  return currentCount;
}

/**
 * Creates a new custom game for the user (BR-CGB-01, BR-CGB-05, BR-CGB-08).
 */
export async function createCustomGame(
  userId: number,
  input: CreateCustomGameInput
): Promise<CustomGame> {
  const db = getDb();

  // 1. Quota check (BR-CGB-08)
  await checkCustomGamesQuota(db, userId);

  // 2. If status is 'ready', enforce validation before saving (BR-CGB-05)
  if (input.status === "ready") {
    const valResult = validateCustomGameContent(
      {
        template_code: input.template_code,
        title: input.title,
        instruction: input.instruction,
        content_pack: input.content_pack as Record<string, unknown>,
        difficulty_params:
          (input.difficulty_params as Record<string, unknown>) || {},
        theme_id: input.theme_id,
        age_min: input.age_min,
        age_max: input.age_max,
        skill_ids: input.skill_ids,
      },
      getGameTemplate
    );

    if (!valResult.ok) {
      throw appError("VALIDATION_FAILED", {
        message: "Không thể đánh dấu sẵn sàng: dữ liệu trò chơi chưa hợp lệ.",
        issues: valResult.issues,
        missing: valResult.missing,
      });
    }
  }

  // 3. Insert record & audit in transaction
  const inserted = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customGames)
      .values({
        userId,
        templateId: input.template_code,
        title: input.title,
        instruction: input.instruction,
        contentPack: input.content_pack,
        difficultyParams: input.difficulty_params || {},
        themeId: input.theme_id || "farm",
        ageMin: input.age_min || 3,
        ageMax: input.age_max || 6,
        skillIds: input.skill_ids || null,
        status: input.status || "draft",
        version: 1,
      })
      .returning();

    if (!row) {
      throw appError(
        "SERVICE_UNAVAILABLE",
        "Không thể tạo trò chơi tùy chỉnh."
      );
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_created",
      entity_type: "custom_game",
      entity_id: row.uuid,
      after_data: {
        uuid: row.uuid,
        template_id: row.templateId,
        status: row.status,
      },
    });

    return row;
  });

  return inserted;
}

/**
 * Retrieves a custom game by UUID with strict ownership check (BR-CGB-01, BR-ERR-05).
 */
export async function getCustomGameByUuid(
  userId: number,
  uuid: string
): Promise<CustomGame> {
  const db = getDb();
  const [game] = await db
    .select()
    .from(customGames)
    .where(and(eq(customGames.uuid, uuid), eq(customGames.userId, userId)));

  if (!game) {
    throw appError("NOT_FOUND", "Không tìm thấy trò chơi tùy chỉnh.");
  }

  return game;
}

/**
 * Lists custom games created by the user (BR-CGB-01, BR-CGB-02 - no public catalog).
 */
export async function listCustomGames(
  userId: number,
  filters?: { status?: "draft" | "ready"; template_id?: string }
): Promise<{
  items: CustomGame[];
  total: number;
  quota: { limit: number; current: number };
}> {
  const db = getDb();
  const conditions = [eq(customGames.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(customGames.status, filters.status));
  }
  if (filters?.template_id) {
    conditions.push(eq(customGames.templateId, filters.template_id));
  }

  const items = await db
    .select()
    .from(customGames)
    .where(and(...conditions))
    .orderBy(desc(customGames.createdAt));

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customGames)
    .where(eq(customGames.userId, userId));

  return {
    items,
    total: items.length,
    quota: {
      limit: DEFAULT_CUSTOM_GAMES_SAVED_QUOTA,
      current: countResult?.count ?? 0,
    },
  };
}

/**
 * Updates a custom game with optimistic locking and validation before ready (BR-CGB-05).
 */
export async function updateCustomGame(
  userId: number,
  uuid: string,
  input: UpdateCustomGameInput
): Promise<CustomGame> {
  const db = getDb();
  const existing = await getCustomGameByUuid(userId, uuid);

  // Optimistic concurrency check
  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw appError(
      "VERSION_CONFLICT",
      "Trò chơi đã được cập nhật bởi một phiên làm việc khác. Vui lòng tải lại trang."
    );
  }

  const merged = {
    template_code: existing.templateId,
    title: input.title ?? existing.title,
    instruction: input.instruction ?? existing.instruction,
    content_pack:
      (input.content_pack as Record<string, unknown>) ??
      (existing.contentPack as Record<string, unknown>),
    difficulty_params:
      (input.difficulty_params as Record<string, unknown>) ??
      (existing.difficultyParams as Record<string, unknown>),
    theme_id: input.theme_id ?? existing.themeId,
    age_min: input.age_min ?? existing.ageMin,
    age_max: input.age_max ?? existing.ageMax,
    skill_ids: input.skill_ids ?? existing.skillIds,
    status: input.status ?? existing.status,
  };

  // If status is ready, enforce validation
  if (merged.status === "ready") {
    const valResult = validateCustomGameContent(merged, getGameTemplate);
    if (!valResult.ok) {
      throw appError("VALIDATION_FAILED", {
        message: "Không thể lưu ở trạng thái sẵn sàng: dữ liệu chưa hợp lệ.",
        issues: valResult.issues,
        missing: valResult.missing,
      });
    }
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(customGames)
      .set({
        title: merged.title,
        instruction: merged.instruction,
        contentPack: merged.content_pack,
        difficultyParams: merged.difficulty_params,
        themeId: merged.theme_id,
        ageMin: merged.age_min,
        ageMax: merged.age_max,
        skillIds: merged.skill_ids,
        status: merged.status,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(eq(customGames.id, existing.id), eq(customGames.userId, userId))
      )
      .returning();

    if (!row) {
      throw appError(
        "SERVICE_UNAVAILABLE",
        "Không thể cập nhật trò chơi tùy chỉnh."
      );
    }

    return row;
  });

  return updated;
}

/**
 * Deletes a custom game and frees up quota (BR-CGB-01, BR-CGB-08).
 */
export async function deleteCustomGame(
  userId: number,
  uuid: string
): Promise<{ deleted: boolean; uuid: string }> {
  const db = getDb();
  const existing = await getCustomGameByUuid(userId, uuid);

  await db.transaction(async (tx) => {
    await tx
      .delete(customGames)
      .where(
        and(eq(customGames.id, existing.id), eq(customGames.userId, userId))
      );

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_deleted",
      entity_type: "custom_game",
      entity_id: existing.uuid,
      reason: "User deleted custom game",
      before_data: {
        uuid: existing.uuid,
        title: existing.title,
      },
    });
  });

  return { deleted: true, uuid };
}

/**
 * Validates a custom game and returns detailed feedback (BR-CGB-05, §7.1).
 */
export async function validateCustomGameRecord(
  userId: number,
  uuid: string
): Promise<CustomGameValidationResult> {
  const game = await getCustomGameByUuid(userId, uuid);
  return validateCustomGameContent(
    {
      template_code: game.templateId,
      title: game.title,
      instruction: game.instruction,
      content_pack: game.contentPack as Record<string, unknown>,
      difficulty_params: game.difficultyParams as Record<string, unknown>,
      theme_id: game.themeId,
      age_min: game.ageMin,
      age_max: game.ageMax,
      skill_ids: game.skillIds,
    },
    getGameTemplate
  );
}

/**
 * Gets runtime configuration for playing a custom game (BR-CGB-01, BR-CGB-06).
 * Only accessible by the creator for their registered child profiles.
 */
export async function getCustomGamePlayConfig(
  userId: number,
  childUuid: string,
  gameUuid: string
) {
  const db = getDb();

  // 1. Verify child belongs to caller (BR-CGB-01, BR-ERR-05)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!child) {
    throw appError("NOT_FOUND", "Không tìm thấy hồ sơ bé.");
  }

  // 2. Verify custom game belongs to caller (BR-CGB-01)
  const game = await getCustomGameByUuid(userId, gameUuid);

  if (game.status !== "ready") {
    throw appError(
      "VALIDATION_FAILED",
      "Trò chơi này đang ở trạng thái bản nháp (draft), chưa sẵn sàng để chơi."
    );
  }

  return {
    game_type: game.templateId,
    title: game.title,
    instruction: game.instruction,
    content_pack: game.contentPack,
    difficulty_params: game.difficultyParams,
    theme_id: game.themeId,
    age_min: game.ageMin,
    age_max: game.ageMax,
    source_kind: "custom_game",
    source_ref_uuid: game.uuid,
    child_uuid: child.uuid,
    skill_ids: game.skillIds || [],
  };
}
