import { isInCatalog } from "@mindkid/emoji";
import { moderateCustomGameMetadata } from "@mindkid/moderation";
import { z } from "zod";

export type CustomGameSafeParseResult =
  | { success: true; data: unknown }
  | {
      success: false;
      error: { issues: Array<{ path: (string | number)[]; message: string }> };
    };

export interface CustomGameTemplateLike {
  name: string;
  banned_age_bands?: readonly string[];
  content_contract: {
    safeParse: (data: unknown) => CustomGameSafeParseResult;
  };
  difficulty_contract: {
    safeParse: (data: unknown) => CustomGameSafeParseResult;
  };
}

export type CustomGameTemplateProvider = (
  code: string
) => CustomGameTemplateLike | undefined;

/**
 * 6 MVP Template Codes supported for Custom Games (BR-CGB-07)
 */
export const CUSTOM_GAME_TEMPLATE_CODES = [
  "GT-001",
  "GT-002",
  "GT-003",
  "GT-004",
  "GT-005",
  "GT-006",
] as const;

export type CustomGameTemplateCode =
  (typeof CUSTOM_GAME_TEMPLATE_CODES)[number];

export const customGameTemplateCodeSchema = z.enum(CUSTOM_GAME_TEMPLATE_CODES);
export const customGameStatusSchema = z.enum(["draft", "ready"]);

export type CustomGameStatus = z.infer<typeof customGameStatusSchema>;

/**
 * Zod schema for creating a custom game (Task #66 / P4.5)
 */
export const createCustomGameSchema = z.object({
  template_code: customGameTemplateCodeSchema,
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  instruction: z
    .string()
    .min(1, "Chỉ dẫn không được để trống")
    .max(500, "Chỉ dẫn tối đa 500 ký tự"),
  content_pack: z.record(z.unknown()),
  difficulty_params: z.record(z.unknown()).optional().default({}),
  theme_id: z.string().min(1).max(50).optional().default("farm"),
  age_min: z.number().int().min(3).max(6).optional().default(3),
  age_max: z.number().int().min(3).max(6).optional().default(6),
  skill_ids: z.array(z.number().int().positive()).optional(),
  status: customGameStatusSchema.optional().default("draft"),
});

export type CreateCustomGameInput = z.input<typeof createCustomGameSchema>;

/**
 * Zod schema for updating an existing custom game
 */
export const updateCustomGameSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự")
    .optional(),
  instruction: z
    .string()
    .min(1, "Chỉ dẫn không được để trống")
    .max(500, "Chỉ dẫn tối đa 500 ký tự")
    .optional(),
  content_pack: z.record(z.unknown()).optional(),
  difficulty_params: z.record(z.unknown()).optional(),
  theme_id: z.string().min(1).max(50).optional(),
  age_min: z.number().int().min(3).max(6).optional(),
  age_max: z.number().int().min(3).max(6).optional(),
  skill_ids: z.array(z.number().int().positive()).optional(),
  status: customGameStatusSchema.optional(),
  expected_version: z.number().int().positive().optional(),
});

export type UpdateCustomGameInput = z.infer<typeof updateCustomGameSchema>;

/**
 * Metadata for a custom game validation input
 */
export interface CustomGameValidationInput {
  template_code: string;
  title: string;
  instruction: string;
  content_pack: Record<string, unknown>;
  difficulty_params: Record<string, unknown>;
  theme_id?: string;
  age_min?: number;
  age_max?: number;
  skill_ids?: number[] | null;
}

export interface CustomGameValidationResult {
  ok: boolean;
  issues: string[];
  missing: string[];
}

const WHITESPACE_REGEX = /\s+/;

function collectEmojiRefs(current: unknown, refs: Set<string>): void {
  if (!current) {
    return;
  }
  if (Array.isArray(current)) {
    for (const item of current) {
      collectEmojiRefs(item, refs);
    }
    return;
  }
  if (typeof current === "object") {
    const record = current as Record<string, unknown>;
    if (record.kind === "emoji" && typeof record.ref === "string") {
      refs.add(record.ref);
    }
    for (const val of Object.values(record)) {
      collectEmojiRefs(val, refs);
    }
  }
}

/**
 * Recursively extracts all emoji refs referenced in content_pack.
 */
export function extractEmojiRefsFromContentPack(obj: unknown): string[] {
  const refs = new Set<string>();
  collectEmojiRefs(obj, refs);
  return Array.from(refs);
}

/**
 * Determines the age band for the given age range
 */
export function mapAgeBand(
  ageMin: number,
  ageMax: number
): "3-4" | "4-5" | "5-6" {
  if (ageMax <= 4) {
    return "3-4";
  }
  if (ageMin >= 5) {
    return "5-6";
  }
  return "4-5";
}

/**
 * Counts words in a string.
 */
export function countWords(str: string): number {
  return str.trim().split(WHITESPACE_REGEX).filter(Boolean).length;
}

function validateMetadataAndVocabulary(
  input: CustomGameValidationInput,
  issues: string[],
  missing: string[]
) {
  if (!input.title || input.title.trim() === "") {
    missing.push("title_empty");
    issues.push("Tiêu đề trò chơi không được để trống.");
  } else if (input.title.length > 200) {
    missing.push("title_too_long");
    issues.push("Tiêu đề không được vượt quá 200 ký tự.");
  }

  if (!input.instruction || input.instruction.trim() === "") {
    missing.push("instruction_empty");
    issues.push("Chỉ dẫn không được để trống.");
  } else {
    const wordCount = countWords(input.instruction);
    if (wordCount > 12) {
      missing.push("instruction_too_long");
      issues.push(
        `Chỉ dẫn có ${wordCount} từ (vượt quá giới hạn tối đa 12 từ cho trẻ mầm non).`
      );
    }
  }

  const modResult = moderateCustomGameMetadata(
    input.title || "",
    input.instruction || ""
  );
  if (!modResult.passed) {
    missing.push("content_moderation_failed");
    for (const issue of modResult.issues) {
      issues.push(`Kiểm duyệt nội dung: ${issue.message} (${issue.term}).`);
    }
  }
}

function validateTemplateSchemaAndBands(
  input: CustomGameValidationInput,
  template: CustomGameTemplateLike,
  ageBand: "3-4" | "4-5" | "5-6",
  issues: string[],
  missing: string[]
) {
  if (template.banned_age_bands?.includes(ageBand)) {
    missing.push("template_banned_for_age_band");
    issues.push(`Mẫu ${template.name} không hỗ trợ lứa tuổi ${ageBand}.`);
  }

  const contentParse = template.content_contract.safeParse(input.content_pack);
  if (!contentParse.success) {
    missing.push("content_pack_invalid");
    for (const issue of contentParse.error.issues) {
      issues.push(
        `Dữ liệu nội dung không hợp lệ: ${issue.path.join(".")} - ${issue.message}`
      );
    }
  }

  const difficultyParse = template.difficulty_contract.safeParse(
    input.difficulty_params
  );
  if (!difficultyParse.success) {
    missing.push("difficulty_params_invalid");
    for (const issue of difficultyParse.error.issues) {
      issues.push(
        `Tham số độ khó không hợp lệ: ${issue.path.join(".")} - ${issue.message}`
      );
    }
  }
}

function countItemsAndDistractors(contentPack: Record<string, unknown>): {
  totalItems: number;
  distractorCount: number;
} {
  if (Array.isArray(contentPack.options)) {
    const opts = contentPack.options as Record<string, unknown>[];
    return {
      totalItems: opts.length,
      distractorCount: opts.filter(
        (opt) => opt.is_correct === false || opt.isCorrect === false
      ).length,
    };
  }
  if (Array.isArray(contentPack.items)) {
    const items = contentPack.items as Record<string, unknown>[];
    return {
      totalItems: items.length,
      distractorCount: items.filter(
        (item) => item.is_correct === false || item.isCorrect === false
      ).length,
    };
  }
  if (Array.isArray(contentPack.pairs)) {
    return {
      totalItems: contentPack.pairs.length * 2,
      distractorCount: 0,
    };
  }
  if (Array.isArray(contentPack.sequence)) {
    return {
      totalItems: contentPack.sequence.length,
      distractorCount: 0,
    };
  }
  return { totalItems: 0, distractorCount: 0 };
}

function validateItemCountsAndDistractors(
  contentPack: Record<string, unknown>,
  ageBand: "3-4" | "4-5" | "5-6",
  issues: string[],
  missing: string[]
) {
  const { totalItems, distractorCount } = countItemsAndDistractors(contentPack);

  const bandLimits: Record<
    string,
    { min: number; max: number; maxDistractors: number }
  > = {
    "3-4": { min: 2, max: 4, maxDistractors: 1 },
    "4-5": { min: 3, max: 6, maxDistractors: 2 },
    "5-6": { min: 3, max: 8, maxDistractors: 3 },
  };

  const limit = bandLimits[ageBand];
  if (!limit) {
    return;
  }

  if (totalItems > limit.max) {
    missing.push("item_count_exceeds_band_limit");
    issues.push(
      `Số lượng phần tử (${totalItems}) vượt quá giới hạn tối đa (${limit.max}) của lứa tuổi ${ageBand}.`
    );
  }
  if (distractorCount > limit.maxDistractors) {
    missing.push("distractor_count_exceeds_band_limit");
    issues.push(
      `Số vật gây nhiễu (${distractorCount}) vượt quá giới hạn tối đa (${limit.maxDistractors}) của lứa tuổi ${ageBand}.`
    );
  }
}

function validateHasCorrectAnswer(
  templateCode: string,
  contentPack: Record<string, unknown>,
  issues: string[],
  missing: string[]
) {
  if (templateCode !== "GT-001" && templateCode !== "GT-002") {
    return;
  }
  const opts = (contentPack.options || []) as Record<string, unknown>[];
  const items = (contentPack.items || []) as Record<string, unknown>[];
  const hasCorrect =
    (Array.isArray(contentPack.options) &&
      opts.some((o) => o.is_correct === true)) ||
    (Array.isArray(contentPack.items) &&
      items.some((i) => i.is_correct === true));

  if (!hasCorrect) {
    missing.push("no_correct_answer");
    issues.push("Trò chơi phải có ít nhất một đáp án đúng.");
  }
}

function validateEmojiReferences(
  contentPack: Record<string, unknown>,
  issues: string[],
  missing: string[]
) {
  const emojiRefs = extractEmojiRefsFromContentPack(contentPack);
  for (const ref of emojiRefs) {
    if (!isInCatalog(ref)) {
      missing.push("invalid_emoji_ref");
      issues.push(
        `Emoji '${ref}' không tồn tại trong danh mục emoji chuẩn của hệ thống.`
      );
    }
  }
}

/**
 * Validates custom game content according to BR-CGB-01..10 and BR-GLM-01..10.
 * Server-enforced before marking status = 'ready' (BR-CGB-05).
 */
export function validateCustomGameContent(
  input: CustomGameValidationInput,
  templateProvider?: CustomGameTemplateProvider
): CustomGameValidationResult {
  const issues: string[] = [];
  const missing: string[] = [];

  const ageMin = input.age_min ?? 3;
  const ageMax = input.age_max ?? 6;

  const template = templateProvider
    ? templateProvider(input.template_code)
    : undefined;
  if (!template) {
    missing.push("template_not_supported");
    issues.push(`Mẫu trò chơi ${input.template_code} không được hỗ trợ.`);
    return { ok: false, issues, missing };
  }

  if (ageMin < 3 || ageMax > 6 || ageMin > ageMax) {
    missing.push("invalid_age_range");
    issues.push("Độ tuổi phải từ 3 đến 6 tuổi và tuổi tối thiểu ≤ tối đa.");
  }

  const ageBand = mapAgeBand(ageMin, ageMax);

  validateMetadataAndVocabulary(input, issues, missing);
  validateTemplateSchemaAndBands(input, template, ageBand, issues, missing);
  validateItemCountsAndDistractors(
    input.content_pack || {},
    ageBand,
    issues,
    missing
  );
  validateHasCorrectAnswer(
    input.template_code,
    input.content_pack || {},
    issues,
    missing
  );
  validateEmojiReferences(input.content_pack || {}, issues, missing);

  return {
    ok: issues.length === 0,
    issues,
    missing,
  };
}
