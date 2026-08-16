/**
 * Spec sở hữu: docs/specs/05-content/worksheet-model.md
 * Business rules: BR-WSM-01..08, D-P4I, D-P4J, D-P4K, D-P4L
 */

import { z } from "zod";

export const WORKSHEET_LAYOUT_TEMPLATES = [
  "pattern_coloring",
  "pair_matching",
  "group_circling",
  "shape_completion",
  "count_and_color",
  "spot_differences",
] as const;

export type WorksheetLayoutTemplate =
  (typeof WORKSHEET_LAYOUT_TEMPLATES)[number];

// Prohibited reading keywords for children (BR-WSM-02)
const CHILD_READING_PATTERNS = [
  /hãy\s+đọc/i,
  /đọc\s+chữ/i,
  /đọc\s+câu/i,
  /đọc\s+đoạn/i,
  /nhìn\s+chữ/i,
  /chọn\s+chữ/i,
  /viết\s+chữ/i,
  /chính\s+tả/i,
  /đọc\s+hướng\s+dẫn/i,
];

// Physical thresholds (BR-WSM-04)
export const MIN_DRAW_AREA_MM = 20; // 20mm = 2cm
export const MIN_STROKE_WIDTH_PT = 2.0; // 2pt stroke thickness

/**
 * 1. Pattern Coloring (Tô màu theo quy luật)
 */
export const patternColoringItemSchema = z.object({
  id: z.string(),
  shape: z.enum(["circle", "square", "triangle", "star", "heart", "diamond"]),
  is_blank: z.boolean().default(false), // Child colors this
  color_hint: z.string().optional(),
  size_mm: z.number().min(MIN_DRAW_AREA_MM).default(24),
});

export const patternColoringBlockSchema = z.object({
  template: z.literal("pattern_coloring"),
  rule_sequence: z.array(z.string()).min(2).max(4), // e.g. ["circle", "square"]
  rows: z
    .array(
      z.object({
        row_id: z.string(),
        items: z.array(patternColoringItemSchema).min(3).max(8),
      })
    )
    .min(1)
    .max(5),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * 2. Pair Matching (Nối cặp)
 */
export const pairMatchingItemSchema = z.object({
  id: z.string(),
  emoji_code: z.string().optional(),
  shape: z.string().optional(),
  label_symbol: z.string().optional(),
  size_mm: z.number().min(MIN_DRAW_AREA_MM).default(25),
});

export const pairMatchingBlockSchema = z.object({
  template: z.literal("pair_matching"),
  left_column: z.array(pairMatchingItemSchema).min(2).max(6),
  right_column: z.array(pairMatchingItemSchema).min(2).max(6),
  correct_pairs: z
    .array(
      z.object({
        left_id: z.string(),
        right_id: z.string(),
      })
    )
    .min(2),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * 3. Group Circling (Khoanh nhóm)
 */
export const groupCirclingItemSchema = z.object({
  id: z.string(),
  item_type: z.string(),
  is_target: z.boolean(),
  pos_x_pct: z.number().min(0).max(100),
  pos_y_pct: z.number().min(0).max(100),
  size_mm: z.number().min(MIN_DRAW_AREA_MM).default(22),
});

export const groupCirclingBlockSchema = z.object({
  template: z.literal("group_circling"),
  visual_target_symbol: z.string(), // icon or visual hint of what to circle
  items: z.array(groupCirclingItemSchema).min(3).max(15),
  target_count: z.number().min(1),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * 4. Shape Completion (Vẽ tiếp hình)
 */
export const shapeCompletionItemSchema = z.object({
  id: z.string(),
  base_shape: z.enum([
    "circle",
    "square",
    "triangle",
    "rectangle",
    "semicircle",
  ]),
  missing_part: z.enum(["half", "outline_dash", "corner", "diagonal"]),
  dash_stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
  size_mm: z.number().min(MIN_DRAW_AREA_MM).default(35),
});

export const shapeCompletionBlockSchema = z.object({
  template: z.literal("shape_completion"),
  items: z.array(shapeCompletionItemSchema).min(1).max(6),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * 5. Count and Color (Đếm và tô số ô)
 */
export const countAndColorGroupSchema = z.object({
  id: z.string(),
  item_symbol: z.string(),
  item_count: z.number().min(1).max(10),
  max_boxes: z.number().min(1).max(10).default(10),
  box_size_mm: z.number().min(MIN_DRAW_AREA_MM).default(20),
});

export const countAndColorBlockSchema = z.object({
  template: z.literal("count_and_color"),
  groups: z.array(countAndColorGroupSchema).min(1).max(5),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * 6. Spot Differences (Tìm điểm khác nhau)
 */
export const differenceSpotSchema = z.object({
  spot_id: z.string(),
  x_pct: z.number().min(0).max(100),
  y_pct: z.number().min(0).max(100),
  radius_mm: z.number().min(10).default(12), // 10mm radius = 20mm diameter (BR-WSM-04)
  description_adult_vi: z.string(),
});

export const spotDifferencesBlockSchema = z.object({
  template: z.literal("spot_differences"),
  scene_theme: z.string().default("farm"),
  differences_count: z.number().min(2).max(7),
  spots: z.array(differenceSpotSchema).min(2).max(7),
  stroke_pt: z.number().min(MIN_STROKE_WIDTH_PT).default(2.0),
});

/**
 * Discriminated union of all 6 worksheet content blocks
 */
export const worksheetContentBlockSchema = z.discriminatedUnion("template", [
  patternColoringBlockSchema,
  pairMatchingBlockSchema,
  groupCirclingBlockSchema,
  shapeCompletionBlockSchema,
  countAndColorBlockSchema,
  spotDifferencesBlockSchema,
]);

export type WorksheetContentBlock = z.infer<typeof worksheetContentBlockSchema>;

/**
 * Form Schema for Manager Studio
 */
export const worksheetFormSchema = z.object({
  code: z
    .string()
    .regex(/^WS-\d{4}$/, "Mã worksheet phải có định dạng WS-xxxx")
    .optional(),
  title: z.string().min(3, "Tiêu đề worksheet phải từ 3 ký tự trở lên"),
  layout_template: z.enum(WORKSHEET_LAYOUT_TEMPLATES, {
    errorMap: () => ({
      message:
        "Loại layout phải thuộc 1 trong 6 loại đóng của spec (BR-WSM-01)",
    }),
  }),
  content_blocks: worksheetContentBlockSchema,
  instructions_vi: z
    .string()
    .min(10, "Hướng dẫn cho người lớn ở chân trang phải có ít nhất 10 ký tự"),
  learning_objective_ids: z
    .array(z.number())
    .min(
      1,
      "Worksheet phải gắn ít nhất 1 mục tiêu học tập (learning objective)"
    ),
  access_tier: z
    .enum(["free", "login", "standard", "premium"])
    .default("standard"),
});

export type WorksheetFormInput = z.infer<typeof worksheetFormSchema>;

export interface WorksheetValidationResult {
  ok: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Physical & Editorial Invariant Validator for Worksheets
 */
export function validateWorksheetContent(input: {
  title: string;
  layout_template: string;
  content_blocks: unknown;
  instructions_vi?: string | null;
  learning_objective_ids?: (number | string)[];
}): WorksheetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Template validation
  if (
    !WORKSHEET_LAYOUT_TEMPLATES.includes(
      input.layout_template as WorksheetLayoutTemplate
    )
  ) {
    errors.push(
      `BR-WSM-01: Loại worksheet '${input.layout_template}' không hợp lệ. Chỉ chấp nhận 6 loại: ${WORKSHEET_LAYOUT_TEMPLATES.join(", ")}.`
    );
  }

  // 2. Parse content blocks with discriminated schema
  const parsedBlock = worksheetContentBlockSchema.safeParse(
    input.content_blocks
  );
  if (!parsedBlock.success) {
    for (const issue of parsedBlock.error.issues) {
      errors.push(`BR-WSM-04: Lỗi cấu trúc khối nội dung: ${issue.message}`);
    }
  }

  // 3. BR-WSM-02: NEVER require children to read text
  const blockJsonStr = JSON.stringify(input.content_blocks || "");
  for (const pattern of CHILD_READING_PATTERNS) {
    if (pattern.test(blockJsonStr) || pattern.test(input.title)) {
      errors.push(
        "BR-WSM-02: Không được yêu cầu trẻ đọc chữ. Mọi chỉ dẫn cho trẻ phải là hình ảnh/biểu tượng trực quan."
      );
      break;
    }
  }

  // 4. BR-WSM-05: Instructions for adults in footer
  if (!input.instructions_vi || input.instructions_vi.trim().length < 10) {
    errors.push(
      "BR-WSM-05: Worksheet bắt buộc phải có hướng dẫn sư phạm cho người lớn ở chân trang (tối thiểu 10 ký tự)."
    );
  }

  // 5. Objectives
  const objCount = Array.isArray(input.learning_objective_ids)
    ? input.learning_objective_ids.length
    : 0;
  if (objCount < 1) {
    errors.push(
      "BR-WSM-01: Worksheet phải gắn ít nhất 1 mục tiêu học tập (learning objective)."
    );
  }

  const isValid = errors.length === 0;
  return {
    ok: isValid,
    valid: isValid,
    errors,
    warnings,
  };
}
