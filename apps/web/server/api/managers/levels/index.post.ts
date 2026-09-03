import { gameLevels, getOwnerDb, managers, writeAudit } from "@mindkid/db";
import { getGameTemplate } from "@mindkid/game-engine";
import { eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";
import { syncContentAssetRefs } from "#server/utils/asset-refs";
import { readPostgresErrorCode } from "#server/utils/pg-error";
import { readRequestBody } from "#server/utils/request-body";

/**
 * BR-SEC-04: mọi route `/api/*` phải Zod validate body.
 * BR-SEC-05: map từng field, ❌ NEVER mass assignment — object mặc định của Zod
 * loại field lạ, nên client gửi thêm `status` hay `created_by_manager_id`
 * không ghi đè được cột nào.
 *
 * `content_pack` và `difficulty_params` cố ý để `unknown` bên trong: hình dạng
 * thật của chúng do `content_contract` / `difficulty_contract` của từng game
 * template quyết định (xem `game-template-contract.md`), không phải route này.
 * Đây là ca dùng `unknown` hợp lệ theo TYPE-SAFETY `BR-TYP-03` — dữ liệu đi
 * tiếp tới một schema khác, không bị đọc trực tiếp ở đây.
 */
const createLevelSchema = z.object({
  template_code: z.string().min(1, "template_code là bắt buộc"),
  code: z.string().min(1, "Mã màn chơi không được rỗng").optional(),
  title: z.string().min(1, "Tiêu đề không được rỗng").optional(),
  instruction: z.string().min(1, "Hướng dẫn không được rỗng").optional(),
  content_pack: z.record(z.string(), z.unknown()).optional(),
  difficulty_params: z.record(z.string(), z.unknown()).optional(),
  theme_id: z.string().min(1, "theme_id không được rỗng").optional(),
  age_min: z.number().int().min(3).max(6).optional(),
  age_max: z.number().int().min(3).max(6).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
  origin: z.enum(["human", "ai_assisted"]).optional(),
});

type CreateLevelInput = z.infer<typeof createLevelSchema>;

function generateLevelCode(
  templateCode: string,
  existingCount: number
): string {
  const tNum = templateCode.replace("GT-00", "").replace("GT-0", "");
  const numStr = String((Math.abs(existingCount) % 9999) + 1).padStart(4, "0");
  return `GL-C${tNum}-STD-LVL-${numStr}`;
}

const DEFAULT_DIFFICULTY_PARAMS = {
  distractor_count: 1,
  hint_after_ms: 10_000,
  allow_retry: true,
  shuffle_items: true,
};

const DEFAULT_CONTENT_PACK = {
  prompt: "Chọn đáp án đúng",
  options: [],
};

function buildInsertValues(
  input: CreateLevelInput,
  levelCode: string,
  templateCode: string,
  templateAgeMin: number,
  templateAgeMax: number,
  managerId?: number
) {
  return {
    entityId: Date.now(),
    code: levelCode,
    contentVersion: 1,
    templateCode,
    title: input.title ?? "Màn chơi mới",
    instruction: input.instruction ?? "Hãy hoàn thành thử thách",
    contentPack: input.content_pack ?? DEFAULT_CONTENT_PACK,
    difficultyParams: input.difficulty_params ?? DEFAULT_DIFFICULTY_PARAMS,
    themeId: input.theme_id ?? "nature",
    ageMin: input.age_min ?? templateAgeMin,
    ageMax: input.age_max ?? templateAgeMax,
    difficulty: input.difficulty ?? 1,
    accessTier: input.access_tier ?? "free",
    status: "draft" as const,
    origin: input.origin ?? "human",
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
  input: CreateLevelInput,
  initialCode: string,
  templateCode: string,
  templateAgeMin: number,
  templateAgeMax: number,
  validManagerId: number | undefined,
  baseCount: number
) {
  let currentCode = initialCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const insertValues = buildInsertValues(
        input,
        currentCode,
        templateCode,
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
      const errCode = readPostgresErrorCode(err);
      if (errCode === "23505" && !input.code && attempt < 4) {
        currentCode = generateLevelCode(templateCode, baseCount + attempt + 1);
        continue;
      }
      throw err;
    }
  }
  return undefined;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const rawBody = await readRequestBody(event);

  const parsed = createLevelSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }
  const input = parsed.data;
  const templateCode = input.template_code;
  const template = getGameTemplate(templateCode);
  if (!template) {
    throw createError({
      statusCode: 422,
      statusMessage: "TEMPLATE_NOT_SUPPORTED",
      message: `Template ${templateCode} is not supported`,
    });
  }
  const db = getOwnerDb();

  const rawLayoutId = input.difficulty_params?.layout_id;
  const requestedLayoutId =
    typeof rawLayoutId === "string" ? rawLayoutId : undefined;
  if (
    requestedLayoutId &&
    !template.layouts.some((layoutId) => layoutId === requestedLayoutId)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "LAYOUT_NOT_SUPPORTED",
      message: `Layout '${requestedLayoutId}' is not supported by template '${templateCode}' (BR-LAY-02)`,
    });
  }

  const { levelCode, count } = await resolveLevelCode(
    db,
    templateCode,
    input.code
  );
  const validManagerId = await resolveValidManagerId(db, manager);

  const newLevel = await insertLevelWithRetry(
    db,
    input,
    levelCode,
    templateCode,
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

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: validManagerId,
      action: "content_created",
      entity_type: "game_level",
      entity_id: newLevel.id.toString(),
      after_data: {
        code: newLevel.code,
        version: newLevel.contentVersion,
        template: templateCode,
      },
    });
  });

  setResponseStatus(event, 201);
  return newLevel;
});
