import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import type { AgeBand } from "#src/contracts/types";
import { defineTemplate } from "#src/contracts/types";

const COMPOUND_PROMPT_REGEX =
  /(?:^|\s)(?:và|vừa\s+\S+\s+vừa|cùng\s+với|đồng\s+thời)(?=\s|$|[,.!?])/i;

function serializeAssetKey(
  asset: z.infer<ReturnType<typeof assetSchema>>
): string {
  if (asset.kind === "emoji") {
    return `emoji:${asset.ref}`;
  }
  if (asset.kind === "text") {
    return `text:${asset.text}`;
  }
  return `image:${asset.path}`;
}

export const GT001BaseContentSchema = z.object({
  ...promptFields(),
  target_item: z.object({
    item_id: z.string(),
    asset: assetSchema(),
  }),
  options: z
    .array(
      z.object({
        item_id: z.string(),
        asset: assetSchema(),
        is_correct: z.boolean(),
      })
    )
    .min(2)
    .max(6),
});

export const GT001ContentSchema = GT001BaseContentSchema.refine(
  (content) => content.options.filter((o) => o.is_correct).length === 1,
  {
    message:
      "BR-E001-04: Phải có đúng một phương án đúng (is_correct === true) trong options.",
    path: ["options"],
  }
)
  .refine((content) => !COMPOUND_PROMPT_REGEX.test(content.prompt), {
    message:
      "BR-E001-02: Câu lệnh prompt chỉ mang một mệnh lệnh đơn, không ghép hai tiêu chí.",
    path: ["prompt"],
  })
  .refine(
    (content) => {
      const correct = content.options.find((o) => o.is_correct);
      if (!correct) {
        return false;
      }
      if (content.target_item.item_id === correct.item_id) {
        return content.options
          .filter((o) => !o.is_correct)
          .every((d) => d.item_id !== correct.item_id);
      }
      const correctKey = serializeAssetKey(correct.asset);
      return content.options
        .filter((o) => !o.is_correct)
        .every((d) => serializeAssetKey(d.asset) !== correctKey);
    },
    {
      message:
        "BR-E001-03: Mồi nhử phải phân biệt rõ với đáp án đúng, không được trùng tài sản hiển thị.",
      path: ["options"],
    }
  );

export const GT001DifficultySchema = z.object({
  distractor_count: z.number().int().min(1).max(5),
  hint_after_ms: z.number().int().min(5000).max(30_000),
  allow_retry: z.boolean(),
  shuffle_items: z.boolean(),
});

export type GT001Content = z.infer<typeof GT001ContentSchema>;
export type GT001Difficulty = z.infer<typeof GT001DifficultySchema>;

export const GT001_BAND_LIMITS: Readonly<
  Record<
    AgeBand,
    { readonly maxOptions: number; readonly maxDistractors: number }
  >
> = {
  "3-4": { maxOptions: 3, maxDistractors: 2 },
  "4-5": { maxOptions: 4, maxDistractors: 3 },
  "5-6": { maxOptions: 6, maxDistractors: 5 },
};

export function validateGT001BandLimits(
  content: GT001Content,
  difficulty: GT001Difficulty,
  ageBand: AgeBand
): boolean {
  const cap = GT001_BAND_LIMITS[ageBand];
  return (
    content.options.length >= 2 &&
    content.options.length <= cap.maxOptions &&
    difficulty.distractor_count >= 1 &&
    difficulty.distractor_count <= cap.maxDistractors
  );
}

export default defineTemplate({
  code: "GT-001",
  name: "Chọn một đáp án",
  mechanic: "tap-select",
  layouts: ["grid", "horizontal-row"],
  content_contract: GT001ContentSchema,
  difficulty_contract: GT001DifficultySchema,
  limits: {
    item_count: [2, 6],
    distractor_count: [1, 5],
    target_count: [1, 1],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_selected", "game_completed"],
  engine_session: "TapSelectSession",
  status: "published",
  version: 1,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
});
