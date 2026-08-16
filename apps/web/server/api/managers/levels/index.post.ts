import {
  type DatabaseOwner,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  managers,
  writeAudit,
} from "@kidthink/db";
import { getGameTemplate } from "@kidthink/game-engine";
import type { AccessTier, ContentOrigin } from "@kidthink/shared";
import { eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";
import { syncContentAssetRefs } from "../../../utils/asset-refs.js";

function generateLevelCode(
  templateCode: string,
  existingCount: number
): string {
  const tNum = templateCode.replace("GT-00", "").replace("GT-0", "");
  const numStr = String((Math.abs(existingCount) % 9999) + 1).padStart(4, "0");
  return `GL-C${tNum}-STD-LVL-${numStr}`;
}

async function ensureDbTemplate(db: DatabaseOwner, templateCode: string) {
  const template = getGameTemplate(templateCode);
  if (!template) {
    throw createError({
      statusCode: 422,
      statusMessage: "TEMPLATE_NOT_SUPPORTED",
      message: `Template ${templateCode} is not supported`,
    });
  }

  let [dbTemplate] = await db
    .select()
    .from(gameTemplates)
    .where(eq(gameTemplates.code, templateCode));

  if (!dbTemplate) {
    await db
      .insert(gameTemplates)
      .values({
        code: template.code,
        nameVi: template.name,
        mechanic: template.mechanic,
        layouts: template.layouts,
        ageMin: template.age_min,
        ageMax: template.age_max,
      })
      .onConflictDoNothing();

    const [found] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode));
    dbTemplate = found;
  }

  return { template, dbTemplate };
}

function buildInsertValues(
  body: Record<string, unknown>,
  levelCode: string,
  templateId: number,
  templateAgeMin: number,
  templateAgeMax: number,
  managerId?: number
) {
  const defaultDifficulty = {
    distractor_count: 1,
    hint_after_ms: 10_000,
    allow_retry: true,
    shuffle_items: true,
  };

  return {
    entityId: Date.now(),
    code: levelCode,
    contentVersion: 1,
    templateId,
    titleVi: (body.title as string) || "Màn chơi mới",
    instructionVi: (body.instruction as string) || "Hãy hoàn thành thử thách",
    contentPack: body.content_pack || {
      prompt: "Chọn đáp án đúng",
      options: [],
    },
    difficultyParams: body.difficulty_params || defaultDifficulty,
    themeId: (body.theme_id as string) || "nature",
    ageMin: (body.age_min as number) || templateAgeMin,
    ageMax: (body.age_max as number) || templateAgeMax,
    difficulty: (body.difficulty as number) || 1,
    accessTier: ((body.access_tier as string) || "free") as AccessTier,
    status: "draft" as const,
    origin: ((body.origin as string) || "human") as ContentOrigin,
    authoredIn: "studio" as const,
    createdByManagerId: managerId,
  };
}

async function resolveLevelCode(
  db: ReturnType<typeof getOwnerDb>,
  templateCode: string,
  providedCode?: string
): Promise<{ levelCode: string; count: number }> {
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameLevels);
  const count = Number(countRes[0]?.count ?? 0);

  if (providedCode) {
    return { levelCode: providedCode, count };
  }

  let offset = 0;
  while (true) {
    const candidate = generateLevelCode(templateCode, count + offset);
    const [existing] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(eq(gameLevels.code, candidate))
      .limit(1);
    if (!existing) {
      return { levelCode: candidate, count };
    }
    offset++;
  }
}

async function resolveValidManagerId(
  db: ReturnType<typeof getOwnerDb>,
  manager: { manager_id?: number; id?: number }
): Promise<number | undefined> {
  const rawManagerId = manager.manager_id || manager.id;
  if (!rawManagerId) {
    return undefined;
  }
  const [exists] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.id, rawManagerId));
  return exists?.id;
}

async function insertLevelWithRetry(
  db: ReturnType<typeof getOwnerDb>,
  body: Record<string, unknown>,
  initialCode: string,
  templateCode: string,
  templateId: number,
  templateAgeMin: number,
  templateAgeMax: number,
  validManagerId: number | undefined,
  baseCount: number
) {
  let currentCode = initialCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const insertValues = buildInsertValues(
        body,
        currentCode,
        templateId,
        templateAgeMin,
        templateAgeMax,
        validManagerId
      );
      const [created] = await db
        .insert(gameLevels)
        .values(insertValues)
        .returning();
      return created;
    } catch (err: unknown) {
      const errCode =
        (err as { code?: string })?.code ||
        (err as { cause?: { code?: string } })?.cause?.code;
      if (errCode === "23505" && !body.code && attempt < 4) {
        currentCode = generateLevelCode(templateCode, baseCount + attempt + 1);
        continue;
      }
      throw err;
    }
  }
  return undefined;
}

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);
    const parsedBody = await readBody(event).catch(() => ({}));
    const fallbackBody = (event as Record<string, unknown>)._body as
      | Record<string, unknown>
      | undefined;
    const body =
      (parsedBody && Object.keys(parsedBody).length > 0
        ? parsedBody
        : fallbackBody) || {};

    const templateCode = body.template_code as string | undefined;
    if (!templateCode) {
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        message: "template_code is required",
      });
    }

    const db = getOwnerDb();
    const { template, dbTemplate } = await ensureDbTemplate(db, templateCode);
    const { levelCode, count } = await resolveLevelCode(
      db,
      templateCode,
      body.code as string | undefined
    );
    const validManagerId = await resolveValidManagerId(db, manager);

    const newLevel = await insertLevelWithRetry(
      db,
      body,
      levelCode,
      templateCode,
      dbTemplate.id,
      template.age_min,
      template.age_max,
      validManagerId,
      count
    );

    if (!newLevel) {
      throw createError({
        statusCode: 500,
        statusMessage: "LEVEL_CREATE_FAILED",
      });
    }

    await syncContentAssetRefs(
      db,
      "game_level",
      newLevel.id,
      newLevel.contentPack
    );

    await writeAudit(db, {
      actor_type: "manager",
      actor_id: validManagerId || 1,
      action: "game_level_created",
      entity_type: "game_level",
      entity_id: newLevel.id.toString(),
      after_data: {
        code: newLevel.code,
        version: newLevel.contentVersion,
        template: templateCode,
      },
    });

    event.node.res.statusCode = 201;
    return newLevel;
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
