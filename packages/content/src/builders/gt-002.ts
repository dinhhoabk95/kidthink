import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

export const projectGT002: Projection<"GT-002"> = {
  template: "GT-002",
  requires: { min_items: 3, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-002 đòi hỏi tối thiểu 3 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetCount = 2;
    const distractorCount = Math.min(
      Math.max(1, Math.min(opts.difficulty + 1, 4)),
      dataset.items.length - targetCount
    );

    const shuffled = shuffleDeterministic(dataset.items, rng);
    const targets = shuffled.slice(0, targetCount);
    const distractors = shuffled.slice(
      targetCount,
      targetCount + distractorCount
    );

    const targetLabel = targets[0]?.label ?? dataset.concept_label;

    const items = [
      ...targets.map((t) => ({
        item_id: t.id,
        asset: resolveItemAsset(t, true),
        is_correct: true,
      })),
      ...distractors.map((d) => ({
        item_id: d.id,
        asset: resolveItemAsset(d, true),
        is_correct: false,
      })),
    ];

    const prompt =
      dataset.phrasing.prompt_template.length >= 4
        ? dataset.phrasing.prompt_template.replace("{label}", targetLabel)
        : `Bé hãy chọn tất cả các hình ${targetLabel}`;

    return {
      content_pack: {
        prompt: prompt.length >= 4 ? prompt : `Bé hãy chọn hình ${targetLabel}`,
        target_criterion: `Chọn tất cả ${targetLabel}`,
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        distractor_count: distractorCount,
        target_count: targetCount,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
