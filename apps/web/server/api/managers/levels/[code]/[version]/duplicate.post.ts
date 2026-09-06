import { writeAudit } from "@mindkid/audit";
import { gameLevels, getOwnerDb } from "@mindkid/db";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { and, eq, sql } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { syncContentAssetRefs } from "#server/utils/asset-refs";

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
  existing: typeof gameLevels.$inferSelect,
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
          templateCode: existing.templateCode,
          title: `Bản sao - ${existing.title}`,
          description: existing.description,
          instruction: existing.instruction,
          contentPack: existing.contentPack,
          difficultyParams: existing.difficultyParams,
          themeId: existing.themeId,
          ageMin: existing.ageMin,
          ageMax: existing.ageMax,
          difficulty: existing.difficulty,
          accessTier: existing.accessTier,
          thumbnailEmoji: existing.thumbnailEmoji,
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

  throw new InternalError(
    "Failed to generate a unique level code for duplication"
  );
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw new NotFoundError("NOT_FOUND");
  }

  const version = Number(versionParam);
  const db = getOwnerDb();

  const [existing] = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.code, code), eq(gameLevels.contentVersion, version))
    );

  if (!existing) {
    throw new GameLevelNotFoundError(`Level ${code} v${version} not found`);
  }

  const managerId = manager.manager_id;
  const cloned = await createClonedLevel(db, existing, managerId);
  if (!cloned) {
    throw new InternalError("Nhân bản màn chơi thất bại");
  }
  await syncContentAssetRefs(db, "game_level", cloned.id, cloned.contentPack);

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      entity_type: "game_level",
      entity_id: cloned.id.toString(),
      after_data: {
        source_code: code,
        source_version: version,
        new_code: cloned.code,
        new_version: 1,
      },
    });
  });

  setResponseStatus(event, 201);
  return cloned;
});
