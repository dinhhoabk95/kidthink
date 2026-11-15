import { z } from "zod";
import { isValidThemeCode } from "./constants/content-themes.js";
import {
  DIORAMA_NORM_MAX,
  DIORAMA_NORM_MIN,
  DIORAMA_SCALE_MAX,
  DIORAMA_SCALE_MIN,
  MASCOT_GEAR_MAP,
  MAX_DIORAMA_PLACEMENTS,
  type MascotGearSlot,
} from "./constants/mascot-gear.js";

/**
 * Schema & contract cho mở rộng Thế giới Trẻ mầm non (`daily-adventure-flow.md`,
 * `mascot-playroom.md`, `sticker-diorama.md`, `montessori-toybox.md`).
 */

export interface AdventureStepItem {
  readonly step_index: number;
  readonly level_code: string;
  readonly title: string;
  readonly thumbnail_emoji: string;
  readonly kind: "intro" | "play";
}

export interface DailyAdventureResponse {
  readonly child_uuid: string;
  readonly greeting_vi: string;
  readonly steps: readonly AdventureStepItem[];
}

export interface MascotGearPublicItem {
  readonly code: string;
  readonly slot: MascotGearSlot;
  readonly label_vi: string;
  readonly spoken_vi: string;
  readonly icon_emoji: string;
}

export interface MascotGearResponse {
  readonly equipped_gear_code: string | null;
  readonly unlocked_gears: readonly MascotGearPublicItem[];
}

export const MascotGearPutSchema = z.object({
  equipped_gear_code: z
    .string()
    .trim()
    .min(1, "Mã phụ kiện không được rỗng")
    .max(40, "Mã phụ kiện quá dài")
    .refine((code) => MASCOT_GEAR_MAP.has(code), {
      message: "Phụ kiện không tồn tại trong danh mục",
    })
    .nullable(),
});

export type MascotGearPutInput = z.infer<typeof MascotGearPutSchema>;

export interface MascotGearPutResponse {
  readonly equipped_gear_code: string | null;
}

export const StickerDioramaQuerySchema = z.object({
  theme: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .refine(isValidThemeCode, {
      message: "Chủ đề không thuộc danh mục hợp lệ",
    })
    .optional(),
});

export type StickerDioramaQueryInput = z.infer<
  typeof StickerDioramaQuerySchema
>;

export const StickerPlacementInputSchema = z.object({
  emoji: z.string().trim().min(1).max(16),
  instance_index: z
    .number()
    .int()
    .min(0)
    .max(MAX_DIORAMA_PLACEMENTS - 1),
  norm_x: z.number().min(DIORAMA_NORM_MIN).max(DIORAMA_NORM_MAX),
  norm_y: z.number().min(DIORAMA_NORM_MIN).max(DIORAMA_NORM_MAX),
  scale: z
    .number()
    .min(DIORAMA_SCALE_MIN)
    .max(DIORAMA_SCALE_MAX)
    .optional()
    .default(1),
});

export type StickerPlacementInput = z.infer<typeof StickerPlacementInputSchema>;

export const StickerDioramaPutSchema = z
  .object({
    theme_code: z.string().trim().min(1).max(30).refine(isValidThemeCode, {
      message: "Chủ đề không thuộc danh mục hợp lệ",
    }),
    placements: z
      .array(StickerPlacementInputSchema)
      .max(
        MAX_DIORAMA_PLACEMENTS,
        `Tối đa ${MAX_DIORAMA_PLACEMENTS} sticker trên một bức tranh`
      ),
  })
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < val.placements.length; i++) {
      const item = val.placements[i];
      if (!item) {
        continue;
      }
      const key = `${item.emoji}:${item.instance_index}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["placements", i, "instance_index"],
          message: "Trùng lặp cặp emoji và chỉ số bản bày trên cùng bức tranh",
        });
      }
      seen.add(key);
    }
  });

export type StickerDioramaPutInput = z.infer<typeof StickerDioramaPutSchema>;

export interface StickerDioramaPlacementItem {
  readonly emoji: string;
  readonly label: string;
  readonly instance_index: number;
  readonly norm_x: number;
  readonly norm_y: number;
  readonly scale: number;
}

export interface StickerDioramaResponse {
  readonly placements_by_theme: Readonly<
    Record<string, readonly StickerDioramaPlacementItem[]>
  >;
}

export interface StickerDioramaPutResponse {
  readonly theme_code: string;
  readonly placements: readonly StickerDioramaPlacementItem[];
}
