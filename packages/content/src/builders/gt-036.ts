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

export const projectGT036: Projection<"GT-036"> = {
  template: "GT-036",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-036 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-036", opts.difficulty);
    // Mỗi ô của chuỗi lặp phải nhìn ra là ô nào (`BR-E036-15`): hai vật cùng
    // hình thì chuỗi "A B A B" đọc thành "A A A A".
    const seen = new Set<string>();
    const distinct = shuffleDeterministic(dataset.items, rng)
      .map((item) => ({ id: item.id, asset: resolveItemAsset(item, true) }))
      .filter((entry) => {
        const key = visualAssetKey(entry.asset);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    if (distinct.length < 2) {
      throw new Error(
        `[BR-E036-15] Dataset ${dataset.skill_code} có ít hơn 2 vật khác hình cho GT-036`
      );
    }
    const palette = distinct.slice(0, params.palette_size ?? 2);

    return {
      content_pack: {
        prompt: "Bé nối tiếp chuỗi hình lặp đúng quy luật nhé!",
        palette,
        track_length: params.track_length ?? 8,
        min_repetitions: params.min_repetitions ?? 2,
      },
      difficulty_params: {
        item_count: palette.length,
        palette_size: palette.length,
        pattern_length: params.pattern_length ?? 2,
        track_length: params.track_length ?? 8,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
