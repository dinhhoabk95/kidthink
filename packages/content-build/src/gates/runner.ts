/**
 * Spec sở hữu: docs/specs/01-platform/content-seed-authoring.md
 * Rule sở hữu: BR-CSA-02, BR-TAG-01, BR-TAG-02
 */

import type { SkillDataset } from "@mindkid/shared";
import {
  isValidLegacyV1Ref,
  validateActivityModel,
  validateLessonModel,
} from "@mindkid/shared";
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
import { isLevelOutOfBand } from "./engine-content-depth.js";
import { checkGateItemOrigin } from "./gate-08-item-origin.js";
import { checkGateConceptPresent } from "./gate-09-concept-present.js";
import { checkGateMontessori } from "./montessori-gate.js";

const CODE_REGEX =
  /^(?:GL-(?:\d{4}|C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4})|C[1-6]\.[A-Z]{2,5}\.\d{2}-GT-\d{3}-\d)$/;
const ACTIVITY_CODE_REGEX = /^ACT-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;
const LESSON_CODE_REGEX = /^LES-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;

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
    title: act.header.title,
    instruction: act.header.instruction,
    materials: act.header.materials,
    estimated_minutes: act.header.estimated_minutes,
    skill_codes: act.header.skill_codes,
    learning_objective_codes: act.header.learning_objective_codes,
    ref_type: act.header.ref_type,
    ref_id: act.header.ref_id,
    ref_code: act.header.ref_code,
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
      title: les.header.title,
      guide: les.header.guide,
      target_age_min: les.header.target_age_min,
      target_age_max: les.header.target_age_max,
      estimated_minutes: les.header.estimated_minutes,
      materials: les.header.materials,
      warm_up: les.header.warm_up,
      reflection: les.header.reflection,
      assessment: les.header.assessment,
      extension: les.header.extension,
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

import { ALL_TEMPLATES, type GameTemplate } from "@mindkid/game-engine";

function parseContractIssues(
  prefix: string,
  errorIssues: Array<{ path: Array<string | number>; message: string }>,
  targetIssues: GateIssue[],
  errorCode: string
): void {
  for (const issue of errorIssues) {
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    targetIssues.push({
      code: errorCode,
      message: `${prefix}.${fieldPath}: ${issue.message}`,
    });
  }
}

export function checkGameLevelGate1(
  gl: ContentSeed,
  issues: GateIssue[],
  registry: Record<string, GameTemplate> = ALL_TEMPLATES
): void {
  if (!gl.content_pack || typeof gl.content_pack !== "object") {
    issues.push({
      code: "CONTENT_PACK_MISSING",
      message: "content_pack phải là object hợp lệ.",
    });
    return;
  }
  if (!gl.difficulty_params || typeof gl.difficulty_params !== "object") {
    issues.push({
      code: "DIFFICULTY_PARAMS_MISSING",
      message: "difficulty_params phải là object hợp lệ.",
    });
    return;
  }

  const templateCode = gl.header?.template_code;
  const tmpl = templateCode ? registry?.[templateCode] : undefined;
  if (!tmpl) {
    issues.push({
      code: "TEMPLATE_CODE_UNKNOWN",
      message: `Mã template '${templateCode || "(empty)"}' không tồn tại trong template registry.`,
    });
    return;
  }

  if (!(tmpl.content_contract && tmpl.difficulty_contract)) {
    issues.push({
      code: "TEMPLATE_CONTRACT_MISSING",
      message: `Template '${templateCode}' thiếu content_contract hoặc difficulty_contract.`,
    });
    return;
  }

  const contentParsed = tmpl.content_contract.safeParse(gl.content_pack);
  if (!contentParsed.success) {
    parseContractIssues(
      "content_pack",
      contentParsed.error.issues,
      issues,
      "CONTENT_PACK_SCHEMA_INVALID"
    );
  }

  const diffParsed = tmpl.difficulty_contract.safeParse(gl.difficulty_params);
  if (!diffParsed.success) {
    parseContractIssues(
      "difficulty_params",
      diffParsed.error.issues,
      issues,
      "DIFFICULTY_PARAMS_SCHEMA_INVALID"
    );
  }
}

function checkGate1(
  seed: AnyContentSeed,
  registry: Record<string, GameTemplate> = ALL_TEMPLATES
): GateResult {
  const issues: GateIssue[] = [];

  if (seed.kind === "activity") {
    checkActivityGate1(seed as ActivitySeed, issues);
  } else if (seed.kind === "lesson") {
    checkLessonGate1(seed as LessonSeed, issues);
  } else {
    checkGameLevelGate1(seed as ContentSeed, issues, registry);
  }

  return {
    gate: 1,
    name: "Schema",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate2(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (header.content_version < 1) {
    issues.push({
      code: "CONTENT_VERSION_INVALID",
      message: "content_version phải >= 1.",
    });
  }

  if (!header.title || header.title.trim().length === 0) {
    issues.push({
      code: "TITLE_EMPTY",
      message: "Tiêu đề không được rỗng.",
    });
  }

  if (
    "legacy_v1_ref" in header &&
    header.legacy_v1_ref &&
    !isValidLegacyV1Ref(header.legacy_v1_ref)
  ) {
    issues.push({
      code: "LEGACY_V1_REF_INVALID",
      message: `Mã legacy_v1_ref '${header.legacy_v1_ref}' không thuộc 60 mã game type v1 hợp lệ.`,
    });
  }

  return {
    gate: 2,
    name: "Cấu trúc",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function collectEmojiRefs(
  value: unknown,
  refs: Set<string> = new Set()
): Set<string> {
  if (!value || typeof value !== "object") {
    return refs;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectEmojiRefs(item, refs);
    }
    return refs;
  }
  const record = value as Record<string, unknown>;
  if (record.kind === "emoji" && typeof record.ref === "string") {
    refs.add(record.ref);
  }
  if (typeof record.emoji_ref === "string") {
    refs.add(record.emoji_ref);
  }
  for (const v of Object.values(record)) {
    collectEmojiRefs(v, refs);
  }
  return refs;
}

function checkGate3(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if ("age_min" in header && "age_max" in header) {
    if (header.age_min > header.age_max) {
      issues.push({
        code: "AGE_RANGE_INVALID",
        message: `age_min (${header.age_min}) phải <= age_max (${header.age_max}).`,
      });
    }

    if (header.age_min < 3 || header.age_max > 6) {
      issues.push({
        code: "AGE_OUT_OF_BOUNDS",
        message: `Độ tuổi [${header.age_min}, ${header.age_max}] phải nằm trong [3, 6].`,
      });
    }
  }

  const refs = collectEmojiRefs(seed);
  for (const ref of refs) {
    if (!ref || ref.trim().length === 0) {
      issues.push({
        code: "ASSET_REF_INVALID",
        message: `Mã emoji '${ref}' rỗng hoặc không hợp lệ.`,
      });
    }
  }

  return {
    gate: 3,
    name: "Asset",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

const WHITESPACE_REGEX = /\s+/;

function checkGate4(seed: AnyContentSeed): GateResult {
  const issues: GateIssue[] = [];

  if (seed.kind !== "activity" && seed.kind !== "lesson") {
    const gl = seed as ContentSeed;
    const instruction = gl.header.instruction || "";
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
    name: "Ngôn ngữ",
    kind: "heuristic",
    passed: issues.length === 0,
    issues,
  };
}

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z0-9]{2,5}\.\d{2}$/;
const LO_CODE_REGEX = /^LO-C[1-6]\.[A-Z0-9]{2,5}\.\d{2}-\d{2}$/;

function validateTaxonomyFkCodes(
  codes: string[] | undefined,
  regex: RegExp,
  emptyCode: string,
  invalidCode: string,
  kindLabel: string,
  issues: GateIssue[]
): void {
  if (!codes || codes.length === 0) {
    issues.push({
      code: emptyCode,
      message: `Danh sách ${kindLabel} không được rỗng.`,
    });
    return;
  }
  for (const c of codes) {
    if (!regex.test(c)) {
      issues.push({
        code: invalidCode,
        message: `Mã ${kindLabel} '${c}' không đúng định dạng taxonomy.`,
      });
    }
  }
}

function validateTagList(
  axis: "what" | "thinking",
  tags: string[] | undefined,
  emptyCode: string,
  emptyMessage: string,
  issues: GateIssue[]
): void {
  if (!tags || tags.length === 0) {
    issues.push({
      code: emptyCode,
      message: emptyMessage,
    });
    return;
  }
  for (const tag of tags) {
    if (!isValidTagForAxis(axis, tag)) {
      issues.push({
        code: "TAG_NOT_IN_VOCABULARY",
        message: `Tag '${tag}' không nằm trong từ vựng trục '${axis}'.`,
      });
    }
  }
}

function resolveLevelAgeBand(min: number, max: number): "3-4" | "4-5" | "5-6" {
  if (max <= 4) {
    return "3-4";
  }
  if (min >= 5) {
    return "5-6";
  }
  return "4-5";
}

function checkBannedAgeBand(
  gl: ContentSeed,
  registry: Record<string, GameTemplate>,
  issues: GateIssue[]
): void {
  const templateCode = gl.header.template_code;
  const tmpl = registry?.[templateCode];
  // Không có `banned_age_bands` KHÔNG có nghĩa là miễn kiểm: vế khoảng tuổi của
  // template vẫn phải đo. `return` sớm ở đây từng miễn kiểm 21 trên 27 engine.
  if (!tmpl) {
    return;
  }

  const levelAgeBand = resolveLevelAgeBand(
    gl.header.age_min,
    gl.header.age_max
  );
  if (isLevelOutOfBand(gl, tmpl, levelAgeBand)) {
    issues.push({
      code: "ENGINE_AGE_BAND_BANNED",
      message: `Engine ${templateCode} cấm band tuổi '${levelAgeBand}'.`,
    });
  }
}

function checkGate5(
  seed: AnyContentSeed,
  registry: Record<string, GameTemplate> = ALL_TEMPLATES
): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;

  if (
    "difficulty" in header &&
    typeof header.difficulty === "number" &&
    (header.difficulty < 1 || header.difficulty > 5)
  ) {
    issues.push({
      code: "DIFFICULTY_INVALID",
      message: `Độ khó difficulty phải nằm trong [1, 5] (nhận: ${header.difficulty}).`,
    });
  }

  validateTaxonomyFkCodes(
    header.skill_codes,
    SKILL_CODE_REGEX,
    "SKILL_CODES_EMPTY",
    "SKILL_CODE_FORMAT_INVALID",
    "skill_codes",
    issues
  );

  validateTaxonomyFkCodes(
    header.learning_objective_codes,
    LO_CODE_REGEX,
    "LO_CODES_EMPTY",
    "LO_CODE_FORMAT_INVALID",
    "learning_objective_codes",
    issues
  );

  if (PEDAGOGICAL_AXIS_REQUIREMENT.what) {
    validateTagList(
      "what",
      header.what_tags,
      "WHAT_TAGS_EMPTY",
      "Thiếu tag cho trục nội dung (what_tags).",
      issues
    );
  }
  if (PEDAGOGICAL_AXIS_REQUIREMENT.thinking) {
    validateTagList(
      "thinking",
      header.thinking_tags,
      "THINKING_TAGS_EMPTY",
      "Thiếu tag cho trục tư duy (thinking_tags).",
      issues
    );
  }

  if (seed.kind !== "activity" && seed.kind !== "lesson") {
    checkBannedAgeBand(seed as ContentSeed, registry, issues);
  }

  return {
    gate: 5,
    name: "Sư phạm",
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

  let textToScan = `${header.title || ""}`;
  if (seed.kind === "activity") {
    const act = seed as ActivitySeed;
    textToScan += ` ${JSON.stringify(act.header?.instruction || "")} ${act.header?.materials || ""}`;
  } else if (seed.kind === "lesson") {
    const les = seed as LessonSeed;
    textToScan += ` ${JSON.stringify(les.header?.guide || "")} ${les.header?.materials || ""} ${les.header?.assessment || ""}`;
  } else {
    const gl = seed as ContentSeed;
    textToScan += ` ${gl.header?.instruction || ""} ${JSON.stringify(gl.content_pack || {})} ${JSON.stringify(gl.difficulty_params || {})}`;
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
  existingCodes: Set<string> = new Set(),
  batchCode?: string,
  registry: Record<string, GameTemplate> = ALL_TEMPLATES,
  dataset?: SkillDataset
): GateResult[] {
  const gates = [
    checkGate0(seed, existingCodes),
    checkGate1(seed, registry),
    checkGate2(seed),
    checkGate3(seed),
    checkGate4(seed),
    checkGate5(seed, registry),
    checkGate6(seed),
    checkGate7(seed),
  ];

  // Nếu là Montessori seed, chạy thêm Gate Montessori
  const montessoriGate = checkGateMontessori(seed, batchCode);
  if (
    montessoriGate.issues.length > 0 ||
    seed.header.code.includes("-01") ||
    seed.header.code.includes("-02") ||
    batchCode?.startsWith("SEED-MONT-")
  ) {
    gates.push(montessoriGate);
  }

  // Chạy Gate 8 và 9 nếu là game_level và có dataset truyền vào
  if (seed.kind !== "activity" && seed.kind !== "lesson" && dataset) {
    gates.push(checkGateItemOrigin(seed as ContentSeed, dataset));
    gates.push(checkGateConceptPresent(seed as ContentSeed, dataset));
  }

  return gates;
}
