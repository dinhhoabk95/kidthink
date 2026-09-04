import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

export const projectGT035: Projection<"GT-035"> = {
  template: "GT-035",
  requires: { min_items: 1, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-035`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    return {
      content_pack: {
        prompt: "Bé lập trình đường đi về đích nhé!",
        grid: { rows: 3, cols: 3 },
        start: { col: 0, row: 0, facing: "right" as const },
        goal: {
          col: 2,
          row: 0,
          asset: resolveItemAsset(baseItem, true),
        },
        obstacles: [],
        collectibles: [
          {
            id: "c1",
            col: 1,
            row: 0,
            asset: resolveItemAsset(baseItem, true),
          },
        ],
      },
      difficulty_params: {
        grid_rows: 3,
        grid_cols: 3,
        obstacle_count: 0,
        collectible_count: 1,
        allowed_commands: ["forward", "turn_right", "turn_left"] as const,
        max_commands: 5,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
