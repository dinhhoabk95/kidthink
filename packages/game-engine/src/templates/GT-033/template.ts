import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export const GT033PaletteItemSchema = z.object({
  color_id: z.string().min(1),
  asset: assetSchema(),
  name_vi: z.string().optional(),
});

export const GT033ContentSchema = z
  .object({
    ...promptFields(),
    grid: z.object({
      rows: z.number().int().min(2).max(5),
      cols: z.number().int().min(2).max(5),
    }),
    palette: z.array(GT033PaletteItemSchema).min(2).max(4),
    cells: z.array(z.string().nullable()),
    solution: z.array(z.string()).optional(),
    row_rule: z.string().optional(),
    col_rule: z.string().optional(),
  })
  .refine((c) => c.cells.length === c.grid.rows * c.grid.cols, {
    message: "Số ô trong cells phải bằng rows * cols của lưới (BR-E033-01)",
    path: ["cells"],
  })
  .refine(
    (c) => {
      const paletteIds = new Set(c.palette.map((p) => p.color_id));
      return c.cells.every((cell) => cell === null || paletteIds.has(cell));
    },
    {
      message: "Mọi màu trong cells phải tồn tại trong bảng palette",
      path: ["cells"],
    }
  )
  .refine(
    (c) => {
      const hasNull = c.cells.some((cell) => cell === null);
      return hasNull;
    },
    {
      message: "Phải có ít nhất 1 ô trống (null) để trẻ điền",
      path: ["cells"],
    }
  );

export const GT033DifficultySchema = z.object({
  grid_size: z.number().int().min(2).max(5).default(3),
  color_count: z.number().int().min(2).max(4).default(2),
  blank_count: z.number().int().min(1).max(12).default(2),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
});

export type GT033PaletteItem = z.infer<typeof GT033PaletteItemSchema>;
export type GT033Content = z.infer<typeof GT033ContentSchema>;
export type GT033Difficulty = z.infer<typeof GT033DifficultySchema>;

export default defineTemplate({
  code: "GT-033",
  name: "Dệt hoa văn lưới",
  mechanic: "weave-grid",
  status: "published",
  version: 1,
  engine_session: "GT033Session",
  layouts: ["weave-grid"],
  content_contract: GT033ContentSchema,
  difficulty_contract: GT033DifficultySchema,
  age_min: 5,
  age_max: 6,
  banned_age_bands: ["3-4", "4-5"],
  requires_tap_fallback: true,
  limits: {
    item_count: [2, 4],
    distractor_count: [0, 0],
    target_count: [4, 25],
  },
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: ["game_started", "yarn_placed", "yarn_removed", "game_completed"],
});
