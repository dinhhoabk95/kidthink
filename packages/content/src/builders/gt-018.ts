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

export const projectGT018: Projection<"GT-018"> = {
  template: "GT-018",
  requires: { min_items: 2, max_items: 4 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-018 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetIdx = rng.nextInt(dataset.items.length);
    const targetItem = safeGetItem(dataset.items, targetIdx);

    const distractorPool = dataset.items.filter((_, idx) => idx !== targetIdx);
    const distractorCount = Math.min(
      Math.max(1, Math.min(opts.difficulty + 1, 3)),
      distractorPool.length
    );

    const shuffledDistractors = shuffleDeterministic(distractorPool, rng).slice(
      0,
      distractorCount
    );

    const options = [
      {
        item_id: targetItem.id,
        asset: resolveItemAsset(targetItem, true),
        is_correct: true,
      },
      ...shuffledDistractors.map((d) => ({
        item_id: d.id,
        asset: resolveItemAsset(d, true),
        is_correct: false,
      })),
    ];

    const audioText = `Bé hãy nghe và tìm ${targetItem.label}`;

    return {
      content_pack: {
        prompt: audioText,
        audio_prompt: {
          text: audioText,
        },
        response_mode: "select" as const,
        options: shuffleDeterministic(options, rng),
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  },
};
