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
  pickSingleObjectToken,
  safeGetItem,
  shuffleDeterministic,
} from "./utils.js";

/** Vật chớp dự phòng khi dataset không có vật đơn nào (`BR-SDS-17`). */
export const GT012_FALLBACK_TOKEN = { kind: "emoji", ref: "🍎" } as const;

export const projectGT012: Projection<"GT-012"> = {
  template: "GT-012",
  requires: { min_items: 1, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-012 đòi hỏi tối thiểu 1 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-012", opts.difficulty);
    const targetCount = params.item_count;

    // Pick 1 base item to repeat or pick targetCount distinct items
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );
    // Đáp án engine là `flash_items.length` nên mỗi ô chớp phải là **một** vật
    // (`BR-E012-10`): ô "🐦🐦🐦🐦" làm trẻ thấy 4 mà đáp án là 1.
    const token = pickSingleObjectToken(dataset.items, baseItem, true);
    const tokenId = token?.item.id ?? baseItem.id;
    const flashItems = Array.from({ length: targetCount }, (_, i) => ({
      item_id: `${tokenId}-${i + 1}`,
      asset: token?.asset ?? GT012_FALLBACK_TOKEN,
    }));

    // Options: correct count + distractors
    const distractorCandidates = [1, 2, 3, 4, 5, 6].filter(
      (v) => v !== targetCount
    );
    // Số phương án nhiễu phải bằng đúng con số khai trong `difficulty_params`,
    // nếu không thì tham số nói dối về chính nội dung nó đi kèm. Bảng tra cho
    // GT-012 là 1..5 theo độ khó; cắt cứng ở 2 làm sai 4 trên 5 bậc.
    const distractorCount = Math.min(
      params.distractor_count ?? 2,
      distractorCandidates.length
    );
    const shuffledDistractors = shuffleDeterministic(
      distractorCandidates,
      rng
    ).slice(0, distractorCount);

    const options = [
      { value: targetCount, is_correct: true },
      ...shuffledDistractors.map((v) => ({ value: v, is_correct: false })),
    ];

    const shuffledOptions = shuffleDeterministic(options, rng);

    const prompt = pickAgeBandPrompt(
      opts.band,
      {
        mam: "Bé nhìn nhanh có mấy bạn vừa hiện nhé!",
        choi: "Đố bé vừa thoáng qua mấy đồ vật nhỉ?",
        la: "Tinh mắt nhớ xem vừa hiện mấy vật nhé!",
      },
      "Đố bé vừa thoáng qua mấy đồ vật nhỉ?"
    );

    return {
      content_pack: {
        prompt,
        flash_items: flashItems,
        arrangement: "dice" as const,
        options: shuffledOptions,
      },
      difficulty_params: {
        flash_ms: params.flash_ms ?? 1500,
        item_count: targetCount,
        distractor_count: distractorCount,
        allow_replay: true,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
