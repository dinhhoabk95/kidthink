import { gameLevels, gameTemplates, getOwnerDb, writeAudit } from "@mindkid/db";
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
  const parsedBody = await readBody(event).catch(() => ({}));
  const fallbackBody = (event as Record<string, unknown>)._body as
    | Record<string, unknown>
    | undefined;
  const rawBody =
    (parsedBody && Object.keys(parsedBody).length > 0
      ? parsedBody
      : fallbackBody) || {};

  const body = patchLevelSchema.parse(rawBody);

  const db = getOwnerDb();

  const [existing] = await db
    .select({ level: gameLevels, templateCode: gameTemplates.code })
    .from(gameLevels)
    .leftJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id))
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
    body.expected_version !== existing.level.contentVersion
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Version conflict: expected v${body.expected_version}, but current is v${existing.level.contentVersion}`,
    });
  }

  if (existing.level.status === "published") {
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
    .where(eq(gameLevels.id, existing.level.id))
    .returning();

  await syncContentAssetRefs(db, "game_level", updated.id, updated.contentPack);

  const managerId = manager.manager_id || manager.id || 1;
  await writeAudit(db, {
    actor_type: "manager",
    actor_id: managerId,
    action: "game_level_updated",
    entity_type: "game_level",
    entity_id: updated.id.toString(),
    before_data: {
      title: existing.level.title,
      version: existing.level.contentVersion,
    },
    after_data: {
      title: updated.title,
      version: updated.contentVersion,
    },
  });

  return updated;
});
