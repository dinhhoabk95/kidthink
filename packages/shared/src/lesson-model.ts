/**
 * Spec sở hữu: docs/specs/05-content/lesson-model.md
 * Business rules: BR-LSM-01..09, D-LD
 */

import type { ActivityKind } from "./activity-model.js";

export interface LessonGuide {
  outcome: string;
  preparation: string[];
  opening: string;
  if_child_succeeds: string;
  if_child_needs_help: string;
}

export interface LessonActivityItem {
  activity_code?: string;
  activity_id?: number;
  kind?: ActivityKind | string;
  title?: string;
  estimated_minutes?: number;
  is_required?: boolean;
}

export interface LessonValidationInput {
  code?: string;
  title: string;
  guide?: string | LessonGuide;
  target_age_min?: number | null;
  target_age_max?: number | null;
  estimated_minutes?: number;
  materials?: string | null;
  warm_up?: string | null;
  reflection?: string | null;
  assessment?: string | null;
  extension?: string | null;
  activities?: LessonActivityItem[];
  activity_kinds?: string[];
  skill_codes?: string[];
  learning_objective_codes?: string[];
  access_tier?: string;
  [key: string]: unknown;
}

export interface LessonValidationResult {
  ok: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const LESSON_CODE_PATTERN = /^LES-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;

const FORBIDDEN_ASSESSMENT_ABSTRACT_TERMS = [
  /bé\s+hiểu\s+khái\s+niệm/i,
  /hiểu\s+được\s+khái\s+niệm/i,
  /nắm\s+vững\s+khái\s+niệm/i,
  /phát\s+triển\s+tư\s+duy/i,
  /nhận\s+thức\s+sâu\s+sắc/i,
  /nắm\s+được\s+bản\s+chất/i,
  /có\s+tư\s+duy\s+logic/i,
  /hiểu\s+và\s+nắm/i,
];

const FORBIDDEN_READING_ASSUMPTIONS = [
  /bé\s+tự\s+đọc\s+chữ/i,
  /trẻ\s+tự\s+đọc/i,
  /đọc\s+dòng\s+chữ/i,
  /tự\s+đọc\s+hướng\s+dẫn/i,
  /nhìn\s+chữ\s+và\s+đọc/i,
];

const OUTCOME_REGEX = /mục\s+tiêu|outcome/i;
const PREPARATION_REGEX = /chuẩn\s+bị|preparation/i;
const OPENING_REGEX = /bắt\s+đầu|mở\s+đầu|opening/i;
const SUCCEED_REGEX = /làm\s+được|succeed/i;
const NEEDS_HELP_REGEX = /cần\s+giúp|chưa\s+làm\s+được|needs\s+help/i;
const EXPENSIVE_MATERIALS_REGEX =
  /chuyên\s+dụng|mua\s+ngoài\s+tiệm\s+chuyên|đồ\s+dùng\s+đắt\s+tiền/i;

function countGuideObjParts(g: LessonGuide): number {
  let count = 0;
  if (g.outcome?.trim()) {
    count++;
  }
  if (Array.isArray(g.preparation) && g.preparation.length > 0) {
    count++;
  }
  if (g.opening?.trim()) {
    count++;
  }
  if (g.if_child_succeeds?.trim()) {
    count++;
  }
  if (g.if_child_needs_help?.trim()) {
    count++;
  }
  return count;
}

function countGuideTextParts(text: string): number {
  let count = 0;
  if (OUTCOME_REGEX.test(text)) {
    count++;
  }
  if (PREPARATION_REGEX.test(text)) {
    count++;
  }
  if (OPENING_REGEX.test(text)) {
    count++;
  }
  if (SUCCEED_REGEX.test(text)) {
    count++;
  }
  if (NEEDS_HELP_REGEX.test(text)) {
    count++;
  }
  return count;
}

function checkGuideStructure(guide: unknown): number {
  if (typeof guide === "object" && guide !== null) {
    return countGuideObjParts(guide as LessonGuide);
  }
  return countGuideTextParts((guide as string) || "");
}

function checkOffscreenActivities(
  activities: { kind?: string }[],
  activityKinds: string[],
  options: { isSeed?: boolean },
  errors: string[],
  warnings: string[]
): void {
  let offscreenCount = activities.filter(
    (a) => a.kind && a.kind !== "digital_game"
  ).length;
  offscreenCount += activityKinds.filter((k) => k !== "digital_game").length;

  if (offscreenCount === 0) {
    const issue =
      "BR-LSM-08: Bài học phải có ít nhất 1 hoạt động ngoài màn hình (không phải digital_game).";
    if (options.isSeed || activityKinds.length > 0) {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
  }
}

function checkWorksheetAlternative(
  activities: { kind?: string }[],
  activityKinds: string[],
  errors: string[]
): void {
  const hasWorksheet =
    activities.some((a) => a.kind === "worksheet") ||
    activityKinds.includes("worksheet");

  if (!hasWorksheet) {
    return;
  }

  const nonPrintableAlternatives =
    activities.filter(
      (a) => a.kind && a.kind !== "worksheet" && a.kind !== "digital_game"
    ).length +
    activityKinds.filter((k) => k !== "worksheet" && k !== "digital_game")
      .length;

  if (nonPrintableAlternatives === 0) {
    errors.push(
      "BR-WSM-07: Bài học sử dụng worksheet bắt buộc phải có ít nhất 1 hoạt động thay thế không cần in."
    );
  }
}

function validateProgressionAndActivities(
  input: LessonValidationInput,
  options: { isSeed?: boolean },
  errors: string[],
  warnings: string[]
): void {
  const activities = input.activities || [];
  const activityKinds = input.activity_kinds || [];
  const hasActivities = activities.length > 0 || activityKinds.length > 0;

  if (!hasActivities) {
    errors.push(
      "BR-LSM-01: Lesson phải có ít nhất 1 hoạt động trong phần hoạt động chính."
    );
  }

  if (!input.warm_up || input.warm_up.trim() === "") {
    warnings.push(
      "BR-LSM-01: Lesson nên có phần Khởi động (2–5 phút) để trẻ vào trạng thái tập trung."
    );
  }

  if (!input.reflection || input.reflection.trim() === "") {
    warnings.push(
      "BR-LSM-01: Lesson nên có phần Đúc kết / phản hồi (2–5 phút) để tổng kết bài học."
    );
  }

  checkOffscreenActivities(
    activities,
    activityKinds,
    options,
    errors,
    warnings
  );
  checkWorksheetAlternative(activities, activityKinds, errors);
}

function validateGuideAndMaterials(
  input: LessonValidationInput,
  allText: string,
  errors: string[],
  warnings: string[]
): void {
  const guideParts = checkGuideStructure(input.guide);
  if (guideParts < 5) {
    errors.push(
      `BR-LSM-02: Hướng dẫn (Guide) phải trả lời đủ 5 câu hỏi cốt lõi cho người lớn (hiện tại: ${guideParts}/5 phần).`
    );
  }

  if (EXPENSIVE_MATERIALS_REGEX.test(allText)) {
    errors.push(
      "BR-LSM-04: Vật liệu lesson phải là đồ có sẵn trong gia đình, không yêu cầu mua vật liệu chuyên dụng."
    );
  }

  const est = input.estimated_minutes;
  if (typeof est === "number") {
    if (est < 5 || est > 45) {
      errors.push(
        `BR-LSM-03: Tổng thời lượng bài học (${est} phút) vượt quá giới hạn cho phép (5–45 phút).`
      );
    } else if (est < 15 || est > 30) {
      warnings.push(
        `BR-LSM-05: Thời lượng bài học (${est} phút) nằm ngoài khoảng mục tiêu lý tưởng cho lứa tuổi mầm non (15–30 phút).`
      );
    }
  }
}

function validateAssessmentAndReading(
  input: LessonValidationInput,
  allText: string,
  errors: string[]
): void {
  if (!input.assessment || input.assessment.trim() === "") {
    errors.push(
      "BR-LSM-06: Lesson phải có tiêu chí đánh giá / quan sát cụ thể (assessment) cho người lớn."
    );
  } else {
    for (const term of FORBIDDEN_ASSESSMENT_ABSTRACT_TERMS) {
      if (term.test(input.assessment)) {
        errors.push(
          "BR-LSM-06: Tiêu chí đánh giá không được dùng thuật ngữ trừu tượng chung chung, phải là hành vi quan sát được."
        );
        break;
      }
    }
  }

  const skillsList = input.skill_codes || [];
  if (skillsList.length > 3) {
    errors.push(
      `BR-LSM-07: Lesson không được gắn quá 3 skill (hiện tại: ${skillsList.length} skill).`
    );
  }

  for (const term of FORBIDDEN_READING_ASSUMPTIONS) {
    if (term.test(allText)) {
      errors.push(
        "BR-LSM-08: Lesson không được giả định trẻ tự đọc chữ, mọi chỉ dẫn phải đọc thành tiếng hoặc qua biểu tượng."
      );
      break;
    }
  }
}

export function validateLessonModel(
  input: LessonValidationInput,
  options: { isSeed?: boolean } = {}
): LessonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.code && !LESSON_CODE_PATTERN.test(input.code)) {
    errors.push("BR-LSM-01: Mã lesson phải có định dạng LES-xxxx (4 chữ số).");
  }

  validateProgressionAndActivities(input, options, errors, warnings);

  const allText = [
    input.title || "",
    input.materials || "",
    typeof input.guide === "string"
      ? input.guide
      : JSON.stringify(input.guide || ""),
    input.assessment || "",
  ].join(" ");

  validateGuideAndMaterials(input, allText, errors, warnings);
  validateAssessmentAndReading(input, allText, errors);

  const isValid = errors.length === 0;
  return {
    ok: isValid,
    valid: isValid,
    errors,
    warnings,
  };
}
