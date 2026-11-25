import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  shuffleDeterministic,
  visualAssetKey,
} from "./utils.js";

/** Bậc độ khó cao nhất còn dùng lệnh tuyệt đối (`BR-E035-15`). */
export const GT035_ABSOLUTE_MAX_DIFFICULTY = 2;

/** Đích luôn là lá cờ (`BR-E035-18`, nhịp `N2`: "`goal` có cờ"). */
export const GT035_GOAL_ASSET = { kind: "emoji", ref: "🏁" } as const;
/** Vật nhặt dự phòng khi mọi vật của dataset trùng hình lá cờ đích. */
const GT035_FALLBACK_COLLECTIBLE = { kind: "emoji", ref: "⭐" } as const;

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
    // Vật nhặt là vật của dataset nhưng không được trùng hình lá cờ đích
    // (`BR-E035-18`): đích và vật nhặt giống nhau thì trẻ không biết đâu là đích.
    const goalKey = visualAssetKey(GT035_GOAL_ASSET);
    const collectibleAsset =
      shuffleDeterministic(dataset.items, rng)
        .map((item) => resolveItemAsset(item, true))
        .find((asset) => visualAssetKey(asset) !== goalKey) ??
      GT035_FALLBACK_COLLECTIBLE;

    const collectibleCount = params.collectible_count ?? 1;
    const obstacleCount = params.obstacle_count ?? 0;
    const maxCommands = params.max_commands ?? 4;

    const cols = Math.min(6, Math.max(4, collectibleCount + 2));
    const rows = 3;

    // Hệ lệnh theo bậc (`BR-E035-15`): bậc 1–2 dùng mũi tên tuyệt đối theo màn
    // hình, không `loop`; từ bậc 3 sang lệnh tương đối (xoay, đổi hệ quy chiếu).
    const absolute = opts.difficulty <= GT035_ABSOLUTE_MAX_DIFFICULTY;

    const start = { col: 0, row: 0, facing: "right" as const };
    // Hệ tuyệt đối: đích xuống một hàng để lời giải phải đổi hướng (mục 14 của
    // phiếu), cột đích vừa `max_commands` (đi ngang rồi một bước xuống) và
    // không trước vật cần nhặt cuối ở hàng 0.
    const goal = absolute
      ? {
          col: Math.min(cols - 1, Math.max(collectibleCount, maxCommands - 2)),
          row: 1,
          asset: GT035_GOAL_ASSET,
        }
      : {
          col: cols - 1,
          row: 0,
          asset: GT035_GOAL_ASSET,
        };

    const collectibles = Array.from({ length: collectibleCount }, (_, i) => ({
      id: `c_${i + 1}`,
      col: i + 1,
      row: 0,
      asset: collectibleAsset,
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
        prompt: "Đố bé xếp thẻ bước đi dẫn bạn về đích!",
        grid: { rows, cols },
        start,
        goal,
        obstacles,
        collectibles,
        allowed_commands: absolute
          ? [
              "go_up" as const,
              "go_right" as const,
              "go_down" as const,
              "go_left" as const,
            ]
          : [
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
        allow_loop: !absolute,
        allow_retry: true,
        hint_after_ms: 10_000,
      },
    };
  },
};
