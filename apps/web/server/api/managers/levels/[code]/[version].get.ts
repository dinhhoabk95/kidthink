import { gameLevels, getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { and, desc, eq, or } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const NUMERIC_REGEX = /^\d+$/;

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!code) {
    throw new NotFoundError("NOT_FOUND");
  }

  const db = getOwnerDb();
  const version = Number(versionParam);

  const query = db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      contentVersion: gameLevels.contentVersion,
      templateCode: gameLevels.templateCode,
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
    .from(gameLevels);

  const isNumeric = NUMERIC_REGEX.test(code);
  const codeFilter = isNumeric
    ? or(
        eq(gameLevels.code, code),
        eq(gameLevels.id, Number(code)),
        eq(gameLevels.entityId, Number(code))
      )
    : eq(gameLevels.code, code);

  const rows =
    Number.isInteger(version) && version > 0
      ? await query
          .where(and(codeFilter, eq(gameLevels.contentVersion, version)))
          .limit(1)
      : await query
          .where(codeFilter)
          .orderBy(desc(gameLevels.contentVersion))
          .limit(1);

  if (!rows || rows.length === 0) {
    throw new GameLevelNotFoundError();
  }

  return rows[0];
});
