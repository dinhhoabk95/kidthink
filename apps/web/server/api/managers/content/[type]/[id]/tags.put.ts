import { writeAudit } from "@mindkid/audit";
import {
  activities,
  contentSkillMap,
  contentTags,
  gameLevels,
  getOwnerDb,
  lessons,
  type OwnerDb,
  type SkillMapInput,
  skills,
  userTags,
  validateAndAssignTags,
  validateContentSkillMap,
} from "@mindkid/db";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { ContentImmutableError } from "@mindkid/errors/content";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { and, eq, inArray } from "drizzle-orm";
import { getRouterParam } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";
import { defineApiRoute } from "#server/utils/define-api-route";

type TaggableEntityType = "game_level" | "lesson" | "activity";

const putTagsParamsSchema = z.object({
  type: z.enum(["game_level", "lesson", "activity"]),
  id: z.coerce.number().int().positive(),
});

const putTagsBodySchema = z.object({
  tags: z.array(z.string().min(1)).min(1),
  skills: z
    .array(
      z.object({
        skill_code: z.string().min(1),
        weight: z.number(),
      })
    )
    .optional(),
  origin: z.enum(["human", "ai_suggested"]).optional(),
  confirmed_by_manager: z.boolean().optional(),
});

interface TargetEntityInfo {
  id: number;
  status: string;
  templateCode: string | null;
}

async function findTargetEntity(
  db: OwnerDb,
  type: TaggableEntityType,
  id: number
): Promise<TargetEntityInfo> {
  if (type === "game_level") {
    const [row] = await db
      .select({
        id: gameLevels.id,
        status: gameLevels.status,
        templateCode: gameLevels.templateCode,
      })
      .from(gameLevels)
      .where(eq(gameLevels.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundError("Không tìm thấy màn chơi.");
    }
    return row;
  }

  if (type === "lesson") {
    const [row] = await db
      .select({ id: lessons.id, status: lessons.status })
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundError("Không tìm thấy bài học.");
    }
    return { ...row, templateCode: null };
  }

  const [row] = await db
    .select({ id: activities.id, status: activities.status })
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);
  if (!row) {
    throw new NotFoundError("Không tìm thấy hoạt động.");
  }
  return { ...row, templateCode: null };
}

async function assertClosedVocabularyTags(
  db: OwnerDb,
  tagCodes: string[]
): Promise<void> {
  const uniqueCodes = Array.from(new Set(tagCodes));
  const [matchedSystemTags, matchedUserTags] = await Promise.all([
    db
      .select({ code: contentTags.code })
      .from(contentTags)
      .where(
        and(
          inArray(contentTags.code, uniqueCodes),
          eq(contentTags.status, "active")
        )
      ),
    db
      .select({ label: userTags.label })
      .from(userTags)
      .where(inArray(userTags.label, uniqueCodes)),
  ]);

  const activeSet = new Set(matchedSystemTags.map((t) => t.code));
  const missing = uniqueCodes.filter((code) => !activeSet.has(code));
  if (missing.length === 0) {
    return;
  }

  if (matchedUserTags.length > 0) {
    throw new ValidationError(
      `BR-TAG-05: Tag tự do của User không được đưa vào catalog công khai: ${missing.join(", ")}`
    );
  }

  throw new ValidationError(
    `BR-TAG-01: Tag không hợp lệ hoặc chưa được duyệt trong từ vựng Lớp 1: ${missing.join(", ")}`
  );
}

async function resolveSkillEntries(
  db: OwnerDb,
  skillInputs: Array<{ skill_code: string; weight: number }>
): Promise<SkillMapInput[]> {
  const codes = Array.from(new Set(skillInputs.map((s) => s.skill_code)));
  const rows =
    codes.length > 0
      ? await db
          .select({ id: skills.id, code: skills.code })
          .from(skills)
          .where(inArray(skills.code, codes))
      : [];
  const skillByCode = new Map(rows.map((r) => [r.code, r.id]));

  const entries: SkillMapInput[] = [];
  for (const item of skillInputs) {
    const skillId = skillByCode.get(item.skill_code);
    if (!skillId) {
      throw new ValidationError(
        `Kỹ năng '${item.skill_code}' không tồn tại trong hệ thống.`
      );
    }
    entries.push({ skillId, weight: item.weight });
  }

  validateContentSkillMap(entries);
  return entries;
}

export default defineApiRoute({
  auth: "manager",
  body: putTagsBodySchema,
  handler: async ({ event, auth: manager, body }) => {
    const rawType = getRouterParam(event, "type");
    const rawId = getRouterParam(event, "id");

    if (rawType === "curriculum") {
      throw new ValidationError(
        "BR-TAG-06: Không được gắn thẻ trực tiếp lên curriculum; thẻ của curriculum được suy ra từ nội dung con."
      );
    }

    const parsedParams = putTagsParamsSchema.safeParse({
      type: rawType,
      id: rawId,
    });
    if (!parsedParams.success) {
      throwValidationError(parsedParams.error);
    }
    const { type: entityType, id: entityId } = parsedParams.data;

    if (body.origin === "ai_suggested" && body.confirmed_by_manager !== true) {
      throw new ValidationError(
        "BR-TAG-06: AI chỉ đề xuất tag, bắt buộc có người xác nhận trước khi gắn."
      );
    }

    const db = getOwnerDb();
    const target = await findTargetEntity(db, entityType, entityId);

    if (target.status === "published") {
      throw new ContentImmutableError(
        "Không thể sửa thẻ của nội dung đã phát hành."
      );
    }

    await assertClosedVocabularyTags(db, body.tags);

    const skillEntries = body.skills
      ? await resolveSkillEntries(db, body.skills)
      : null;

    const mechanicTagCode = target.templateCode
      ? ALL_TEMPLATES[target.templateCode]?.mechanic
      : undefined;

    await db.transaction(async (tx) => {
      await validateAndAssignTags(
        tx,
        {
          entityType,
          entityId: target.id,
          tagCodes: body.tags,
          mechanicTagCode,
        },
        false
      );

      if (skillEntries) {
        await tx
          .delete(contentSkillMap)
          .where(
            and(
              eq(contentSkillMap.entityType, entityType),
              eq(contentSkillMap.entityId, target.id)
            )
          );
        await tx.insert(contentSkillMap).values(
          skillEntries.map((entry) => ({
            entityType,
            entityId: target.id,
            skillId: entry.skillId,
            weight: entry.weight.toString(),
          }))
        );
      }

      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.manager_id,
        action: "content_created",
        entity_type: entityType,
        entity_id: String(target.id),
        before_data: { status: target.status },
        after_data: {
          tags: body.tags,
          skills: body.skills ?? [],
        },
      });
    });

    return {
      ok: true,
      entity_type: entityType,
      entity_id: target.id,
      tags: body.tags,
    };
  },
});
