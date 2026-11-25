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
  shuffleDeterministic,
  visualAssetKey,
} from "./utils.js";

export const projectGT020: Projection<"GT-020"> = {
  template: "GT-020",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-020 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-020", opts.difficulty);
    // Đề và khung chuyện là "tìm hai thẻ giống nhau" (`BR-E020-10`): hai thẻ
    // của một cặp mang **cùng một** hình, và hai cặp khác nhau không được trùng
    // hình — nếu không, trẻ lật hai thẻ trông giống hệt mà vẫn bị tính lệch cặp.
    const seen = new Set<string>();
    const distinct = shuffleDeterministic(dataset.items, rng)
      .map((item) => ({ item, asset: resolveItemAsset(item, true) }))
      .filter(({ asset }) => {
        const key = visualAssetKey(asset);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    if (distinct.length < 2) {
      throw new Error(
        `[BR-E020-10] Dataset ${dataset.skill_code} có ít hơn 2 vật khác hình cho GT-020`
      );
    }
    const pairCount = Math.min(params.target_count ?? 2, distinct.length);

    const pairs = distinct.slice(0, pairCount).map(({ item, asset }) => ({
      pair_key: `pair_${item.id}`,
      card_a: { card_id: `${item.id}_a`, asset },
      card_b: { card_id: `${item.id}_b`, asset },
    }));

    const prompt = pickAgeBandPrompt(
      opts.band,
      {
        mam: "Bé lật mở tìm hai thẻ giống nhau nhé!",
        choi: "Đố bé lật thẻ ghép đúng các cặp đôi nhé!",
        la: "Bé thử nhớ vị trí mở đúng cặp tương ứng nhé!",
      },
      "Bé lật thẻ tìm các cặp tương ứng nhé!"
    );

    return {
      content_pack: {
        prompt,
        pairs,
      },
      difficulty_params: {
        // Mỗi cặp có hai thẻ lật nên item_count = số cặp × 2.
        item_count: pairs.length * 2,
        target_count: pairs.length,
        flip_back_delay_ms: 1200,
        peek_all_initial_ms: params.peek_all_initial_ms ?? 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
