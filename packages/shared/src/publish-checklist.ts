/**
 * Spec sở hữu: content-lifecycle.md §7.3
 * Rule sở hữu: BR-CLC-09, BR-CLC-11
 */

import { validateActivityModel } from "./activity-model.js";
import {
  type CurriculumItemMetadata,
  type CurriculumValidationInput,
  type CurriculumWeekMetadata,
  type ProgramType,
  validateCurriculumModel,
} from "./curriculum-model.js";
import { validateLessonModel } from "./lesson-model.js";
import {
  validateWorksheetContent,
  WORKSHEET_LAYOUT_TEMPLATES,
} from "./worksheet-model.js";

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
    (Array.isArray(entity.skill_ids)
      ? (entity.skill_ids as unknown[]).length
      : 0) ||
    (Array.isArray(entity.skills) ? entity.skills.length : 0);
  if (skillCount < 1) {
    missing.push("skills_missing");
  }

  const objectiveCount =
    (Array.isArray(entity.learningObjectiveIds)
      ? entity.learningObjectiveIds.length
      : 0) ||
    (Array.isArray(entity.learning_objective_ids)
      ? (entity.learning_objective_ids as unknown[]).length
      : 0) ||
    (Array.isArray(entity.learningObjectives)
      ? entity.learningObjectives.length
      : 0);
  if (objectiveCount < 1) {
    missing.push("learning_objectives_missing");
  }
}

function checkAgeRange(
  entityType: EntityType,
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const ageMin =
    entityType === "activity"
      ? (entity.effectiveAgeMin ??
        entity.effective_age_min ??
        entity.ageMin ??
        entity.age_min)
      : (entity.ageMin ?? entity.age_min);
  const ageMax =
    entityType === "activity"
      ? (entity.effectiveAgeMax ??
        entity.effective_age_max ??
        entity.ageMax ??
        entity.age_max)
      : (entity.ageMax ?? entity.age_max);

  if (
    (entityType === "activity" || entityType === "worksheet") &&
    ageMin === undefined &&
    ageMax === undefined
  ) {
    return;
  }

  if (
    typeof ageMin !== "number" ||
    typeof ageMax !== "number" ||
    ageMin > ageMax ||
    ageMin < 3 ||
    ageMax > 6
  ) {
    missing.push("invalid_age_range");
  }
}

function checkCommonRules(
  entityType: EntityType,
  entity: GenericEntityPayload,
  missing: string[]
): void {
  checkCounts(entity, missing);
  checkAgeRange(entityType, entity, missing);

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

function checkDigitalGameRef(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const refType = entity.refType ?? entity.ref_type;
  const refId = entity.refId ?? entity.ref_id;
  const refStatus = entity.refStatus ?? entity.ref_status;
  if (refType !== "game_level" || !refId) {
    missing.push("digital_game_missing_level_ref");
  } else if (refStatus && refStatus !== "published") {
    missing.push("referenced_game_level_not_published");
  }
}

function validateActivityAgainstModel(
  entity: GenericEntityPayload,
  kind: string,
  instruction: string,
  est: number,
  missing: string[]
): void {
  const res = validateActivityModel({
    kind,
    title_vi: (entity.title ??
      entity.titleVi ??
      entity.title_vi ??
      "") as string,
    instruction,
    materials_vi: (entity.materialsVi ?? entity.materials_vi ?? null) as
      | string
      | null,
    estimated_minutes: est ?? 10,
    skill_codes: (entity.skillCodes ?? entity.skill_codes ?? []) as string[],
    skills: entity.skills as
      | { code: string; age_min: number; age_max: number }[]
      | undefined,
    ref_type: (entity.refType ?? entity.ref_type) as string | null,
    ref_id: (entity.refId ?? entity.ref_id) as number | null,
  });

  if (!res.ok) {
    for (const err of res.errors) {
      missing.push(
        `activity_validation_failed_${err.slice(0, 10).replace(/[^a-z0-9]/gi, "_")}`
      );
    }
  }
}

function checkActivityRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const kind = (entity.kind as string) || "";
  const est = (entity.estimatedMinutes ?? entity.estimated_minutes) as number;
  if (typeof est !== "number" || est < 2 || est > 20) {
    missing.push("invalid_estimated_minutes");
  }

  const instruction =
    entity.instruction ?? entity.instructionVi ?? entity.instruction_vi;
  if (
    !instruction ||
    (typeof instruction === "string" && instruction.trim() === "")
  ) {
    missing.push("instruction_vi_missing");
  }

  if (kind === "digital_game") {
    checkDigitalGameRef(entity, missing);
  }

  validateActivityAgainstModel(
    entity,
    kind,
    typeof instruction === "string" ? instruction : "",
    est,
    missing
  );
}

function extractLessonValidationPayload(entity: GenericEntityPayload) {
  const activities = (entity.activities ?? entity.activityIds) as
    | unknown[]
    | undefined;
  const est = entity.estimatedMinutes ?? entity.estimated_minutes;
  const guide = entity.guide ?? entity.guideVi ?? entity.guide_vi;

  return {
    title_vi: (entity.title ??
      entity.titleVi ??
      entity.title_vi ??
      "") as string,
    guide: guide as string,
    estimated_minutes: typeof est === "number" ? est : 15,
    activities: Array.isArray(activities)
      ? (activities as Record<string, unknown>[])
      : [],
    materials_vi: (entity.materialsVi ?? entity.materials_vi ?? null) as
      | string
      | null,
    warm_up_vi: (entity.warmUpVi ?? entity.warm_up_vi ?? null) as string | null,
    reflection_vi: (entity.reflectionVi ?? entity.reflection_vi ?? null) as
      | string
      | null,
    assessment_vi: (entity.assessmentVi ?? entity.assessment_vi ?? null) as
      | string
      | null,
  };
}

function checkLessonBasicFields(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const activities = entity.activities ?? entity.activityIds;
  if (!Array.isArray(activities) || activities.length < 1) {
    missing.push("activities_missing");
  }

  const est = entity.estimatedMinutes ?? entity.estimated_minutes;
  if (typeof est !== "number" || est < 5 || est > 45) {
    missing.push("invalid_estimated_minutes");
  }

  const guide = entity.guide ?? entity.guideVi ?? entity.guide_vi;
  if (!guide || (typeof guide === "string" && guide.trim() === "")) {
    missing.push("guide_vi_missing");
  }
}

function checkLessonRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  checkLessonBasicFields(entity, missing);

  const payload = extractLessonValidationPayload(entity);
  const res = validateLessonModel(payload);

  if (!res.ok) {
    for (const err of res.errors) {
      missing.push(
        `lesson_validation_failed_${err.slice(0, 10).replace(/[^a-z0-9]/gi, "_")}`
      );
    }
  }
}

function buildCurriculumPayload(
  entity: GenericEntityPayload,
  items: CurriculumItemMetadata[],
  weeks: CurriculumWeekMetadata[]
): CurriculumValidationInput {
  return {
    code: (entity.code as string) || "CUR-001",
    program_type:
      ((entity.programType ?? entity.program_type) as ProgramType) ||
      "age_based",
    duration_weeks: (entity.durationWeeks ??
      entity.duration_weeks ??
      8) as number,
    sessions_per_week: (entity.sessionsPerWeek ??
      entity.sessions_per_week ??
      3) as number,
    target_age_min: (entity.targetAgeMin ?? entity.target_age_min) as
      | number
      | undefined,
    target_age_max: (entity.targetAgeMax ?? entity.target_age_max) as
      | number
      | undefined,
    status: (entity.status as string) || "published",
    items,
    weeks,
    skill_prerequisites_map: entity.skill_prerequisites_map as
      | Record<string, string[]>
      | undefined,
  };
}

function checkCurriculumRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const items = (entity.curriculumItems ??
    entity.curriculum_items ??
    entity.items) as CurriculumItemMetadata[] | undefined;
  const weeks = (entity.curriculumWeeks ??
    entity.curriculum_weeks ??
    entity.weeks) as CurriculumWeekMetadata[] | undefined;

  if (!Array.isArray(items) || items.length < 1) {
    missing.push("curriculum_items_empty");
    return;
  }

  const payload = buildCurriculumPayload(entity, items, weeks || []);
  const res = validateCurriculumModel(payload);
  if (!res.ok) {
    for (const err of res.errors) {
      missing.push(
        `curriculum_validation_failed_${err.slice(0, 15).replace(/[^a-z0-9]/gi, "_")}`
      );
    }
  }
}

function checkPdfBasicEvidence(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const pdfPath = entity.pdfPath ?? entity.pdf_path;
  if (!pdfPath || typeof pdfPath !== "string" || pdfPath.trim() === "") {
    missing.push("pdf_render_failed");
  }

  const pageCount = entity.renderPageCount ?? entity.render_page_count;
  if (typeof pageCount === "number" && pageCount !== 1) {
    missing.push("worksheet_multi_page_forbidden");
  }

  const grayscalePassed =
    entity.renderGrayscalePassed ?? entity.render_grayscale_passed;
  if (grayscalePassed === false) {
    missing.push("worksheet_grayscale_failed");
  }
}

function checkPdfVersionAndHash(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const sourceVersion =
    entity.sourceContentVersion ?? entity.source_content_version;
  const contentVersion =
    entity.contentVersion ?? entity.content_version ?? entity.version;
  if (
    typeof sourceVersion === "number" &&
    typeof contentVersion === "number" &&
    sourceVersion !== contentVersion
  ) {
    missing.push("worksheet_render_version_stale");
  }

  const inputHash = entity.renderInputHash ?? entity.render_input_hash;
  const expectedHash = entity.expectedInputHash ?? entity.expected_input_hash;
  if (expectedHash && inputHash && expectedHash !== inputHash) {
    missing.push("worksheet_render_hash_mismatch");
  }
}

function checkWorksheetTemplateAndGuide(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const layoutTemplate = (entity.layoutTemplate ??
    entity.layout_template) as string;
  if (
    !(
      layoutTemplate &&
      WORKSHEET_LAYOUT_TEMPLATES.includes(
        layoutTemplate as (typeof WORKSHEET_LAYOUT_TEMPLATES)[number]
      )
    )
  ) {
    missing.push("invalid_layout_template");
  }

  const instructionsVi =
    entity.instructionsVi ?? entity.instructions_vi ?? entity.instructions;
  if (
    !instructionsVi ||
    typeof instructionsVi !== "string" ||
    instructionsVi.trim().length < 10
  ) {
    missing.push("adult_guide_footer_missing");
  }
}

function checkWorksheetBlockValidation(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  const contentBlocks = entity.contentBlocks ?? entity.content_blocks;
  if (!contentBlocks) {
    return;
  }

  const layoutTemplate = (entity.layoutTemplate ??
    entity.layout_template) as string;
  const instructionsVi =
    entity.instructionsVi ?? entity.instructions_vi ?? entity.instructions;

  const res = validateWorksheetContent({
    title_vi: (entity.titleVi ??
      entity.title_vi ??
      entity.title ??
      "") as string,
    layout_template: layoutTemplate || "",
    content_blocks: contentBlocks,
    instructions_vi: typeof instructionsVi === "string" ? instructionsVi : "",
    learning_objective_ids: (entity.learningObjectiveIds ??
      entity.learning_objective_ids ?? [1]) as number[],
  });

  if (!res.ok) {
    for (const err of res.errors) {
      missing.push(
        `worksheet_validation_failed_${err.slice(0, 15).replace(/[^a-z0-9]/gi, "_")}`
      );
    }
  }
}

function checkWorksheetRules(
  entity: GenericEntityPayload,
  missing: string[]
): void {
  checkPdfBasicEvidence(entity, missing);
  checkPdfVersionAndHash(entity, missing);
  checkWorksheetTemplateAndGuide(entity, missing);
  checkWorksheetBlockValidation(entity, missing);
}

export function validatePublishChecklist(
  entityType: EntityType,
  entity: GenericEntityPayload
): PublishChecklistResult {
  const missing: string[] = [];

  checkCommonRules(entityType, entity, missing);

  if (entityType === "game_level") {
    checkGameLevelRules(entity, missing);
  } else if (entityType === "activity") {
    checkActivityRules(entity, missing);
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
