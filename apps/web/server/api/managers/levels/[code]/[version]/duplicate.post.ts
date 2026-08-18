import { gameLevels, gameTemplates, getOwnerDb, writeAudit } from "@mindkid/db";
import { and, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../../utils/admin-auth-runtime.js";
import { syncContentAssetRefs } from "../../../../../utils/asset-refs.js";

function generateLevelCode(
  templateCode: string,
  existingCount: number
): string {
  const tNum = templateCode.replace("GT-00", "").replace("GT-0", "");
  const numStr = String((Math.abs(existingCount) % 9999) + 1).padStart(4, "0");
  return `GL-C${tNum}-STD-LVL-${numStr}`;
}

async function createClonedLevel(
  db: ReturnType<typeof getOwnerDb>,
  existing: {
    level: typeof gameLevels.$inferSelect;
    templateCode: string | null;
  },
  managerId: number
) {
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameLevels);
  const count = Number(countRes[0]?.count ?? 0);

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidateCode = generateLevelCode(
      existing.templateCode || "GT-001",
      count + attempt + Math.floor(Math.random() * 1000)
    );

    const [existingWithCode] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(
        and(
          eq(gameLevels.code, candidateCode),
          eq(gameLevels.contentVersion, 1)
        )
      )
      .limit(1);

    if (existingWithCode) {
      continue;
    }

    try {
      const [inserted] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(10_000_000 + Math.random() * 89_000_000),
          code: candidateCode,
          contentVersion: 1,
          templateId: existing.level.templateId,
          title: `Bản sao - ${existing.level.title}`,
          description: existing.level.description,
          instruction: existing.level.instruction,
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
          createdByManagerId: managerId,
        })
        .returning();
      return inserted;
    } catch (err: unknown) {
      const codeErr = (err as { code?: string; cause?: { code?: string } })
        ?.code;
      if (codeErr === "23505") {
        continue;
      }
      throw err;
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: "DUPLICATE_FAILED",
    message: "Failed to generate a unique level code for duplication",
  });
}

export default defineEventHandler(async (event) => {
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

  const cloned = await createClonedLevel(db, existing, manager.id);
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
});
