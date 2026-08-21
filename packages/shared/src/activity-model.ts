/**
 * Spec sở hữu: docs/specs/05-content/activity-model.md
 * Business rules: BR-ACM-01..08, D-LB, D-LC, D-LD, D-LE
 */

export type ActivityKind =
  | "digital_game"
  | "discussion"
  | "storytelling"
  | "movement"
  | "manipulative"
  | "worksheet"
  | "observation"
  | "mini_project"
  | "assessment"
  | "home_activity";

export const ACTIVITY_KINDS: readonly ActivityKind[] = [
  "digital_game",
  "discussion",
  "storytelling",
  "movement",
  "manipulative",
  "worksheet",
  "observation",
  "mini_project",
  "assessment",
  "home_activity",
] as const;

export interface ActivityStep {
  instruction: string;
  say_to_child: string;
}

export interface ActivityInstruction {
  preparation: string;
  steps: ActivityStep[];
  easier: string;
  harder: string;
}

export interface SkillAgeConstraint {
  code?: string;
  age_min: number;
  age_max: number;
}

export interface ActivityValidationInput {
  code?: string;
  kind?: string;
  activity_kind?: string;
  title: string;
  instruction?: string | ActivityInstruction;
  materials?: string | null;
  estimated_minutes: number;
  skill_codes?: string[];
  skills?: SkillAgeConstraint[];
  learning_objective_codes?: string[];
  ref_type?: string | null;
  ref_id?: number | null;
  ref_code?: string | null;
  [key: string]: unknown;
}

export interface ActivityValidationResult {
  ok: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  effective_age_min?: number;
  effective_age_max?: number;
}

const CODE_PATTERN = /^ACT-(?:\d{4}|C[1-6]-[A-Z]{2,5}-\d{4})$/;

const FORBIDDEN_CONTEXT_PATTERNS = [
  /như\s+đã\s+học\s+ở\s+bài\s+trước/i,
  /bài\s+học\s+trước/i,
  /tiếp\s+tục\s+từ\s+bài/i,
  /ôn\s+lại\s+bài\s+cũ/i,
  /trong\s+lesson\s+này/i,
  /theo\s+bài\s+trước/i,
];

const SAFETY_3_4_RESTRICTIONS = [
  {
    pattern: /dao|kéo\s+sắc|kéo\s+nhọn|kéo\s+sắt|kéo\s+kim\s+loại/i,
    name: "vật sắc nhọn (dao, kéo sắc)",
  },
  {
    pattern:
      /hạt\s+cườm|hạt\s+nhỏ|hạt\s+cườm\s+nhỏ|đậu\s+nhỏ|viên\s+bi|< 3cm|<3cm/i,
    name: "vật nhỏ có nguy cơ hóc (< 3cm)",
  },
  {
    pattern: /keo\s+nến|súng\s+bắn\s+keo|nước\s+sôi/i,
    name: "vật sắc nhọn / nhiệt độ cao",
  },
];

const SAY_TO_CHILD_REGEX = /"([^"]+)"|“([^”]+)”|nói\s+với\s+(?:bé|trẻ|con):/i;
const EASIER_REGEX = /dễ\s+hơn:/i;
const HARDER_REGEX = /khó\s+hơn:/i;
const QUOTE_REGEX = /"([^"]+)"|“([^”]+)”/;
const EXPENSIVE_MATERIALS_REGEX =
  /chuyên\s+dụng|mua\s+ngoài\s+tiệm\s+chuyên|đồ\s+dùng\s+đắt\s+tiền/i;
const PRINT_REGEX = /in\s+ra|máy\s+in|bản\s+in\s+màu|phiếu\s+in/i;
const OPEN_QUESTIONS_REGEX =
  /\?|vì\s+sao|tại\s+sao|như\s+thế\s+nào|thế\s+nào|cái\s+gì/gi;
const MOVEMENT_SPACE_REGEX = /không\s+gian|khoảng\s+trống|phòng|sân|thảm/i;

export function calculateActivityAgeBand(skills?: SkillAgeConstraint[]): {
  target_age_min: number;
  target_age_max: number;
  valid: boolean;
} {
  if (!skills || skills.length === 0) {
    return { target_age_min: 3, target_age_max: 6, valid: true };
  }
  let intersectionMin = skills[0].age_min;
  let intersectionMax = skills[0].age_max;

  for (let i = 1; i < skills.length; i++) {
    intersectionMin = Math.max(intersectionMin, skills[i].age_min);
    intersectionMax = Math.min(intersectionMax, skills[i].age_max);
  }

  const valid = intersectionMin <= intersectionMax;
  return {
    target_age_min: intersectionMin,
    target_age_max: intersectionMax,
    valid,
  };
}

function validateKindAndRef(
  kind: string,
  input: ActivityValidationInput,
  errors: string[]
): void {
  if (!ACTIVITY_KINDS.includes(kind as ActivityKind)) {
    errors.push(
      `BR-ACM-02: Loại hoạt động '${kind}' không hợp lệ. Phải thuộc 1 trong 10 loại: ${ACTIVITY_KINDS.join(", ")}.`
    );
  }

  if (
    kind === "digital_game" &&
    (input.ref_type !== "game_level" || !(input.ref_id || input.ref_code))
  ) {
    errors.push(
      "D-LC: Hoạt động loại 'digital_game' bắt buộc phải liên kết tới một game level (ref_type = 'game_level' và có ref_id hoặc ref_code)."
    );
  }

  if (kind === "worksheet" && input.ref_type !== "worksheet") {
    errors.push(
      "D-LC: Hoạt động loại 'worksheet' bắt buộc phải có ref_type = 'worksheet'."
    );
  }
}

function parseInstruction(input: ActivityValidationInput) {
  let instructionText = "";
  let easierText = "";
  let harderText = "";
  let hasSayToChild = false;
  let has4Parts = false;

  if (typeof input.instruction === "string") {
    instructionText = input.instruction;
    hasSayToChild = SAY_TO_CHILD_REGEX.test(instructionText);
    easierText = EASIER_REGEX.test(instructionText) ? "present" : "";
    harderText = HARDER_REGEX.test(instructionText) ? "present" : "";
    has4Parts = Boolean(easierText && harderText);
  } else if (input.instruction && typeof input.instruction === "object") {
    const inst = input.instruction as ActivityInstruction;
    const prep = inst.preparation || "";
    easierText = inst.easier || "";
    harderText = inst.harder || "";
    const steps = inst.steps || [];
    has4Parts = Boolean(
      prep.trim() && easierText.trim() && harderText.trim() && steps.length > 0
    );
    instructionText = [
      prep,
      ...steps.map((s) => `${s.instruction} ${s.say_to_child}`),
      easierText,
      harderText,
    ].join(" ");

    hasSayToChild = steps.some(
      (s) =>
        (s.say_to_child && s.say_to_child.trim().length > 0) ||
        QUOTE_REGEX.test(s.instruction)
    );
  }

  return { instructionText, easierText, harderText, hasSayToChild, has4Parts };
}

function checkContentPatterns(
  allText: string,
  kind: string,
  materials: string | null | undefined,
  parsed: ReturnType<typeof parseInstruction>,
  errors: string[]
): void {
  for (const pattern of FORBIDDEN_CONTEXT_PATTERNS) {
    if (pattern.test(allText)) {
      errors.push(
        "BR-ACM-01: Activity phải đứng độc lập, cấm tham chiếu ngữ cảnh bài trước hoặc lesson cụ thể."
      );
      break;
    }
  }

  if (
    kind !== "digital_game" &&
    kind !== "worksheet" &&
    !(parsed.hasSayToChild && parsed.has4Parts)
  ) {
    errors.push(
      "BR-ACM-03: Hoạt động phải có đủ 4 phần hướng dẫn và ít nhất một câu thoại hướng dẫn trực tiếp với trẻ (trong ngoặc kép hoặc trường say_to_child)."
    );
  }

  if (
    typeof materials === "string" &&
    EXPENSIVE_MATERIALS_REGEX.test(materials)
  ) {
    errors.push(
      "BR-ACM-04: Vật liệu phải là thứ có sẵn trong gia đình hoặc tái chế, cấm yêu cầu mua đồ chuyên dụng."
    );
  }

  if (
    kind !== "worksheet" &&
    kind !== "digital_game" &&
    PRINT_REGEX.test(allText)
  ) {
    errors.push(
      `BR-ACM-05: Hoạt động kiểu '${kind}' không được yêu cầu in ấn tài liệu. Chỉ 'worksheet' mới được in.`
    );
  }

  if (
    kind !== "digital_game" &&
    kind !== "worksheet" &&
    !(parsed.easierText && parsed.harderText)
  ) {
    errors.push(
      "BR-ACM-06: Hoạt động phải nêu rõ cả hai biến thể: Dễ hơn (scaffold) và Khó hơn (challenge)."
    );
  }
}

function checkSafetyAndWarnings(
  allText: string,
  kind: string,
  effectiveMin: number,
  effectiveMax: number,
  errors: string[],
  warnings: string[]
): void {
  if (effectiveMin <= 4 || effectiveMax <= 4) {
    for (const forbidden of SAFETY_3_4_RESTRICTIONS) {
      if (forbidden.pattern.test(allText)) {
        errors.push(
          `BR-ACM-07: Vi phạm an toàn cho trẻ 3–4 tuổi: Phát hiện '${forbidden.name}'.`
        );
      }
    }
  }

  if (kind === "discussion") {
    const questionMatches = allText.match(OPEN_QUESTIONS_REGEX) || [];
    if (questionMatches.length < 3) {
      warnings.push(
        "BR-ACM-07.2: Hoạt động thảo luận nên có ít nhất 3 câu hỏi mở gợi mở tư duy."
      );
    }
  } else if (kind === "movement" && !MOVEMENT_SPACE_REGEX.test(allText)) {
    warnings.push(
      "BR-ACM-07.2: Hoạt động vận động nên nêu rõ không gian cần thiết."
    );
  }
}

export function validateActivityModel(
  input: ActivityValidationInput
): ActivityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.code && !CODE_PATTERN.test(input.code)) {
    errors.push(
      "BR-ACM-01: Mã activity phải có định dạng ACT-xxxx (4 chữ số)."
    );
  }

  const kind = (input.kind || input.activity_kind || "") as string;
  validateKindAndRef(kind, input, errors);

  if (
    typeof input.estimated_minutes !== "number" ||
    input.estimated_minutes < 2 ||
    input.estimated_minutes > 20
  ) {
    errors.push(
      "BR-ACM-04: Thời lượng hoạt động phải nằm trong khoảng từ 2 đến 20 phút."
    );
  }

  const parsed = parseInstruction(input);
  const allText = [
    input.title || "",
    parsed.instructionText,
    input.materials || "",
  ].join(" ");

  checkContentPatterns(allText, kind, input.materials, parsed, errors);

  let skillCount = 0;
  if (input.skills) {
    skillCount = input.skills.length;
  } else if (input.skill_codes) {
    skillCount = input.skill_codes.length;
  }

  if (skillCount < 1 || skillCount > 2) {
    errors.push(
      `BR-ACM-08: Hoạt động chỉ được gắn đúng 1 hoặc 2 skill (hiện tại: ${skillCount} skill).`
    );
  }

  const ageBand = calculateActivityAgeBand(input.skills);
  if (!ageBand.valid) {
    errors.push(
      "D-LE: Các skill được gắn có khoảng độ tuổi không giao nhau (giao rỗng)."
    );
  }

  checkSafetyAndWarnings(
    allText,
    kind,
    ageBand.target_age_min,
    ageBand.target_age_max,
    errors,
    warnings
  );

  const isValid = errors.length === 0;
  return {
    ok: isValid,
    valid: isValid,
    errors,
    warnings,
    effective_age_min: ageBand.target_age_min,
    effective_age_max: ageBand.target_age_max,
  };
}
