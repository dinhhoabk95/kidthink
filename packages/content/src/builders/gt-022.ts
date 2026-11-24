import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPluralNoun } from "@mindkid/shared";
import {
  createRng,
  pickAgeBandPrompt,
  resolveItemAsset,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT022: Projection<"GT-022"> = {
  template: "GT-022",
  requires: { min_items: 3, max_items: 8 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 3) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-022 đòi hỏi tối thiểu 3 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-022", opts.difficulty);
    const expectedItemCount = params.item_count;
    const targetCount = params.target_count ?? 2;
    const distractorCount =
      params.distractor_count ?? Math.max(1, expectedItemCount - targetCount);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const targetIdx = rng.nextInt(dataset.items.length);
    const targetItem = safeGetItem(dataset.items, targetIdx);

    const otherItems = dataset.items.filter((_, i) => i !== targetIdx);
    const pool = otherItems.length > 0 ? otherItems : dataset.items;
    const shuffledDistractors = shuffleDeterministic(pool, rng);

    const chosenDistractors: Array<{
      id: string;
      asset: ReturnType<typeof resolveItemAsset>;
    }> = [];
    for (let i = 0; i < distractorCount; i++) {
      const d = safeGetItem(
        shuffledDistractors,
        i % shuffledDistractors.length
      );
      chosenDistractors.push({
        id: `${d.id}_d${i + 1}`,
        asset: resolveItemAsset(d, true),
      });
    }

    const scene_objects = [
      ...Array.from({ length: targetCount }, (_, i) => ({
        id: `${targetItem.id}_t${i + 1}`,
        asset: resolveItemAsset(targetItem, true),
        is_target: true,
        is_hidden: false,
        x: 100 + rng.nextInt(760),
        y: 80 + rng.nextInt(380),
      })),
      ...chosenDistractors.map((d) => ({
        id: d.id,
        asset: d.asset,
        is_target: false,
        is_hidden: false,
        x: 100 + rng.nextInt(760),
        y: 80 + rng.nextInt(380),
      })),
    ];

    const pluralLabel = formatPluralNoun(targetItem.label, {
      value: targetItem.value,
      glyph: targetItem.glyph,
    });
    const prompt = pickAgeBandPrompt(
      opts.band,
      {
        mam: `Bé tinh mắt tìm ${pluralLabel} nhé!`,
        choi: `Đố bé tìm thấy ${pluralLabel} trong tranh nhé!`,
        la: `Bé thử quan sát tìm đủ ${pluralLabel} xem!`,
      },
      "Đố bé tìm đủ các vật trong tranh nhé!"
    );

    return {
      content_pack: {
        prompt,
        target_description: targetItem.label,
        scene_objects: shuffleDeterministic(scene_objects, rng),
      },
      difficulty_params: {
        item_count: expectedItemCount,
        target_count: targetCount,
        distractor_count: distractorCount,
        hint_after_ms: params.hint_after_ms ?? 8000,
        allow_retry: params.allow_retry ?? true,
        show_target_counter: true,
      },
    };
  },
};
