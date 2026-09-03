import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

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
    const paletteCount = Math.min(Math.max(2, opts.difficulty + 1), 3);
    const chosenItems = shuffleDeterministic(dataset.items, rng).slice(
      0,
      paletteCount
    );

    const palette = chosenItems.map((item) => ({
      id: item.id,
      asset: resolveItemAsset(item, true),
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xếp các hình lặp lại theo quy luật nhé!",
        palette,
        track_length: 8,
        min_repetitions: 2,
      },
      difficulty_params: {
        pattern_length: 2,
        track_length: 8,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
