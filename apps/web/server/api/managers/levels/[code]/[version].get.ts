import { gameLevels, gameTemplates, getOwnerDb } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!code) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();
  const version = Number(versionParam);

  const query = db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      contentVersion: gameLevels.contentVersion,
      templateId: gameLevels.templateId,
      templateCode: gameTemplates.code,
      title: gameLevels.title,
      description: gameLevels.description,
      instruction: gameLevels.instruction,
      contentPack: gameLevels.contentPack,
      difficultyParams: gameLevels.difficultyParams,
      themeId: gameLevels.themeId,
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
      difficulty: gameLevels.difficulty,
      accessTier: gameLevels.accessTier,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      status: gameLevels.status,
      origin: gameLevels.origin,
      authoredIn: gameLevels.authoredIn,
      publishedAt: gameLevels.publishedAt,
      createdAt: gameLevels.createdAt,
      updatedAt: gameLevels.updatedAt,
    })
    .from(gameLevels)
    .leftJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id));

  const rows =
    Number.isInteger(version) && version > 0
      ? await query
          .where(
            and(
              eq(gameLevels.code, code),
              eq(gameLevels.contentVersion, version)
            )
          )
          .limit(1)
      : await query
          .where(eq(gameLevels.code, code))
          .orderBy(desc(gameLevels.contentVersion))
          .limit(1);

  if (!rows || rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "LEVEL_NOT_FOUND",
      message: `Level ${code} (version ${versionParam || "latest"}) not found`,
    });
  }

  return rows[0];
});
