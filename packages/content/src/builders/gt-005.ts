import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  pickAgeBandPrompt,
  resolveItemAsset,
  sanitizeChildPrompt,
  shuffleDeterministic,
} from "./utils.js";

export const projectGT005: Projection<"GT-005"> = {
  template: "GT-005",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-005 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-005", opts.difficulty);
    const pairCount = Math.min(params.target_count ?? 2, dataset.items.length);

    const chosenItems = shuffleDeterministic(dataset.items, rng).slice(
      0,
      pairCount
    );

    const pairs = chosenItems.map((item) => {
      // Left: glyph (or text label). Right: image (or emoji).
      const leftAsset = item.glyph
        ? { kind: "text" as const, text: item.glyph }
        : resolveItemAsset(item, true);
      const rightAsset = item.image ?? {
        kind: "text" as const,
        text: item.label,
      };

      return {
        pair_id: `pair-${item.id}`,
        left: {
          item_id: item.id,
          asset: leftAsset,
        },
        right: {
          item_id: item.id,
          asset: rightAsset,
        },
      };
    });

    const promptReplacement = dataset.phrasing.prompt_template.includes(
      "tương ứng"
    )
      ? "các cặp"
      : "các cặp tương ứng";
    const bandFallback = pickAgeBandPrompt(
      opts.band,
      {
        mam: "Bé nối hai hình tương ứng với nhau nhé!",
        choi: "Đố bé ghép đúng các cặp tương ứng nhé!",
        la: "Bé thử nối các cặp đôi tương ứng xem!",
      },
      "Bé ghép các cặp tương ứng nhé!"
    );
    const prompt =
      dataset.phrasing.prompt_template.length >= 4
        ? sanitizeChildPrompt(
            dataset.phrasing.prompt_template.replace(
              "{label}",
              promptReplacement
            ),
            bandFallback
          )
        : bandFallback;

    return {
      content_pack: {
        prompt,
        pairs,
      },
      difficulty_params: {
        // Mỗi cặp hiện hai thẻ (trái + phải) nên item_count = số cặp × 2.
        item_count: pairs.length * 2,
        target_count: pairs.length,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
    };
  },
};
