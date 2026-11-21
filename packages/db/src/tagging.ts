import { ValidationError } from "@mindkid/errors/common";
import {
  MECHANIC_TAG_MAP as TAXONOMY_MECHANIC_TAG_MAP,
  normalizeMechanicTagCode as taxonomyNormalizeMechanicTagCode,
} from "@mindkid/taxonomy";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import { curricula } from "#src/schema/curriculum";
import { gameLevels } from "#src/schema/game";
import {
  contentSkillMap,
  contentTagMap,
  contentTags,
} from "#src/schema/tagging";

export interface SkillMapInput {
  skillId: number;
  weight: number;
}

export interface TagAssignmentInput {
  entityType: "game_level" | "curriculum";
  entityId: number;
  tagCodes: string[];
  mechanicTagCode?: string;
}

/**
 * BR-TAG-01: Reject tag codes outside active content_tags vocabulary with 422 UNPROCESSABLE_ENTITY.
 * BR-TAG-02: Require >= 1 tag on each pedagogical axis (what, thinking, mechanic) before publication. (theme exempt - D-HB).
 */
export const MECHANIC_TAG_MAP: Record<string, string> =
  TAXONOMY_MECHANIC_TAG_MAP;
export const normalizeMechanicTagCode: (code?: string) => string | undefined =
  taxonomyNormalizeMechanicTagCode;

async function resolveAndEnsureTags(db: DbExecutor, tagList: string[]) {
  const matchedTags = await db
    .select()
    .from(contentTags)
    .where(
      and(inArray(contentTags.code, tagList), eq(contentTags.status, "active"))
    );

  if (matchedTags.length === tagList.length) {
    return matchedTags;
  }

  const matchedSet = new Set(matchedTags.map((t) => t.code));
  const missing = tagList.filter((c) => !matchedSet.has(c));

  throw new ValidationError(
    `Tag không hợp lệ hoặc chưa được duyệt trong từ vựng Lớp 1: ${missing.join(", ")}`
  );
}

function validatePublishAxes(matchedTags: Array<{ axis: string }>) {
  const axesPresent = new Set(matchedTags.map((t) => t.axis));
  const requiredAxes: Array<"what" | "thinking" | "mechanic"> = [
    "what",
    "thinking",
    "mechanic",
  ];
  const missingAxes = requiredAxes.filter((axis) => !axesPresent.has(axis));
  if (missingAxes.length > 0) {
    throw new ValidationError(
      `Thiếu tag cho trục sư phạm: ${missingAxes.join(", ")}. theme là trục tuỳ chọn.`
    );
  }
}

export async function assignTagsToEntity(
  db: DbExecutor,
  entityType: TagAssignmentInput["entityType"],
  entityId: number,
  tagIds: number[]
) {
  const runAssign = async (tx: DbExecutor) => {
    await tx
      .delete(contentTagMap)
      .where(
        and(
          eq(contentTagMap.entityType, entityType),
          eq(contentTagMap.entityId, entityId)
        )
      );

    const newEntries = tagIds.map((tagId) => ({
      entityType,
      entityId,
      tagId,
    }));

    if (newEntries.length > 0) {
      await tx.insert(contentTagMap).values(newEntries);
    }
  };

  if (typeof db.transaction === "function") {
    await db.transaction(async (tx) => {
      await runAssign(tx);
    });
  } else {
    await runAssign(db);
  }
}

export async function validateAndAssignTags(
  db: DbExecutor,
  input: TagAssignmentInput,
  isPublishing = false
) {
  const { entityType, entityId, tagCodes, mechanicTagCode } = input;

  const normalizedMechanic = normalizeMechanicTagCode(mechanicTagCode);
  const allCodes = new Set(tagCodes);
  if (normalizedMechanic) {
    allCodes.add(normalizedMechanic);
  }

  const tagList = Array.from(allCodes);
  if (tagList.length === 0) {
    if (isPublishing) {
      throw new ValidationError(
        "Nội dung phải có ít nhất 1 tag cho mỗi trục sư phạm (what, thinking, mechanic);."
      );
    }
    return;
  }

  const matchedTags = await resolveAndEnsureTags(db, tagList);

  if (isPublishing && entityType === "game_level") {
    validatePublishAxes(matchedTags);
  }

  await assignTagsToEntity(
    db,
    entityType,
    entityId,
    matchedTags.map((tag) => tag.id)
  );
}

/**
 * BR-TAG-03 & BR-TAG-04: Validate content_skill_map entries.
 * Weight in (0, 1]. Exactly ONE primary skill entry with weight = 1.0.
 */
export function validateContentSkillMap(entries: SkillMapInput[]) {
  if (entries.length === 0) {
    throw new ValidationError("Nội dung phải liên kết với ít nhất 1 kỹ năng.");
  }

  let primaryCount = 0;
  for (const entry of entries) {
    if (entry.weight <= 0 || entry.weight > 1) {
      throw new ValidationError(
        `Trọng số skill_id ${entry.skillId} phải nằm trong (0, 1].`
      );
    }
    if (Math.abs(entry.weight - 1.0) < 0.001) {
      primaryCount++;
    }
  }

  if (primaryCount !== 1) {
    throw new ValidationError(
      `Nội dung phải có đúng 1 kỹ năng chính với weight = 1.0 (hiện có ${primaryCount});.`
    );
  }
}

/**
 * BR-TAG-07 & BR-DM-04: Phát hiện hàng mồ côi trong `content_tag_map` trên cả
 * hai nhánh đa hình (`game_level` và `curriculum`) thuần bằng Drizzle query builder.
 */
export async function detectOrphanedContentTags(
  db: DbExecutor
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentTagMap)
    .leftJoin(
      gameLevels,
      and(
        eq(contentTagMap.entityType, "game_level"),
        eq(contentTagMap.entityId, gameLevels.id)
      )
    )
    .leftJoin(
      curricula,
      and(
        eq(contentTagMap.entityType, "curriculum"),
        eq(contentTagMap.entityId, curricula.id)
      )
    )
    .where(
      or(
        and(eq(contentTagMap.entityType, "game_level"), isNull(gameLevels.id)),
        and(eq(contentTagMap.entityType, "curriculum"), isNull(curricula.id))
      )
    );

  return Number(row?.count ?? 0);
}

/**
 * BR-DM-04: Phát hiện hàng mồ côi trong `content_skill_map` trên cả hai nhánh
 * đa hình (`game_level` và `curriculum`).
 */
export async function detectOrphanedContentSkillMaps(
  db: DbExecutor
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentSkillMap)
    .leftJoin(
      gameLevels,
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, gameLevels.id)
      )
    )
    .leftJoin(
      curricula,
      and(
        eq(contentSkillMap.entityType, "curriculum"),
        eq(contentSkillMap.entityId, curricula.id)
      )
    )
    .where(
      or(
        and(
          eq(contentSkillMap.entityType, "game_level"),
          isNull(gameLevels.id)
        ),
        and(eq(contentSkillMap.entityType, "curriculum"), isNull(curricula.id))
      )
    );

  return Number(row?.count ?? 0);
}
