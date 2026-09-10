import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

export const projectGT008: Projection<"GT-008"> = {
  template: "GT-008",
  requires: { min_items: 2, max_items: 9 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-008 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-008", opts.difficulty);
    const slotCount = Math.min(params.slot_count ?? 2, dataset.items.length);

    const shuffledPool = shuffleDeterministic(dataset.items, rng);
    const chosenItems = shuffledPool.slice(0, slotCount);

    // Vật gây nhiễu không thuộc ô nào — `checkWinCondition` chỉ đòi mọi ô được
    // lấp, nên vật thừa làm tăng độ khó phân loại mà không chặn điều kiện thắng.
    const distractorItems = shuffledPool.slice(
      slotCount,
      slotCount + (params.distractor_count ?? 0)
    );

    const slots = chosenItems.map((item, idx) => ({
      slot_id: `slot_${idx + 1}`,
      expected_item_id: item.id,
      label: item.label.length > 30 ? item.label.slice(0, 30) : item.label,
    }));

    const items = [...chosenItems, ...distractorItems].map((item) => ({
      item_id: item.id,
      label: item.label.length > 30 ? item.label.slice(0, 30) : item.label,
      asset: resolveItemAsset(item, true),
    }));

    const prompt =
      dataset.phrasing.prompt_template.length >= 4
        ? dataset.phrasing.prompt_template.replace("{label}", "vào ô tương ứng")
        : "Bé hãy kéo các hình vào ô tương ứng nhé!";

    return {
      content_pack: {
        prompt: prompt.length >= 4 ? prompt : "Bé hãy kéo vào ô tương ứng nhé",
        slots,
        items: shuffleDeterministic(items, rng),
      },
      difficulty_params: {
        item_count: items.length,
        slot_count: slots.length,
        distractor_count: distractorItems.length,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
