import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import {
  createRng,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

function buildTrials(count: number, rng: ReturnType<typeof createRng>) {
  const nogoCount = Math.max(1, Math.round(count * 0.3));
  const rawTrials: Array<{ id: string; kind: "go" | "nogo" }> = [];
  for (let i = 0; i < count; i++) {
    rawTrials.push({
      id: `t${i + 1}`,
      kind: i < nogoCount ? "nogo" : "go",
    });
  }
  const shuffled = shuffleDeterministic(rawTrials, rng);
  return shuffled.map((t, idx) => ({ ...t, id: `t${idx + 1}` }));
}

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
    const params = getEngineDifficultyParams("GT-026", opts.difficulty);
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const goItem = safeGetItem(shuffled, 0);
    const nogoItem = safeGetItem(shuffled, 1);

    const trials = buildTrials(params.item_count, rng);

    return {
      content_pack: {
        prompt: `Bé hãy chạm vào ${formatPromptLabel(goItem.label)}, bỏ qua ${formatPromptLabel(nogoItem.label)} nhé!`,
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
        item_count: params.item_count,
        stimulus_window_ms: params.stimulus_window_ms ?? 1800,
        isi_ms: params.isi_ms ?? 600,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
