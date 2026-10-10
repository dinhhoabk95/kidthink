import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT037SymbolSchema = z.object({
  id: z.string().min(1).max(32),
  label: z.string().optional(),
  asset: assetSchema(),
  orientation_free: z.boolean().optional(),
});

export type GT037Symbol = z.infer<typeof GT037SymbolSchema>;

/**
 * Chuẩn hoá biểu diễn của một asset để so sánh trùng lặp theo BR-E037-07.
 * Áp dụng Unicode NFC và trim() khoảng trắng thừa.
 */
export function getNormalizedSymbolKey(asset: GT037Symbol["asset"]): string {
  if (asset.kind === "emoji") {
    return `emoji:${asset.ref.normalize("NFC").trim()}`;
  }
  if (asset.kind === "text") {
    return `text:${asset.text.normalize("NFC").trim()}`;
  }
  return `image:${asset.path.trim()}`;
}

/**
 * Biểu thức kiểm tra ký hiệu chữ số hoặc chữ cái Unicode.
 * Chữ số và chữ cái cấm xoay theo BR-E037-06.
 */
export const DIGIT_OR_LETTER_REGEX = /^[\p{N}\p{L}]+$/u;

function validateSymbolIds(
  symbols: readonly GT037Symbol[],
  ctx: z.RefinementCtx
): Set<string> {
  const seenIds = new Set<string>();
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    if (!sym) {
      continue;
    }
    if (seenIds.has(sym.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ID ký hiệu "${sym.id}" bị trùng lặp trong symbols.`,
        path: ["symbols", i, "id"],
      });
    } else {
      seenIds.add(sym.id);
    }
  }
  return seenIds;
}

function validateTargetIds(
  targetIds: readonly string[],
  seenIds: ReadonlySet<string>,
  ctx: z.RefinementCtx
): Set<string> {
  const targetSet = new Set<string>();
  for (let i = 0; i < targetIds.length; i++) {
    const tId = targetIds[i];
    if (!tId) {
      continue;
    }
    if (!seenIds.has(tId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `target_id "${tId}" không tồn tại trong danh sách symbols.`,
        path: ["target_ids", i],
      });
    }
    if (targetSet.has(tId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `target_id "${tId}" bị khai báo trùng lặp.`,
        path: ["target_ids", i],
      });
    } else {
      targetSet.add(tId);
    }
  }
  return targetSet;
}

function validateConfusableIds(
  confusableIds: readonly string[],
  seenIds: ReadonlySet<string>,
  targetSet: ReadonlySet<string>,
  ctx: z.RefinementCtx
): void {
  const confusableSet = new Set<string>();
  for (let i = 0; i < confusableIds.length; i++) {
    const cId = confusableIds[i];
    if (!cId) {
      continue;
    }
    if (!seenIds.has(cId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `confusable_id "${cId}" không tồn tại trong danh sách symbols.`,
        path: ["confusable_ids", i],
      });
    }
    if (targetSet.has(cId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `confusable_id "${cId}" trùng với ký hiệu đích (target_ids).`,
        path: ["confusable_ids", i],
      });
    }
    if (confusableSet.has(cId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `confusable_id "${cId}" bị khai báo trùng lặp.`,
        path: ["confusable_ids", i],
      });
    } else {
      confusableSet.add(cId);
    }
  }
}

function validateOrientationRules(
  symbols: readonly GT037Symbol[],
  ctx: z.RefinementCtx
): void {
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    if (!sym) {
      continue;
    }
    if (sym.orientation_free && sym.asset.kind === "text") {
      const textVal = sym.asset.text.normalize("NFC").trim();
      if (DIGIT_OR_LETTER_REGEX.test(textVal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `BR-E037-06: Ký hiệu chữ số hoặc chữ cái "${textVal}" cấm khai orientation_free.`,
          path: ["symbols", i, "orientation_free"],
        });
      }
    }
  }
}

function validateGlyphDuplicates(
  symbols: readonly GT037Symbol[],
  targetSet: ReadonlySet<string>,
  ctx: z.RefinementCtx
): void {
  const seenGlyphs = new Map<string, { id: string; index: number }>();
  const targetGlyphs = new Set<string>();

  for (const sym of symbols) {
    if (targetSet.has(sym.id)) {
      targetGlyphs.add(getNormalizedSymbolKey(sym.asset));
    }
  }

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    if (!sym) {
      continue;
    }
    const key = getNormalizedSymbolKey(sym.asset);

    if (!targetSet.has(sym.id) && targetGlyphs.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `BR-E037-07: Ký hiệu gây nhiễu "${sym.id}" trùng ký hiệu đích sau chuẩn hoá NFC.`,
        path: ["symbols", i],
      });
    }

    const prev = seenGlyphs.get(key);
    if (prev) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `BR-E037-07: Ký hiệu "${sym.id}" trùng glyph với "${prev.id}" sau chuẩn hoá NFC.`,
        path: ["symbols", i],
      });
    } else {
      seenGlyphs.set(key, { id: sym.id, index: i });
    }
  }
}

export const GT037ContentSchema = z
  .object({
    ...promptFields(),
    symbols: z.array(GT037SymbolSchema).min(2).max(40),
    target_ids: z.array(z.string().min(1).max(32)).min(1).max(2),
    target_copies: z.number().int().min(2).max(8),
    item_count: z.number().int().min(12).max(30),
    confusable_ids: z.array(z.string().min(1).max(32)).max(4).default([]),
  })
  .superRefine((content, ctx) => {
    const seenIds = validateSymbolIds(content.symbols, ctx);
    const targetSet = validateTargetIds(content.target_ids, seenIds, ctx);
    validateConfusableIds(content.confusable_ids, seenIds, targetSet, ctx);

    if (
      content.item_count <=
      content.target_copies + content.confusable_ids.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `item_count (${content.item_count}) phải lớn hơn tổng target_copies (${content.target_copies}) và số lượng confusable_ids (${content.confusable_ids.length}) để chừa chỗ cho ký hiệu gây nhiễu khác.`,
        path: ["item_count"],
      });
    }

    validateOrientationRules(content.symbols, ctx);
    validateGlyphDuplicates(content.symbols, targetSet, ctx);
  });

export const GT037DifficultySchema = z.object({
  item_count: z.number().int().min(12).max(30).optional(),
  target_copies: z.number().int().min(2).max(8).optional(),
  rotation_jitter: z.boolean().optional(),
  hint_after_ms: z.number().int().min(1000).max(60_000).optional(),
  allow_retry: z.boolean().optional(),
  show_target_counter: z.boolean().optional(),
  finish_mode: z.enum(["auto", "declare"]).optional(),
});

export const GT037_DIFFICULTY_DEFAULTS = {
  item_count: 16,
  target_copies: 4,
  hint_after_ms: 8000,
  allow_retry: true,
  show_target_counter: true,
  finish_mode: "auto" as const,
};

export type GT037Content = z.infer<typeof GT037ContentSchema>;
export type GT037Difficulty = z.infer<typeof GT037DifficultySchema>;

const GT037Template = defineTemplate({
  code: "GT-037",
  name: "Tìm hết ký hiệu",
  mechanic: "symbol-hunt",
  status: "draft",
  version: 1,
  engine_session: "GT037Session",
  layouts: ["scatter-board"],
  content_contract: GT037ContentSchema,
  difficulty_contract: GT037DifficultySchema,
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  limits: {
    item_count: [12, 30],
    distractor_count: [8, 26],
    target_count: [2, 8],
  },
  asset_kinds: ["emoji", "text", "image"],
  scoring: STANDARD_SCORING,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
  events: [
    "game_started",
    "item_selected",
    "hint_shown",
    "round_completed",
    "game_completed",
  ],
});

export default GT037Template;
