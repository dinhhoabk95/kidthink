import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

/** Bậc độ khó cao nhất còn dùng lệnh tuyệt đối (`BR-E035-15`). */
export const GT035_ABSOLUTE_MAX_DIFFICULTY = 2;

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
          asset: resolveItemAsset(baseItem, true),
        }
      : {
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
