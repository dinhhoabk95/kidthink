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

const DIGIT_OR_LETTER_REGEX = /[0-9A-Za-z]/;

export const projectGT037: Projection<"GT-037"> = {
  template: "GT-037",
  requires: { min_items: 2, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-037 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const rawParams = getEngineDifficultyParams("GT-037", opts.difficulty);
    const params = rawParams as {
      item_count?: number;
      target_count?: number;
      target_copies?: number;
      distractor_count?: number;
    };

    const itemCount = params.item_count ?? 12;
    const targetCopies = Math.max(
      2,
      Math.min(itemCount - 2, params.target_count ?? params.target_copies ?? 3)
    );

    const shuffledItems = shuffleDeterministic(dataset.items, rng);
    const targetItem = safeGetItem(shuffledItems, 0);
    const distractorPool = shuffledItems.slice(1);

    const maxDistractors =
      (params.distractor_count ?? itemCount - targetCopies) > 5 ? 4 : 2;
    const distractorItemCount = Math.min(
      distractorPool.length,
      Math.max(1, maxDistractors)
    );
    const chosenDistractors = distractorPool.slice(0, distractorItemCount);
    const allChosenItems = [targetItem, ...chosenDistractors];

    const symbols = allChosenItems.map((item) => {
      const asset = resolveItemAsset(item, true);
      const isTextOrAlphanumeric =
        asset.kind === "text" ||
        DIGIT_OR_LETTER_REGEX.test(item.id) ||
        DIGIT_OR_LETTER_REGEX.test(item.label);

      return {
        id: item.id,
        label: item.label,
        asset,
        orientation_free: !isTextOrAlphanumeric,
      };
    });

    const anyOrientationFree = symbols.some((s) => s.orientation_free);
    const rotationJitter = opts.difficulty >= 4 && anyOrientationFree;
    const finishMode = opts.difficulty >= 5 ? "declare" : "auto";

    return {
      content_pack: {
        prompt: `Bé hãy tìm tất cả ${targetItem.label} nhé!`,
        target_ids: [targetItem.id],
        item_count: itemCount,
        target_copies: targetCopies,
        symbols,
        confusable_ids: [],
      },
      difficulty_params: {
        item_count: itemCount,
        target_copies: targetCopies,
        rotation_jitter: rotationJitter,
        finish_mode: finishMode,
        allow_retry: true,
        hint_after_ms: 10_000,
      },
    };
  },
};
