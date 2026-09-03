import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

export const projectGT020: Projection<"GT-020"> = {
  template: "GT-020",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-020 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const pairCount = Math.min(
      Math.max(2, Math.min(opts.difficulty + 1, 4)),
      dataset.items.length
    );

    const chosenItems = shuffleDeterministic(dataset.items, rng).slice(
      0,
      pairCount
    );

    const pairs = chosenItems.map((item) => ({
      pair_key: `pair_${item.id}`,
      card_a: {
        card_id: `${item.id}_a`,
        asset: item.glyph
          ? { kind: "text" as const, text: item.glyph }
          : resolveItemAsset(item, true),
      },
      card_b: {
        card_id: `${item.id}_b`,
        asset: item.image ?? { kind: "text" as const, text: item.label },
      },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy lật thẻ và tìm các cặp tương ứng nhé!",
        pairs,
      },
      difficulty_params: {
        flip_back_delay_ms: 1200,
        peek_all_initial_ms: 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
