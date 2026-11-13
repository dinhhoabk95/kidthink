import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { KeywordAsset } from "#src/labels/spoken-keyword";
import type { RenderAsset } from "#src/render/types";
import {
  canAchieveBalance,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";

export interface WeightedAssetItem {
  readonly item_id: string;
  readonly weight: number;
  readonly asset?: RenderAsset;
}

export interface PlacedPanItem {
  readonly item: WeightedAssetItem;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

const weightedItemSchema = () =>
  z.object({
    item_id: z.string().min(1).max(32),
    asset: assetSchema(),
    weight: z.number().int().min(1).max(10),
  });

const referenceScaleSchema = () =>
  z.object({
    scale_id: z.string().min(1).max(32),
    left_pan: z.array(weightedItemSchema()).min(1).max(3),
    right_pan: z.array(weightedItemSchema()).min(1).max(3),
  });

export const GT014BaseSchema = z.object({
  ...promptFields(),
  left_pan: z.array(weightedItemSchema()).min(0).max(4),
  right_pan: z.array(weightedItemSchema()).min(0).max(4),
  tray: z.array(weightedItemSchema()).min(2).max(6),
  goal: z.enum(["balance", "pick_heavier", "pick_lighter"]).default("balance"),
  target_side: z.enum(["left", "right"]).optional(),
  reference_scales: z.array(referenceScaleSchema()).min(1).max(2).optional(),
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
  item_count: z.number().int().min(2).max(6),
  tray_count: z.number().int().min(2).max(6),
  weight_span: z.number().int().min(1).max(10),
  hint_after_ms: z.number().int().min(6000).max(30_000),
  allow_retry: z.boolean(),
});

export type GT014Content = z.infer<typeof GT014ContentSchema>;
export type GT014Difficulty = z.infer<typeof GT014DifficultySchema>;

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E014-05`, `BR-FBK-16`). */
export const GT014_STORY_LINE = {
  balance:
    "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé đặt thêm quả cân cho hai bên bằng nhau nhé!",
  pick_heavier:
    "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé xem bên nào nặng hơn nhé!",
  pick_lighter: "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé xem bên nào nhẹ hơn nhé!",
} as const satisfies Record<GT014Content["goal"], string>;

export const GT014_HAPPY_MS = 700;
export const GT014_WONDER_MS = 1500;

export function populateGT014AssetMap(
  c: GT014Content,
  map: Map<string, KeywordAsset>
): ReadonlyMap<string, KeywordAsset> {
  if (map.size === 0) {
    const refs = (c.reference_scales ?? []).flatMap((s) => [
      ...s.left_pan,
      ...s.right_pan,
    ]);
    for (const item of [...refs, ...c.left_pan, ...c.right_pan, ...c.tray]) {
      map.set(item.item_id, item.asset);
    }
  }
  return map;
}

export function allGT014WeightGroups(
  c: GT014Content
): readonly (readonly WeightedItem[])[] {
  const refs = (c.reference_scales ?? []).flatMap((s) => [
    s.left_pan,
    s.right_pan,
  ]);
  return [c.left_pan, c.right_pan, c.tray, ...refs];
}

export function extractGT014PanItemData(
  data: GameAction["data"],
  panKey: "target_pan" | "from_pan",
  leftItems?: readonly WeightedItem[]
): { itemId: string; pan: "left" | "right" } | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const itemId = Reflect.get(data, "item_id");
  if (typeof itemId !== "string" || !itemId) {
    return null;
  }
  const raw = Reflect.get(data, panKey);
  if (raw === "left" || raw === "right") {
    return { itemId, pan: raw };
  }
  if (leftItems) {
    const pan = leftItems.some((i) => i.item_id === itemId) ? "left" : "right";
    return { itemId, pan };
  }
  return null;
}

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
  input: {
    family: "drag",
    verbs: ["drop", "tap"],
    tolerance_px: 24,
  },
  engine_session: "BalanceScaleSession",
  status: "published",
  version: 1,
});
