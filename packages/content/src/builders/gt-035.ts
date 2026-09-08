import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
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
    const params = getEngineDifficultyParams("GT-035", opts.difficulty);
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const collectibleCount = params.collectible_count ?? 1;
    const obstacleCount = params.obstacle_count ?? 0;
    const maxCommands = params.max_commands ?? 4;

    const cols = Math.min(6, Math.max(4, collectibleCount + 2));
    const rows = 3;

    const start = { col: 0, row: 0, facing: "right" as const };
    const goal = {
      col: cols - 1,
      row: 0,
      asset: resolveItemAsset(baseItem, true),
    };

    const collectibles = Array.from({ length: collectibleCount }, (_, i) => ({
      id: `c_${i + 1}`,
      col: i + 1,
      row: 0,
      asset: resolveItemAsset(baseItem, true),
    }));

    const obstacles = Array.from(
      { length: Math.min(obstacleCount, cols) },
      (_, i) => ({
        col: i,
        row: 1,
      })
    );

    return {
      content_pack: {
        prompt: "Bé lập trình đường đi về đích nhé!",
        grid: { rows, cols },
        start,
        goal,
        obstacles,
        collectibles,
        allowed_commands: [
          "forward" as const,
          "turn_left" as const,
          "turn_right" as const,
          "loop" as const,
        ],
      },
      difficulty_params: {
        item_count: params.item_count,
        max_commands: maxCommands,
        obstacle_count: obstacleCount,
        collectible_count: collectibleCount,
        allow_loop: true,
        allow_retry: true,
        hint_after_ms: 10_000,
      },
    };
  },
};
