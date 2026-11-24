import { ValidationError } from "@mindkid/errors/common";
import {
  MECHANIC_TAG_MAP as TAXONOMY_MECHANIC_TAG_MAP,
  normalizeMechanicTagCode as taxonomyNormalizeMechanicTagCode,
} from "@mindkid/taxonomy";
import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import {
  CONTENT_ENTITY_TYPE,
  type ContentEntityType,
  TAG_AXIS,
  TAG_STATUS,
  type TagAxis,
} from "#src/constants/learning-enums";
import { contentTagMap } from "#src/schema/tagging";

export interface SkillMapInput {
  skillId: number;
  weight: number;
}

export interface TagAssignmentInput {
  entityType: ContentEntityType;
  entityId: number;
  tagCodes: string[];
  mechanicTagCode?: string;
}

export const MECHANIC_TAG_MAP: Record<string, string> =
  TAXONOMY_MECHANIC_TAG_MAP;
export const normalizeMechanicTagCode: (code?: string) => string | undefined =
  taxonomyNormalizeMechanicTagCode;

async function resolveAndEnsureTags(db: DbExecutor, tagList: string[]) {
  const matchedTags = await db.query.contentTags.findMany({
    where: {
      code: { in: tagList },
      status: TAG_STATUS.ACTIVE,
    },
  });

  if (matchedTags.length === tagList.length) {
    return matchedTags;
  }

  const matchedSet = new Set(matchedTags.map((t) => t.code));
  const missing = tagList.filter((c) => !matchedSet.has(c));

  throw new ValidationError(
    `Tag không hợp lệ hoặc chưa được duyệt trong từ vựng Lớp 1: ${missing.join(", ")}`
  );
}

function validatePublishAxes(matchedTags: ReadonlyArray<{ axis: TagAxis }>) {
  const axesPresent = new Set(matchedTags.map((t) => t.axis));
  const requiredAxes: readonly [TagAxis, string][] = [
    [TAG_AXIS.WHAT, "what"],
    [TAG_AXIS.THINKING, "thinking"],
    [TAG_AXIS.MECHANIC, "mechanic"],
  ];
  const missingAxes = requiredAxes
    .filter(([axis]) => !axesPresent.has(axis))
    .map(([, label]) => label);
  if (missingAxes.length > 0) {
    throw new ValidationError(
      `Thiếu tag cho trục sư phạm: ${missingAxes.join(", ")}. theme là trục tuỳ chọn.`
    );
  }
}

export async function assignTagsToEntity(
  db: DbExecutor,
  entityType: ContentEntityType,
  entityId: number,
  tagIds: number[]
) {
  await db.transaction(async (tx) => {
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
  });
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
        "Nội dung phải có ít nhất 1 tag cho mỗi trục sư phạm (what, thinking, mechanic)."
      );
    }
    return;
  }

  const matchedTags = await resolveAndEnsureTags(db, tagList);

  if (isPublishing && entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL) {
    validatePublishAxes(matchedTags);
  }

  await assignTagsToEntity(
    db,
    entityType,
    entityId,
    matchedTags.map((tag) => tag.id)
  );
}

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
      `Nội dung phải có đúng 1 kỹ năng chính với weight = 1.0 (hiện có ${primaryCount}).`
    );
  }
}

export async function detectOrphanedContentTags(
  db: DbExecutor
): Promise<number> {
  const rows = await db.query.contentTagMap.findMany({
    columns: { entityType: true },
    with: {
      gameLevel: { columns: { id: true } },
      curriculum: { columns: { id: true } },
    },
  });

  let orphans = 0;
  for (const row of rows) {
    if (
      (row.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL && !row.gameLevel) ||
      (row.entityType === CONTENT_ENTITY_TYPE.CURRICULUM && !row.curriculum)
    ) {
      orphans += 1;
    }
  }
  return orphans;
}

export async function detectOrphanedContentSkillMaps(
  db: DbExecutor
): Promise<number> {
  const rows = await db.query.contentSkillMap.findMany({
    columns: { entityType: true },
    with: {
      gameLevel: { columns: { id: true } },
      curriculum: { columns: { id: true } },
    },
  });

  let orphans = 0;
  for (const row of rows) {
    if (
      (row.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL && !row.gameLevel) ||
      (row.entityType === CONTENT_ENTITY_TYPE.CURRICULUM && !row.curriculum)
    ) {
      orphans += 1;
    }
  }
  return orphans;
}
