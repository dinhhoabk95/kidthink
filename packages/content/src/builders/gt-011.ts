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
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT011: Projection<"GT-011"> = {
  template: "GT-011",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-011 đòi hỏi tối thiểu 2 vật`
      );
    }

    const params = getEngineDifficultyParams("GT-011", opts.difficulty);
    const optionCount = params.item_count;

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const shuffled = shuffleDeterministic(dataset.items, rng);
    const itemA = safeGetItem(shuffled, 0);
    // Hai vật khác `id` vẫn có thể hiện ra y hệt nhau: dataset quy luật lặp
    // (`C1.PAT.01` kiểu AB) cố ý có hai quả táo và hai quả chuối. Lọc theo `id`
    // thì ô nhiễu vẽ ra đúng hình của đáp án, và hợp đồng GT-011 — "đúng MỘT
    // option khớp quy luật" — đổ. Phải lọc theo cái TRẺ NHÌN THẤY.
    const signature = (item: SkillDataset["items"][number]): string =>
      JSON.stringify(resolveItemAsset(item, true));
    const signatureA = signature(itemA);
    const itemB =
      shuffled.find((it) => signature(it) !== signatureA) ??
      safeGetItem(shuffled, 1);

    // 2x2 matrix: [A, B], [B, ?=A] (row/col symmetry)
    const cells = [
      { row: 0, col: 0, asset: resolveItemAsset(itemA, true) },
      { row: 0, col: 1, asset: resolveItemAsset(itemB, true) },
      { row: 1, col: 0, asset: resolveItemAsset(itemB, true) },
      { row: 1, col: 1, asset: null },
    ];

    const signatureB = signature(itemB);
    const seenSignatures = new Set([signatureA, signatureB]);
    const otherItems = shuffled.filter((it) => {
      const sig = signature(it);
      if (seenSignatures.has(sig)) {
        return false;
      }
      seenSignatures.add(sig);
      return true;
    });

    const distractorOptions = [
      {
        option_id: "opt_d1",
        asset: resolveItemAsset(itemB, true),
        is_correct: false,
      },
    ];

    for (let i = 1; i < optionCount - 1; i++) {
      const extraItem = otherItems[i - 1] ?? {
        id: `${itemA.id}_extra_${i}`,
        label: itemA.label,
        glyph: "⭐",
      };
      distractorOptions.push({
        option_id: `opt_d${i + 1}`,
        asset: resolveItemAsset(extraItem, true),
        is_correct: false,
      });
    }

    const options = [
      {
        option_id: "opt_correct",
        asset: resolveItemAsset(itemA, true),
        is_correct: true,
      },
      ...distractorOptions,
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tìm hình thích hợp vào ô trống nhé!",
        matrix: {
          rows: 2 as const,
          cols: 2 as const,
          cells,
        },
        options: shuffleDeterministic(options, rng),
      },
      difficulty_params: {
        item_count: optionCount,
        grid_size: 2,
        distractor_count: optionCount - 1,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
