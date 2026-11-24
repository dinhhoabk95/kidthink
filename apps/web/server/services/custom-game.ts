/**
 * Spec sở hữu: docs/specs/07-addon/custom-game-builder.md
 * Business rules: BR-CGB-01..10, BR-GLM-01..10
 */

import { writeAudit } from "@mindkid/audit";
import {
  CHILD_STATUS,
  CUSTOM_GAME_STATUS,
  CUSTOM_GAME_STATUS_CODEC,
  type CustomGameEntity,
  type DbExecutor,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { QuotaExceededError } from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import {
  ServiceUnavailableError,
  ValidationError,
} from "@mindkid/errors/common";
import { VersionConflictError } from "@mindkid/errors/content";
import { CustomGameNotFoundError } from "@mindkid/errors/game-level";
import { getGameTemplate } from "@mindkid/game-engine/registry";
import {
  type ModerationIssue,
  moderateCustomGameMetadata,
  moderateText,
} from "@mindkid/moderation";
import {
  type CreateCustomGameInput,
  type CustomGameValidationResult,
  type UpdateCustomGameInput,
  validateCustomGameContent,
} from "@mindkid/shared";
import { assertChildDailyPlayQuota } from "#server/utils/game-config-runtime";
import { useRepositories } from "#server/utils/repositories";

export const DEFAULT_CUSTOM_GAMES_SAVED_QUOTA = 10;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
type JsonRecord = Record<string, JsonValue>;

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "customGames" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

/**
 * Checks the user's custom game saved quota (BR-CGB-08).
 */
export async function checkCustomGamesQuota(
  userId: number,
  quotaLimit?: number
): Promise<number>;
export async function checkCustomGamesQuota(
  dbOrRepos: DbExecutor | MindKidRepositories,
  userId: number,
  quotaLimit?: number
): Promise<number>;
export async function checkCustomGamesQuota(
  first: DbExecutor | MindKidRepositories | number,
  second?: number,
  third?: number
): Promise<number> {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useRepositories();
  const userId = isLegacyCall ? (second as number) : first;
  const quotaLimit = isLegacyCall
    ? (third ?? DEFAULT_CUSTOM_GAMES_SAVED_QUOTA)
    : (second ?? DEFAULT_CUSTOM_GAMES_SAVED_QUOTA);

  const currentCount = await repos.customGames.countByUser(userId);
  if (currentCount >= quotaLimit) {
    throw new QuotaExceededError({
      quota_key: "custom_games_saved",
      limit: quotaLimit,
      current: currentCount,
      message: `Bạn đã đạt giới hạn tối đa ${quotaLimit} trò chơi tùy chỉnh đã lưu.`,
    });
  }

  return currentCount;
}

const CONTENT_PACK_ALLOW_NEGATIVE_KEYS = new Set([
  "title",
  "label",
  "label_vi",
  "cue_label_vi",
  "bridge_badge_vi",
]);

const CONTENT_PACK_STRICT_KEYS = new Set([
  "prompt",
  "instruction",
  "hint",
  "text",
  "target_criterion",
]);

const CONTENT_PACK_STRING_ARRAY_KEYS = new Set(["items", "options", "hints"]);

function collectContentPackModerationIssues(
  value: JsonValue | undefined,
  keyName: string,
  issues: ModerationIssue[]
): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string") {
    if (CONTENT_PACK_ALLOW_NEGATIVE_KEYS.has(keyName)) {
      const res = moderateText(value, { allowNegativeAssertions: true });
      issues.push(...res.issues);
    } else if (CONTENT_PACK_STRICT_KEYS.has(keyName)) {
      const res = moderateText(value, { allowNegativeAssertions: false });
      issues.push(...res.issues);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (
        typeof item === "string" &&
        CONTENT_PACK_STRING_ARRAY_KEYS.has(keyName)
      ) {
        const res = moderateText(item, {
          allowNegativeAssertions: keyName !== "hints",
        });
        issues.push(...res.issues);
      } else {
        collectContentPackModerationIssues(item, keyName, issues);
      }
    }
    return;
  }
  if (typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      collectContentPackModerationIssues(childValue, childKey, issues);
    }
  }
}

function assertMetadataModerationPassed(
  title: string | undefined,
  instruction: string | undefined,
  status: "draft" | "ready" | undefined,
  contentPack?: JsonRecord
): void {
  const modResult = moderateCustomGameMetadata(title || "", instruction || "");
  const allIssues: ModerationIssue[] = [...modResult.issues];
  if (contentPack) {
    collectContentPackModerationIssues(contentPack, "", allIssues);
  }

  const isDraft = (status || "draft") === "draft";
  const blockingIssues = isDraft
    ? allIssues.filter(
        (i) => i.category !== "negative_assertion" && i.severity === "block"
      )
    : allIssues.filter((i) => i.severity === "block");

  if (blockingIssues.length > 0) {
    throw new ValidationError({
      message:
        "Tiêu đề, chỉ dẫn hoặc nội dung trò chơi chứa từ ngữ không phù hợp.",
      issues: blockingIssues.map(
        (i) => `Kiểm duyệt nội dung: ${i.message} (${i.term}).`
      ),
      missing: ["content_moderation_failed"],
    });
  }
}

/**
 * Creates a new custom game for the user (BR-CGB-01, BR-CGB-05, BR-CGB-08).
 */
export async function createCustomGame(
  userId: number,
  input: CreateCustomGameInput
): Promise<CustomGameEntity> {
  const repos = useRepositories();

  // Moderate metadata and content_pack even in draft (profane/unsafe UGC is never persisted in drafts)
  assertMetadataModerationPassed(
    input.title,
    input.instruction,
    input.status,
    input.content_pack as JsonRecord
  );

  if (input.status === "ready") {
    const valResult = validateCustomGameContent(
      {
        template_code: input.template_code,
        title: input.title,
        instruction: input.instruction,
        content_pack: input.content_pack as JsonRecord,
        difficulty_params: (input.difficulty_params as JsonRecord) || {},
        theme_id: input.theme_id,
        age_min: input.age_min,
        age_max: input.age_max,
        skill_ids: input.skill_ids,
      },
      getGameTemplate
    );

    if (!valResult.ok) {
      throw new ValidationError({
        message: "Không thể đánh dấu sẵn sàng: dữ liệu trò chơi chưa hợp lệ.",
        issues: valResult.issues,
        missing: valResult.missing,
      });
    }
  }

  return await repos.customGames.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await checkCustomGamesQuota(txRepos, userId);

    const row = await txRepos.customGames
      .create({
        userId,
        templateId: input.template_code,
        title: input.title,
        instruction: input.instruction,
        contentPack: input.content_pack as JsonRecord,
        difficultyParams: (input.difficulty_params || {}) as JsonRecord,
        themeId: input.theme_id || "farm",
        ageMin: input.age_min || 3,
        ageMax: input.age_max || 6,
        skillIds: input.skill_ids || null,
        status: CUSTOM_GAME_STATUS_CODEC.toCode(input.status || "draft"),
      })
      .catch(() => {
        throw new ServiceUnavailableError("Không thể tạo trò chơi tùy chỉnh.");
      });

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "content_created",
      entity_type: "custom_game",
      entity_id: row.uuid,
      after_data: {
        uuid: row.uuid,
        template_id: row.templateId,
        status: CUSTOM_GAME_STATUS_CODEC.toLabel(row.status),
      },
    });

    return row;
  });
}

/**
 * Retrieves a custom game by UUID with strict ownership check (BR-CGB-01, BR-ERR-05).
 */
export async function getCustomGameByUuid(
  userId: number,
  uuid: string
): Promise<CustomGameEntity> {
  const repos = useRepositories();
  const game = await repos.customGames.findByUuidForUser(uuid, userId);
  if (!game) {
    throw new CustomGameNotFoundError(uuid);
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
  items: CustomGameEntity[];
  total: number;
  quota: { limit: number; current: number };
}> {
  const repos = useRepositories();
  const [items, current] = await Promise.all([
    repos.customGames.listForUser(userId, {
      status: filters?.status
        ? CUSTOM_GAME_STATUS_CODEC.toCode(filters.status)
        : undefined,
      templateId: filters?.template_id,
    }),
    repos.customGames.countByUser(userId),
  ]);

  return {
    items,
    total: items.length,
    quota: {
      limit: DEFAULT_CUSTOM_GAMES_SAVED_QUOTA,
      current,
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
): Promise<CustomGameEntity> {
  const repos = useRepositories();
  const existing = await getCustomGameByUuid(userId, uuid);

  if (
    input.expected_version !== undefined &&
    input.expected_version !== existing.version
  ) {
    throw new VersionConflictError(
      "Trò chơi đã được cập nhật bởi một phiên làm việc khác. Vui lòng tải lại trang."
    );
  }

  const nextStatusLabel =
    input.status ?? CUSTOM_GAME_STATUS_CODEC.toLabel(existing.status);
  const merged = {
    template_code: existing.templateId,
    title: input.title ?? existing.title,
    instruction: input.instruction ?? existing.instruction,
    content_pack:
      (input.content_pack as JsonRecord) ??
      (existing.contentPack as JsonRecord),
    difficulty_params:
      (input.difficulty_params as JsonRecord) ??
      (existing.difficultyParams as JsonRecord),
    theme_id: input.theme_id ?? existing.themeId,
    age_min: input.age_min ?? existing.ageMin,
    age_max: input.age_max ?? existing.ageMax,
    skill_ids: input.skill_ids ?? existing.skillIds,
    status: nextStatusLabel,
  };

  assertMetadataModerationPassed(
    merged.title,
    merged.instruction,
    nextStatusLabel,
    merged.content_pack
  );

  if (merged.status === "ready") {
    const valResult = validateCustomGameContent(merged, getGameTemplate);
    if (!valResult.ok) {
      throw new ValidationError({
        message: "Không thể lưu ở trạng thái sẵn sàng: dữ liệu chưa hợp lệ.",
        issues: valResult.issues,
        missing: valResult.missing,
      });
    }
  }

  return await repos.customGames.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const updated = await txRepos.customGames.updateVersioned(
      existing.id,
      userId,
      existing.version,
      {
        title: merged.title,
        instruction: merged.instruction,
        contentPack: merged.content_pack,
        difficultyParams: merged.difficulty_params,
        themeId: merged.theme_id,
        ageMin: merged.age_min,
        ageMax: merged.age_max,
        skillIds: merged.skill_ids,
        status: CUSTOM_GAME_STATUS_CODEC.toCode(merged.status),
      }
    );

    if (!updated) {
      throw new VersionConflictError(
        "Trò chơi đã được cập nhật bởi một phiên làm việc khác. Vui lòng tải lại trang."
      );
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action:
        merged.status === "ready" ? "content_submitted" : "content_created",
      entity_type: "custom_game",
      entity_id: existing.uuid,
      after_data: {
        uuid: updated.uuid,
        status: CUSTOM_GAME_STATUS_CODEC.toLabel(updated.status),
        version: updated.version,
      },
    });

    return updated;
  });
}

/**
 * Deletes a custom game and frees up quota (BR-CGB-01, BR-CGB-08).
 */
export async function deleteCustomGame(
  userId: number,
  uuid: string
): Promise<{ deleted: boolean; uuid: string }> {
  const repos = useRepositories();
  const existing = await getCustomGameByUuid(userId, uuid);

  await repos.customGames.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.customGames.deleteForUser(existing.id, userId);

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
      content_pack: game.contentPack as JsonRecord,
      difficulty_params: game.difficultyParams as JsonRecord,
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
  const repos = useRepositories();

  const [child, game] = await Promise.all([
    repos.childProfiles.findByUuidForUser(childUuid, userId),
    getCustomGameByUuid(userId, gameUuid),
  ]);

  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(childUuid);
  }

  if (game.status !== CUSTOM_GAME_STATUS.READY) {
    throw new ValidationError(
      "Trò chơi này đang ở trạng thái bản nháp (draft), chưa sẵn sàng để chơi."
    );
  }

  const template = getGameTemplate(game.templateId);
  if (template?.kind !== "teach") {
    await assertChildDailyPlayQuota(repos, child);
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
