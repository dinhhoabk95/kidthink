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

export const projectGT026: Projection<"GT-026"> = {
  template: "GT-026",
  requires: { min_items: 2, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-026 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const goItem = safeGetItem(shuffled, 0);
    const nogoItem = safeGetItem(shuffled, 1);

    const trials = [
      { id: "t1", kind: "go" as const },
      { id: "t2", kind: "nogo" as const },
      { id: "t3", kind: "go" as const },
      { id: "t4", kind: "go" as const },
    ];

    return {
      content_pack: {
        prompt: `Bé chạm ${goItem.label}, bỏ qua ${nogoItem.label} nhé!`,
        go_stimulus: {
          label: goItem.label,
          asset: resolveItemAsset(goItem, true),
        },
        nogo_stimulus: {
          label: nogoItem.label,
          asset: resolveItemAsset(nogoItem, true),
        },
        trials,
      },
      difficulty_params: {
        stimulus_window_ms: 2000,
        isi_ms: 500,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
