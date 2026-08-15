import {
  gameLevels,
  gameTemplates,
  getOwnerDb,
  writeAudit,
} from "@kidthink/db";
import { and, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../../utils/admin-auth-runtime.js";
import { syncContentAssetRefs } from "../../../../../utils/asset-refs.js";

function generateLevelCode(
  templateCode: string,
  existingCount: number
): string {
  const tNum = templateCode.replace("GT-00", "").replace("GT-0", "");
  const numStr = String(existingCount + 1).padStart(4, "0");
  return `GL-C${tNum}-STD-LVL-${numStr}`;
}

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    const code = getRouterParam(event, "code");
    const versionParam = getRouterParam(event, "version");

    if (!(code && versionParam)) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const version = Number(versionParam);
    const db = getOwnerDb();

    const [existing] = await db
      .select({
        level: gameLevels,
        templateCode: gameTemplates.code,
      })
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

    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameLevels);
    const count = Number(countRes[0]?.count ?? 0);

    const newCode = generateLevelCode(existing.templateCode || "GT-001", count);

    const [cloned] = await db
      .insert(gameLevels)
      .values({
        entityId: Date.now(),
        code: newCode,
        contentVersion: 1,
        templateId: existing.level.templateId,
        titleVi: `Bản sao - ${existing.level.titleVi}`,
        descriptionVi: existing.level.descriptionVi,
        instructionVi: existing.level.instructionVi,
        contentPack: existing.level.contentPack,
        difficultyParams: existing.level.difficultyParams,
        themeId: existing.level.themeId,
        ageMin: existing.level.ageMin,
        ageMax: existing.level.ageMax,
        difficulty: existing.level.difficulty,
        accessTier: existing.level.accessTier,
        thumbnailEmoji: existing.level.thumbnailEmoji,
        status: "draft",
        origin: "human",
        authoredIn: "studio",
        createdByManagerId: manager.id,
      })
      .returning();

    await syncContentAssetRefs(db, "game_level", cloned.id, cloned.contentPack);

    const managerId = manager.manager_id || manager.id || 1;

    await writeAudit(db, {
      actor_type: "manager",
      actor_id: managerId,
      action: "game_level_duplicated",
      entity_type: "game_level",
      entity_id: cloned.id.toString(),
      after_data: {
        source_code: code,
        source_version: version,
        new_code: cloned.code,
        new_version: 1,
      },
    });

    event.node.res.statusCode = 201;
    return cloned;
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
