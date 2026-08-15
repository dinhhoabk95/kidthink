import { AppError } from "@kidthink/auth";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contentTagMap, contentTags } from "../schema/tagging.js";

export interface SkillMapInput {
  skillId: number;
  weight: number;
}

export interface TagAssignmentInput {
  entityType: "game_level" | "lesson" | "worksheet" | "activity";
  entityId: number;
  tagCodes: string[];
  mechanicTagCode?: string;
}

/**
 * BR-TAG-01: Reject tag codes outside active content_tags vocabulary with 422 UNPROCESSABLE_ENTITY.
 * BR-TAG-02: Require >= 1 tag on each pedagogical axis (what, thinking, mechanic) before publication. (theme exempt - D-HB).
 */
const MECHANIC_TAG_MAP: Record<string, string> = {
  "tap-select": "tap_select",
  "tap-select-multi": "tap_select",
  "drag-to-container": "drag_drop",
  "sort-groups": "matching",
  "pair-match": "matching",
  "sequence-order": "sequence_order",
  match: "matching",
  tap: "tap_select",
  drag: "drag_drop",
};

export function normalizeMechanicTagCode(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }
  return MECHANIC_TAG_MAP[code] || code.replace(/-/g, "_");
}

async function resolveAndEnsureTags(
  db: NodePgDatabase<Record<string, unknown>>,
  tagList: string[],
  entityType: string
) {
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

  if (entityType === "activity" || entityType === "lesson") {
    for (const code of missing) {
      const [inserted] = await db
        .insert(contentTags)
        .values({
          code,
          axis: "what",
          labelVi: code,
          status: "active",
        })
        .onConflictDoNothing()
        .returning();
      if (inserted) {
        matchedTags.push(inserted);
      }
    }
    return matchedTags;
  }

  throw new AppError(
    "VALIDATION_FAILED",
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
    throw new AppError(
      "VALIDATION_FAILED",
      `Thiếu tag cho trục sư phạm: ${missingAxes.join(", ")}. theme là trục tuỳ chọn.`
    );
  }
}

export async function validateAndAssignTags(
  db: NodePgDatabase<Record<string, unknown>>,
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
      throw new AppError(
        "VALIDATION_FAILED",
        "Nội dung phải có ít nhất 1 tag cho mỗi trục sư phạm (what, thinking, mechanic)."
      );
    }
    return;
  }

  const matchedTags = await resolveAndEnsureTags(db, tagList, entityType);

  if (isPublishing && entityType === "game_level") {
    validatePublishAxes(matchedTags);
  }

  await db
    .delete(contentTagMap)
    .where(
      and(
        eq(contentTagMap.entityType, entityType),
        eq(contentTagMap.entityId, entityId)
      )
    );

  const newEntries = matchedTags.map((tag) => ({
    entityType,
    entityId,
    tagId: tag.id,
  }));

  if (newEntries.length > 0) {
    await db.insert(contentTagMap).values(newEntries);
  }
}

/**
 * BR-TAG-03 & BR-TAG-04: Validate content_skill_map entries.
 * Weight in (0, 1]. Exactly ONE primary skill entry with weight = 1.0.
 */
export function validateContentSkillMap(entries: SkillMapInput[]) {
  if (entries.length === 0) {
    throw new AppError(
      "VALIDATION_FAILED",
      "Nội dung phải liên kết với ít nhất 1 kỹ năng."
    );
  }

  let primaryCount = 0;
  for (const entry of entries) {
    if (entry.weight <= 0 || entry.weight > 1) {
      throw new AppError(
        "VALIDATION_FAILED",
        `Trọng số skill_id ${entry.skillId} phải nằm trong (0, 1].`
      );
    }
    if (Math.abs(entry.weight - 1.0) < 0.001) {
      primaryCount++;
    }
  }

  if (primaryCount !== 1) {
    throw new AppError(
      "VALIDATION_FAILED",
      `Nội dung phải có đúng 1 kỹ năng chính với weight = 1.0 (hiện có ${primaryCount}).`
    );
  }
}

/**
 * BR-TAG-07: Detect orphaned content_tag_map entries where referenced entity does not exist.
 */
export async function detectOrphanedContentTags(
  db: NodePgDatabase<Record<string, unknown>>
) {
  const result = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM content_tag_map ctm
    LEFT JOIN game_levels gl ON ctm.entity_type = 'game_level' AND ctm.entity_id = gl.id
    WHERE ctm.entity_type = 'game_level' AND gl.id IS NULL
  `);

  return Number(result[0]?.count ?? 0);
}
