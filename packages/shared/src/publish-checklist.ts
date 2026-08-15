/**
 * Spec sở hữu: content-lifecycle.md §7.3
 * Rule sở hữu: BR-CLC-09, BR-CLC-11
 */

export type EntityType =
  | "game_level"
  | "lesson"
  | "activity"
  | "curriculum"
  | "worksheet";

export interface PublishChecklistResult {
  ok: boolean;
  missing: string[];
}

export interface GenericEntityPayload {
  accessTier?: string;
  access_tier?: string;
  skillIds?: (number | string)[];
  skills?: unknown[];
  learningObjectiveIds?: (number | string)[];
  learningObjectives?: unknown[];
  ageMin?: number | null;
  age_min?: number | null;
  ageMax?: number | null;
  age_max?: number | null;
  title?: string;
  titleVi?: string;
  title_vi?: string;
  [key: string]: unknown;
}

function checkCounts(entity: GenericEntityPayload, missing: string[]): void {
  const accessTier = entity.accessTier ?? entity.access_tier;
  if (!accessTier) {
    missing.push("access_tier_missing");
  }

  const skillCount =
    (Array.isArray(entity.skillIds) ? entity.skillIds.length : 0) ||
    (Array.isArray(entity.skills) ? entity.skills.length : 0);
  if (skillCount < 1) {
    missing.push("skills_missing");
  }

  const objectiveCount =
    (Array.isArray(entity.learningObjectiveIds)
      ? entity.learningObjectiveIds.length
      : 0) ||
    (Array.isArray(entity.learningObjectives)
      ? entity.learningObjectives.length
      : 0);
  if (objectiveCount < 1) {
    missing.push("learning_objectives_missing");
  }
}

function checkCommonRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  checkCounts(entity, missing);

  const ageMin = entity.ageMin ?? entity.age_min;
  const ageMax = entity.ageMax ?? entity.age_max;
  if (
    typeof ageMin !== "number" ||
    typeof ageMax !== "number" ||
    ageMin > ageMax ||
    ageMin < 3 ||
    ageMax > 6
  ) {
    missing.push("invalid_age_range");
  }

  const title = entity.title ?? entity.titleVi ?? entity.title_vi;
  if (!title || typeof title !== "string" || title.trim() === "") {
    missing.push("title_empty");
  }
}

function checkContentPackDetails(
  contentPack: Record<string, unknown>,
  missing: string[]
): void {
  const hasCorrect =
    contentPack.hasCorrectAnswer === true ||
    (Array.isArray(contentPack.correctAnswers) &&
      contentPack.correctAnswers.length > 0) ||
    (Array.isArray(contentPack.items) &&
      contentPack.items.some(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          ((item as Record<string, unknown>).isCorrect === true ||
            (item as Record<string, unknown>).is_correct === true)
      )) ||
    (Array.isArray(contentPack.options) &&
      contentPack.options.some(
        (opt: unknown) =>
          typeof opt === "object" &&
          opt !== null &&
          ((opt as Record<string, unknown>).isCorrect === true ||
            (opt as Record<string, unknown>).is_correct === true)
      ));

  if (!hasCorrect) {
    missing.push("no_correct_answer");
  }

  if (
    Array.isArray(contentPack.questions) &&
    contentPack.questions.some(
      (q: unknown) =>
        typeof q === "object" &&
        q !== null &&
        !(q as Record<string, unknown>).prompt
    )
  ) {
    missing.push("empty_question_prompt");
  }

  if (
    Array.isArray(contentPack.items) &&
    (contentPack.items.length < 1 || contentPack.items.length > 50)
  ) {
    missing.push("item_count_out_of_bounds");
  }
}

function checkGameLevelRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const contentPack = (entity.contentPack ?? entity.content_pack) as
    | Record<string, unknown>
    | undefined;

  if (!contentPack || typeof contentPack !== "object") {
    missing.push("content_pack_invalid");
  } else {
    checkContentPackDetails(contentPack, missing);
  }

  const difficulty = entity.difficulty;
  if (typeof difficulty !== "number" || difficulty < 1 || difficulty > 5) {
    missing.push("invalid_difficulty");
  }
}

function checkLessonRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const activities = (entity.activities ?? entity.activityIds) as
    | unknown[]
    | undefined;
  if (!Array.isArray(activities) || activities.length < 1) {
    missing.push("activities_missing");
  }

  const est = entity.estimatedMinutes ?? entity.estimated_minutes;
  if (typeof est !== "number" || est < 5 || est > 45) {
    missing.push("invalid_estimated_minutes");
  }

  const guide = entity.guide ?? entity.guide;
  if (!guide || typeof guide !== "string" || guide.trim() === "") {
    missing.push("guide_vi_missing");
  }
}

function checkCurriculumRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const items = (entity.curriculumItems ?? entity.curriculum_items) as
    | { status?: string }[]
    | undefined;
  if (!Array.isArray(items) || items.length < 1) {
    missing.push("curriculum_items_empty");
  } else {
    const hasUnpublished = items.some((it) => it.status !== "published");
    if (hasUnpublished) {
      missing.push("curriculum_item_not_published");
    }
  }

  if (entity.hasEmptyWeek === true) {
    missing.push("empty_week_present");
  }
}

function checkWorksheetRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const pdfPath = entity.pdfPath ?? entity.pdf_path;
  if (!pdfPath || typeof pdfPath !== "string" || pdfPath.trim() === "") {
    missing.push("pdf_render_failed");
  }
}

export function validatePublishChecklist(
  entityType: EntityType,
  entity: GenericEntityPayload
): PublishChecklistResult {
  const missing: string[] = [];

  checkCommonRules(entity, missing);

  if (entityType === "game_level") {
    checkGameLevelRules(entity, missing);
  } else if (entityType === "lesson") {
    checkLessonRules(entity, missing);
  } else if (entityType === "curriculum") {
    checkCurriculumRules(entity, missing);
  } else if (entityType === "worksheet") {
    checkWorksheetRules(entity, missing);
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}
