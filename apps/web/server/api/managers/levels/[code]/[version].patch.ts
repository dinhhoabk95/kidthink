import { writeAudit } from "@mindkid/audit";
import { gameLevels, getOwnerDb } from "@mindkid/db";
import { validateContentPack } from "@mindkid/game-engine";
import type { AccessTier } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { syncContentAssetRefs } from "#server/utils/asset-refs";

function buildLevelUpdates(
  body: Record<string, unknown>
): Partial<typeof gameLevels.$inferInsert> {
  const updates: Partial<typeof gameLevels.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) {
    updates.title = body.title as string;
  }
  if (body.description !== undefined) {
    updates.description = body.description as string;
  }
  if (body.instruction !== undefined) {
    updates.instruction = body.instruction as string;
  }
  if (body.content_pack !== undefined) {
    updates.contentPack = body.content_pack;
  }
  if (body.difficulty_params !== undefined) {
    updates.difficultyParams = body.difficulty_params;
  }
  if (body.theme_id !== undefined) {
    updates.themeId = body.theme_id as string;
  }
  if (body.age_min !== undefined) {
    updates.ageMin = body.age_min as number;
  }
  if (body.age_max !== undefined) {
    updates.ageMax = body.age_max as number;
  }
  if (body.difficulty !== undefined) {
    updates.difficulty = body.difficulty as number;
  }
  if (body.access_tier !== undefined) {
    updates.accessTier = body.access_tier as AccessTier;
  }
  if (body.thumbnail_emoji !== undefined) {
    updates.thumbnailEmoji = body.thumbnail_emoji as string;
  }

  return updates;
}

import { z } from "zod";

const patchLevelSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  instruction: z.string().optional(),
  content_pack: z.record(z.unknown()).optional(),
  difficulty_params: z.record(z.unknown()).optional(),
  theme_id: z.string().optional(),
  age_min: z.number().int().min(3).max(6).optional(),
  age_max: z.number().int().min(3).max(6).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  access_tier: z.enum(["free", "standard", "premium", "login"]).optional(),
  thumbnail_emoji: z.string().optional(),
  expected_version: z.number().int().positive().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const version = Number(versionParam);
  const rawBody = (await readBody(event).catch(() => ({}))) || {};

  const body = patchLevelSchema.parse(rawBody);

  const db = getOwnerDb();

  const [existing] = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.code, code), eq(gameLevels.contentVersion, version))
    );

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "LEVEL_NOT_FOUND",
      message: `Level ${code} v${version} not found`,
    });
  }

  if (
    body.expected_version !== undefined &&
    body.expected_version !== existing.contentVersion
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Version conflict: expected v${body.expected_version}, but current is v${existing.contentVersion}`,
    });
  }

  if (existing.status === "published") {
    throw createError({
      statusCode: 409,
      statusMessage: "CONTENT_IMMUTABLE",
      message:
        "Cannot modify published level directly. Create a new version instead.",
    });
  }

  if (body.content_pack && existing.templateCode) {
    const valResult = validateContentPack(
      existing.templateCode,
      body.content_pack
    );
    if (!valResult.success) {
      throw createError({
        statusCode: 422,
        statusMessage: "CONTENT_PACK_INVALID",
        message: "Content pack schema validation failed",
        data: valResult.error,
      });
    }
  }

  const updates = buildLevelUpdates(body);
  const [updated] = await db
    .update(gameLevels)
    .set(updates)
    .where(eq(gameLevels.id, existing.id))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 500,
      statusMessage: "LEVEL_UPDATE_FAILED",
      message: "Cập nhật màn chơi thất bại",
    });
  }

  await syncContentAssetRefs(db, "game_level", updated.id, updated.contentPack);

  const managerId = manager.manager_id;
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      entity_type: "game_level",
      entity_id: updated.id.toString(),
      before_data: {
        code: existing.code,
        version: existing.contentVersion,
        status: existing.status,
      },
      after_data: {
        title: updated.title,
        status: updated.status,
      },
    });
  });

  return updated;
});
