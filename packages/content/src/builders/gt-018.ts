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
    const params = getEngineDifficultyParams("GT-018", opts.difficulty);
    // Cơ chế nghe-chọn chỉ có MỘT đáp án đúng, nên `target_count` của bảng tra
    // không diễn đạt được ở đây. Giữ đúng thứ bảng tra định nghĩa độ khó — tổng
    // số item hiển thị — bằng cách bù phần còn lại vào vật gây nhiễu.
    const distractorCount = Math.min(
      Math.max(params.item_count - 1, params.distractor_count ?? 1),
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
        // Cấu trúc nghe-chọn chỉ có đúng một đáp án đúng.
        item_count: options.length,
        distractor_count: shuffledDistractors.length,
        target_count: 1,
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  },
};
