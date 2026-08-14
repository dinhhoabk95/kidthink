import type { ContentSeed, GateIssue, GateResult } from "../types.js";
import { scanChildContentSafety } from "./blocklist.js";

const LEVEL_CODE_REGEX = /^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$/;
const TEMPLATE_CODE_REGEX = /^GT-\d{3}-\d{3}$/;
const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;
const WHITESPACE_REGEX = /\s+/;

function checkGate0(
  seed: ContentSeed<unknown, unknown>,
  existingCodes: Set<string>
): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;
  if (!header.code || typeof header.code !== "string") {
    issues.push({
      code: "CODE_MISSING",
      message: "Mã code level không được để trống.",
    });
  } else if (
    !(
      LEVEL_CODE_REGEX.test(header.code) ||
      TEMPLATE_CODE_REGEX.test(header.code)
    )
  ) {
    issues.push({
      code: "CODE_FORMAT_INVALID",
      message: `Mã code ${header.code} không đúng định dạng.`,
    });
  }
  if (existingCodes.has(header.code)) {
    issues.push({
      code: "CODE_DUPLICATE_IN_BATCH",
      message: `Mã code ${header.code} bị trùng lặp.`,
    });
  }
  return {
    gate: 0,
    name: "Định danh",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate1(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  if (!seed.content_pack || typeof seed.content_pack !== "object") {
    issues.push({
      code: "CONTENT_PACK_MISSING",
      message: "content_pack phải là object hợp lệ.",
    });
  }
  if (!seed.difficulty_params || typeof seed.difficulty_params !== "object") {
    issues.push({
      code: "DIFFICULTY_PARAMS_MISSING",
      message: "difficulty_params phải là object hợp lệ.",
    });
  }
  return {
    gate: 1,
    name: "Schema",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate2(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;
  if (!header.title_vi?.trim()) {
    issues.push({
      code: "TITLE_EMPTY",
      message: "Tiêu đề tiếng Việt title_vi không được rỗng.",
    });
  }
  if (!header.instruction_vi?.trim()) {
    issues.push({
      code: "INSTRUCTION_EMPTY",
      message: "Chỉ dẫn instruction_vi không được rỗng.",
    });
  }
  if (
    header.age_min < 3 ||
    header.age_max > 6 ||
    header.age_min > header.age_max
  ) {
    issues.push({
      code: "AGE_RANGE_INVALID",
      message: "Độ tuổi phải nằm trong phạm vi 3–6 tuổi.",
    });
  }
  if (header.difficulty < 1 || header.difficulty > 5) {
    issues.push({
      code: "DIFFICULTY_INVALID",
      message: "Độ khó difficulty phải nằm trong [1, 5].",
    });
  }
  if (
    header.age_max <= 4 &&
    Array.isArray((seed.content_pack as Record<string, unknown>)?.items) &&
    ((seed.content_pack as Record<string, unknown>).items as unknown[]).length >
      4
  ) {
    issues.push({
      code: "ITEM_COUNT_AGE_BAND_EXCEEDED",
      message: "Trẻ 3–4 tuổi tối đa 4 items.",
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

function checkGate3(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  const packStr = JSON.stringify(seed.content_pack);
  if (packStr.includes('"image_path"')) {
    const matches = packStr.match(/"image_path"\s*:\s*"([^"]+)"/g);
    if (matches) {
      for (const m of matches) {
        const val = m.split(":")[1].replace(/"/g, "").trim();
        if (val.startsWith("http://") || val.startsWith("https://")) {
          issues.push({
            code: "ABSOLUTE_URL_FORBIDDEN",
            message: `DB không được lưu URL tuyệt đối: ${val}.`,
          });
        }
      }
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

function checkGate4(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  const instruction = seed.header.instruction_vi || "";
  const words = instruction.split(WHITESPACE_REGEX).filter(Boolean);
  if (seed.header.age_min <= 4 && words.length > 12) {
    issues.push({
      code: "INSTRUCTION_TOO_LONG",
      message: `Chỉ dẫn quá dài (${words.length} từ). Tối đa 12 từ.`,
    });
  }
  const lowerInstruction = instruction.toLowerCase();
  if (lowerInstruction.includes("không") || lowerInstruction.includes("đừng")) {
    issues.push({
      code: "NEGATIVE_INSTRUCTION_FORBIDDEN",
      message: "Chỉ dẫn không được chứa từ phủ định (không, đừng).",
    });
  }
  return {
    gate: 4,
    name: "Ngôn ngữ",
    kind: "heuristic",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate5(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  const { header } = seed;
  if (header.skill_codes?.length) {
    for (const sc of header.skill_codes) {
      if (!SKILL_CODE_REGEX.test(sc)) {
        issues.push({
          code: "SKILL_CODE_FORMAT_INVALID",
          message: `Mã skill ${sc} không đúng định dạng.`,
        });
      }
    }
  } else {
    issues.push({
      code: "SKILLS_EMPTY",
      message: "Phải liên kết ít nhất 1 mã skill.",
    });
  }
  if (!header.learning_objective_codes?.length) {
    issues.push({
      code: "LO_EMPTY",
      message: "Phải liên kết ít nhất 1 mã learning objective.",
    });
  }
  if (header.template_code === "GT-006" && header.age_min < 4) {
    issues.push({
      code: "TEMPLATE_AGE_MISMATCH",
      message: "Template GT-006 chỉ cho trẻ từ 4 tuổi.",
    });
  }
  return {
    gate: 5,
    name: "Sư phạm",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

function checkGate6(): GateResult {
  return {
    gate: 6,
    name: "Trùng lặp",
    kind: "heuristic",
    passed: true,
    issues: [],
  };
}

function checkGate7(seed: ContentSeed<unknown, unknown>): GateResult {
  const issues: GateIssue[] = [];
  const fullText = `${seed.header.title_vi} ${seed.header.instruction_vi} ${JSON.stringify(seed.content_pack)}`;
  const safetyViolations = scanChildContentSafety(fullText);
  if (safetyViolations.length > 0) {
    issues.push({
      code: "CHILD_SAFETY_BLOCKLIST_MATCH",
      message: `Từ cấm an toàn trẻ em: ${safetyViolations.join(", ")}`,
    });
  }
  return {
    gate: 7,
    name: "An toàn",
    kind: "heuristic",
    passed: issues.length === 0,
    issues,
  };
}

export function runEightGates(
  seed: ContentSeed<unknown, unknown>,
  existingCodes: Set<string> = new Set()
): GateResult[] {
  return [
    checkGate0(seed, existingCodes),
    checkGate1(seed),
    checkGate2(seed),
    checkGate3(seed),
    checkGate4(seed),
    checkGate5(seed),
    checkGate6(),
    checkGate7(seed),
  ];
}
