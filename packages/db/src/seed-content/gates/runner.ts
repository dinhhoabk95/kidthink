/**
 * Spec sở hữu: docs/specs/01-platform/content-seed-authoring.md
 * Rule sở hữu: BR-CSA-02, BR-TAG-01, BR-TAG-02
 */

import { validateActivityModel, validateLessonModel } from "@kidthink/shared";
import type {
  ActivitySeed,
  AnyContentSeed,
  ContentSeed,
  GateIssue,
  GateResult,
  LessonSeed,
} from "../types.js";
import {
  isValidTagForAxis,
  PEDAGOGICAL_AXIS_REQUIREMENT,
} from "../vocabulary.js";
import { scanChildContentSafety } from "./blocklist.js";

const CODE_REGEX = /^GL-(?:\d{4}|C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4})$/;
const ACTIVITY_CODE_REGEX = /^ACT-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;
const LESSON_CODE_REGEX = /^LES-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;
const WHITESPACE_REGEX = /\s+/;

function checkGate0(
  seed: AnyContentSeed,
  existingCodes: Set<string>
): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  let pattern = CODE_REGEX;
  if (seed.kind === "activity") {
    pattern = ACTIVITY_CODE_REGEX;
  } else if (seed.kind === "lesson") {
    pattern = LESSON_CODE_REGEX;
  }

  if (!pattern.test(header.code)) {
    issues.push({
      code: "CODE_FORMAT_INVALID",
      message: `Mã định danh ${header.code} không đúng định dạng.`,
    });
  }

  if (existingCodes.has(header.code)) {
    issues.push({
      code: "CODE_DUPLICATE",
      message: `Mã định danh ${header.code} bị trùng trong batch.`,
    });
  } else {
    existingCodes.add(header.code);
  }

  if (header.content_version < 1) {
    issues.push({
      code: "VERSION_INVALID",
      message: `Phiên bản content_version phải >= 1 (nhận: ${header.content_version}).`,
    });
  }

  return {
    gate: 0,
    name: "Mã định danh",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkActivityGate1(act: ActivitySeed, issues: GateIssue[]): void {
  const validation = validateActivityModel({
    code: act.header.code,
    kind: act.header.activity_kind,
    title_vi: act.header.title_vi,
    instruction: act.header.instruction,
    materials_vi: act.header.materials_vi,
    estimated_minutes: act.header.estimated_minutes,
    skill_codes: act.header.skill_codes,
    learning_objective_codes: act.header.learning_objective_codes,
  });
  if (!validation.ok) {
    for (const err of validation.errors) {
      issues.push({
        code: "ACTIVITY_SCHEMA_ERROR",
        message: err,
      });
    }
  }
}

function checkLessonGate1(les: LessonSeed, issues: GateIssue[]): void {
  const validation = validateLessonModel(
    {
      code: les.header.code,
      title_vi: les.header.title_vi,
      guide: les.header.guide,
      target_age_min: les.header.target_age_min,
      target_age_max: les.header.target_age_max,
      estimated_minutes: les.header.estimated_minutes,
      materials_vi: les.header.materials_vi,
      warm_up_vi: les.header.warm_up_vi,
      reflection_vi: les.header.reflection_vi,
      assessment_vi: les.header.assessment_vi,
      extension_vi: les.header.extension_vi,
      skill_codes: les.header.skill_codes,
      learning_objective_codes: les.header.learning_objective_codes,
      activities: (les.header.activity_codes || []).map((c) => ({
        activity_code: c,
        kind: "discussion",
      })),
    },
    { isSeed: true }
  );
  if (!validation.ok) {
    for (const err of validation.errors) {
      issues.push({
        code: "LESSON_SCHEMA_ERROR",
        message: err,
      });
    }
  }
}

function checkGameLevelGate1(gl: ContentSeed, issues: GateIssue[]): void {
  if (!gl.content_pack || typeof gl.content_pack !== "object") {
    issues.push({
      code: "CONTENT_PACK_MISSING",
      message: "content_pack phải là object hợp lệ.",
    });
  }
  if (!gl.difficulty_params || typeof gl.difficulty_params !== "object") {
    issues.push({
      code: "DIFFICULTY_PARAMS_MISSING",
      message: "difficulty_params phải là object hợp lệ.",
    });
  }
}

function checkGate1(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];

  if (seed.kind === "activity") {
    checkActivityGate1(seed as ActivitySeed, issues);
  } else if (seed.kind === "lesson") {
    checkLessonGate1(seed as LessonSeed, issues);
  } else {
    checkGameLevelGate1(seed as ContentSeed, issues);
  }

  return {
    gate: 1,
    name: "Schema",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkActivityGate2(act: ActivitySeed, issues: GateIssue[]): void {
  if (act.header.estimated_minutes < 2 || act.header.estimated_minutes > 20) {
    issues.push({
      code: "ACTIVITY_DURATION_INVALID",
      message: "Thời lượng hoạt động phải từ 2 đến 20 phút.",
    });
  }
}

function checkLessonGate2(les: LessonSeed, issues: GateIssue[]): void {
  if (
    les.header.target_age_min < 3 ||
    les.header.target_age_max > 6 ||
    les.header.target_age_min > les.header.target_age_max
  ) {
    issues.push({
      code: "AGE_RANGE_INVALID",
      message: "Độ tuổi bài học phải nằm trong phạm vi 3–6 tuổi.",
    });
  }
  if (les.header.estimated_minutes < 5 || les.header.estimated_minutes > 45) {
    issues.push({
      code: "LESSON_DURATION_INVALID",
      message: "Thời lượng bài học phải nằm trong phạm vi 5–45 phút.",
    });
  }
  if (!les.header.activity_codes || les.header.activity_codes.length === 0) {
    issues.push({
      code: "LESSON_ACTIVITIES_EMPTY",
      message: "Bài học phải chứa ít nhất một hoạt động (activity_codes).",
    });
  }
}

function checkGameLevelGate2(gl: ContentSeed, issues: GateIssue[]): void {
  if (
    gl.header.age_min < 3 ||
    gl.header.age_max > 6 ||
    gl.header.age_min > gl.header.age_max
  ) {
    issues.push({
      code: "AGE_RANGE_INVALID",
      message: "Độ tuổi phải nằm trong phạm vi 3–6 tuổi.",
    });
  }
  if (gl.header.difficulty < 1 || gl.header.difficulty > 5) {
    issues.push({
      code: "DIFFICULTY_INVALID",
      message: "Độ khó difficulty phải nằm trong [1, 5].",
    });
  }
  if (
    gl.header.age_max <= 4 &&
    Array.isArray((gl.content_pack as Record<string, unknown>)?.items) &&
    ((gl.content_pack as Record<string, unknown>).items as unknown[]).length > 4
  ) {
    issues.push({
      code: "ITEM_COUNT_AGE_BAND_EXCEEDED",
      message: "Trẻ 3–4 tuổi tối đa 4 items.",
    });
  }
}

function checkGate2(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (!header.title_vi?.trim()) {
    issues.push({
      code: "TITLE_EMPTY",
      message: "Tiêu đề tiếng Việt title_vi không được rỗng.",
    });
  }

  if (seed.kind === "activity") {
    checkActivityGate2(seed as ActivitySeed, issues);
  } else if (seed.kind === "lesson") {
    checkLessonGate2(seed as LessonSeed, issues);
  } else {
    checkGameLevelGate2(seed as ContentSeed, issues);
  }

  return {
    gate: 2,
    name: "Cấu trúc",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate3(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (!header.skill_codes || header.skill_codes.length === 0) {
    issues.push({
      code: "SKILLS_EMPTY",
      message: "Phải gắn ít nhất 1 skill_code.",
    });
  }

  if (
    seed.kind === "activity" &&
    header.skill_codes &&
    header.skill_codes.length > 2
  ) {
    issues.push({
      code: "ACTIVITY_TOO_MANY_SKILLS",
      message: "Hoạt động chỉ được gắn tối đa 2 skill.",
    });
  } else if (
    seed.kind === "lesson" &&
    header.skill_codes &&
    header.skill_codes.length > 3
  ) {
    issues.push({
      code: "LESSON_TOO_MANY_SKILLS",
      message: "Bài học chỉ được gắn tối đa 3 skill.",
    });
  }

  if (
    !header.learning_objective_codes ||
    header.learning_objective_codes.length === 0
  ) {
    issues.push({
      code: "LEARNING_OBJECTIVES_EMPTY",
      message: "Phải gắn ít nhất 1 learning_objective_code.",
    });
  }

  return {
    gate: 3,
    name: "Taxonomy",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate4(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];

  if (seed.kind !== "activity" && seed.kind !== "lesson") {
    const gl = seed as ContentSeed;
    const instruction = gl.header.instruction_vi || "";
    const words = instruction.split(WHITESPACE_REGEX).filter(Boolean);
    if (gl.header.age_min <= 4 && words.length > 12) {
      issues.push({
        code: "INSTRUCTION_TOO_LONG",
        message: `Chỉ dẫn quá dài (${words.length} từ). Tối đa 12 từ.`,
      });
    }
    const lowerInstruction = instruction.toLowerCase();
    if (
      lowerInstruction.includes("không") ||
      lowerInstruction.includes("đừng")
    ) {
      issues.push({
        code: "NEGATIVE_INSTRUCTION_FORBIDDEN",
        message: "Chỉ dẫn không được chứa từ phủ định (không, đừng).",
      });
    }
  }

  return {
    gate: 4,
    name: "Sư phạm",
    kind: "heuristic",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate5(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (
    PEDAGOGICAL_AXIS_REQUIREMENT.what &&
    (!header.what_tags || header.what_tags.length === 0)
  ) {
    issues.push({
      code: "WHAT_TAGS_EMPTY",
      message: "Thiếu tag cho trục nội dung (what_tags).",
    });
  }
  if (
    PEDAGOGICAL_AXIS_REQUIREMENT.thinking &&
    (!header.thinking_tags || header.thinking_tags.length === 0)
  ) {
    issues.push({
      code: "THINKING_TAGS_EMPTY",
      message: "Thiếu tag cho trục tư duy (thinking_tags).",
    });
  }

  for (const tag of header.what_tags || []) {
    if (!isValidTagForAxis("what", tag)) {
      issues.push({
        code: "TAG_NOT_IN_VOCABULARY",
        message: `Tag '${tag}' không nằm trong từ vựng trục 'what'.`,
      });
    }
  }
  for (const tag of header.thinking_tags || []) {
    if (!isValidTagForAxis("thinking", tag)) {
      issues.push({
        code: "TAG_NOT_IN_VOCABULARY",
        message: `Tag '${tag}' không nằm trong từ vựng trục 'thinking'.`,
      });
    }
  }

  return {
    gate: 5,
    name: "Tagging",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate6(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (
    !header.origin ||
    (header.origin !== "human" && header.origin !== "ai_assisted")
  ) {
    issues.push({
      code: "ORIGIN_INVALID",
      message: `origin phải là 'human' hoặc 'ai_assisted' (nhận: ${header.origin}).`,
    });
  }

  return {
    gate: 6,
    name: "Xuất xứ",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate7(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  const validTiers = ["free", "login", "standard", "premium"];
  if (header.access_tier && !validTiers.includes(header.access_tier)) {
    issues.push({
      code: "ACCESS_TIER_INVALID",
      message: `access_tier không hợp lệ (nhận: ${header.access_tier}).`,
    });
  }

  let textToScan = `${header.title_vi || ""}`;
  if (seed.kind === "activity") {
    const act = seed as ActivitySeed;
    textToScan += ` ${JSON.stringify(act.header?.instruction || "")} ${act.header?.materials_vi || ""}`;
  } else if (seed.kind === "lesson") {
    const les = seed as LessonSeed;
    textToScan += ` ${JSON.stringify(les.header?.guide || "")} ${les.header?.materials_vi || ""} ${les.header?.assessment_vi || ""}`;
  } else {
    const gl = seed as ContentSeed;
    textToScan += ` ${gl.header?.instruction_vi || ""} ${JSON.stringify(gl.content_pack || {})} ${JSON.stringify(gl.difficulty_params || {})}`;
  }

  const safetyViolations = scanChildContentSafety(textToScan);
  if (safetyViolations.length > 0) {
    issues.push({
      code: "CHILD_SAFETY_BLOCKLIST_MATCH",
      message: `Từ cấm an toàn trẻ em: ${safetyViolations.join(", ")}`,
    });
  }

  return {
    gate: 7,
    name: "An toàn trẻ em & Phân quyền",
    kind: "heuristic",
    passed: issues.length === 0,
    issues,
  };
}

export function runEightGates(
  seed: AnyContentSeed,
  existingCodes: Set<string> = new Set()
): GateResult[] {
  return [
    checkGate0(seed, existingCodes),
    checkGate1(seed),
    checkGate2(seed),
    checkGate3(seed),
    checkGate4(seed),
    checkGate5(seed),
    checkGate6(seed),
    checkGate7(seed),
  ];
}
