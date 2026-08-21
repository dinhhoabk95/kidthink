import { z } from "zod";
import { assetSchema, promptFields } from "../../contracts/shared-fields.js";
import { defineTemplate } from "../../contracts/types.js";
import { canAchieveBalance, sumWeights } from "../../systems/balance-system.js";

const weightedItemSchema = () =>
  z.object({
    item_id: z.string().min(1).max(32),
    asset: assetSchema(),
    weight: z.number().int().min(1).max(10),
  });

export const GT014BaseSchema = z.object({
  ...promptFields(),
  left_pan: z.array(weightedItemSchema()).min(0).max(4),
  right_pan: z.array(weightedItemSchema()).min(0).max(4),
  tray: z.array(weightedItemSchema()).min(2).max(6),
  goal: z.enum(["balance", "pick_heavier", "pick_lighter"]).default("balance"),
  target_side: z.enum(["left", "right"]).optional(),
});

export const GT014ContentSchema = GT014BaseSchema.refine(
  (content) => {
    if (content.goal === "balance") {
      return canAchieveBalance(
        content.left_pan,
        content.right_pan,
        content.tray
      );
    }
    if (content.goal === "pick_heavier" || content.goal === "pick_lighter") {
      return sumWeights(content.left_pan) !== sumWeights(content.right_pan);
    }
    return true;
  },
  {
    message:
      "Với goal = balance, phải tồn tại cách đặt vật từ khay để 2 đĩa cân bằng nhau. Với goal so sánh, 2 đĩa không được có tổng khối lượng bằng nhau từ đầu.",
    path: ["tray"],
  }
);

export const GT014DifficultySchema = z.object({
  tray_count: z.number().int().min(2).max(6),
  weight_span: z.number().int().min(1).max(10),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT014Content = z.infer<typeof GT014ContentSchema>;
export type GT014Difficulty = z.infer<typeof GT014DifficultySchema>;

export default defineTemplate({
  code: "GT-014",
  name: "Cân hai bên",
  mechanic: "balance-scale",
  layouts: ["split-columns"],
  content_contract: GT014ContentSchema,
  difficulty_contract: GT014DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [0, 4],
    target_count: [1, 4],
  },
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_placed", "balance_changed", "game_completed"],
  engine_session: "BalanceScaleSession",
  status: "published",
  version: 1,
});
