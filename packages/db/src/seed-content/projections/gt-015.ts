import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT015: Projection<"GT-015"> = {
  template: "GT-015",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-015 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    const itemB = safeGetItem(shuffled, 1);

    const symbols = [
      { symbol_id: itemA.id, asset: resolveItemAsset(itemA, true) },
      { symbol_id: itemB.id, asset: resolveItemAsset(itemB, true) },
    ];

    // 2x2 Latin square: (0,0)=A, (0,1)=B, (1,0)=B, (1,1)=null (unique solution is A)
    const cells = [
      { row: 0, col: 0, symbol_id: itemA.id },
      { row: 0, col: 1, symbol_id: itemB.id },
      { row: 1, col: 0, symbol_id: itemB.id },
      { row: 1, col: 1, symbol_id: null },
    ];

    return {
      content_pack: {
        prompt:
          "Mỗi hàng và mỗi cột đều có đủ các hình, bé hãy tìm hình còn thiếu nhé!",
        grid_size: 2 as const,
        symbols,
        cells,
        regions: "row_col" as const,
      },
      difficulty_params: {
        grid_size: 2,
        missing_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
