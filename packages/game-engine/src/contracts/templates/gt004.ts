import { z } from "zod";
import { assetSchema, EmojiRef, promptFields } from "../shared-fields.js";
import type { GameTemplate } from "../types.js";

export function everyItemTargetsAnExistingGroup(data: {
  groups: { group_id: string }[];
  items: { correct_group_id: string }[];
}): boolean {
  const groupIds = new Set(data.groups.map((g) => g.group_id));
  return data.items.every((item) => groupIds.has(item.correct_group_id));
}

export function everyGroupHasAtLeastOneItem(data: {
  groups: { group_id: string }[];
  items: { correct_group_id: string }[];
}): boolean {
  const targetedGroups = new Set(
    data.items.map((item) => item.correct_group_id)
  );
  return data.groups.every((g) => targetedGroups.has(g.group_id));
}

export const GT004BaseContentSchema = z.object({
  ...promptFields(),
  groups: z
    .array(
      z.object({
        group_id: z.string().regex(/^g[0-9]$/),
        label: z.string().max(24),
        label_emoji: EmojiRef,
      })
    )
    .min(2)
    .max(4),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        asset: assetSchema(),
        correct_group_id: z.string(),
      })
    )
    .min(4)
    .max(10),
});

export const GT004ContentSchema = GT004BaseContentSchema.refine(
  everyItemTargetsAnExistingGroup,
  {
    message: "Every item must target an existing group ID in groups",
  }
).refine(everyGroupHasAtLeastOneItem, {
  message: "Every group must have at least one item assigned",
});

export const GT004DifficultySchema = z.object({
  distractor_count: z.number().int().min(0).max(3),
  hint_after_ms: z.number().int().min(8000).max(40_000),
  allow_retry: z.boolean(),
  shuffle_items: z.boolean(),
});

export type GT004Content = z.infer<typeof GT004ContentSchema>;
export type GT004Difficulty = z.infer<typeof GT004DifficultySchema>;

export const GT004Template: GameTemplate<
  typeof GT004ContentSchema,
  typeof GT004DifficultySchema
> = {
  code: "GT-004",
  name: "Phân loại vào nhóm",
  mechanic: "sort-groups",
  layouts: ["multi-bucket-bottom", "split-columns"],
  content_contract: GT004ContentSchema,
  difficulty_contract: GT004DifficultySchema,
  limits: {
    item_count: [4, 10],
    distractor_count: [0, 3],
    target_count: [4, 10],
  },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image", "audio"],
  scoring: {
    max_score: 100,
    pass_threshold: 60,
    star_thresholds: [60, 80, 100],
  },
  events: ["game_started", "item_dragged", "item_sorted", "game_completed"],
  engine_session: "SortGroupsSession",
  status: "published",
  version: 1,
};
