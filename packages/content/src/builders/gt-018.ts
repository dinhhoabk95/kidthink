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
  sanitizeChildPrompt,
  shownName,
  shuffleDeterministic,
  visualAssetKey,
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

    const targetAsset = resolveItemAsset(targetItem, true);
    const targetName = shownName(targetItem, targetAsset);
    // Phương án nhiễu khác hình **và** khác tên với đáp án, khác nhau từng đôi
    // (`BR-E018-08`): hai thẻ "1" mà đề gọi "quả bí ngô" thì trẻ không thể đúng.
    const seenKeys = new Set([visualAssetKey(targetAsset)]);
    const seenNames = new Set([targetName]);
    const distractorPool = shuffleDeterministic(
      dataset.items.filter((_, idx) => idx !== targetIdx),
      rng
    ).flatMap((item) => {
      const asset = resolveItemAsset(item, true);
      const key = visualAssetKey(asset);
      const name = shownName(item, asset);
      if (seenKeys.has(key) || seenNames.has(name)) {
        return [];
      }
      seenKeys.add(key);
      seenNames.add(name);
      return [{ item, asset }];
    });
    if (distractorPool.length < 1) {
      throw new Error(
        `[BR-E018-08] Dataset ${dataset.skill_code} không có vật nhiễu khác hình với ${targetName}`
      );
    }
    const params = getEngineDifficultyParams("GT-018", opts.difficulty);
    // Cơ chế nghe-chọn chỉ có MỘT đáp án đúng, nên `target_count` của bảng tra
    // không diễn đạt được ở đây. Giữ đúng thứ bảng tra định nghĩa độ khó — tổng
    // số item hiển thị — bằng cách bù phần còn lại vào vật gây nhiễu.
    const distractorCount = Math.min(
      Math.max(params.item_count - 1, params.distractor_count ?? 1),
      distractorPool.length
    );

    const shuffledDistractors = distractorPool.slice(0, distractorCount);

    const options = [
      {
        item_id: targetItem.id,
        asset: targetAsset,
        is_correct: true,
      },
      ...shuffledDistractors.map((d) => ({
        item_id: d.item.id,
        asset: d.asset,
        is_correct: false,
      })),
    ];

    const audioText = sanitizeChildPrompt(
      `Bé lắng tai nghe rồi tìm ${targetName} nhé!`,
      "Bé lắng tai nghe rồi chạm đúng hình nhé!"
    );

    return {
      content_pack: {
        prompt: audioText,
        audio_prompt: {
          text: audioText,
          // Lời đọc gọi tên đúng vật này (`BR-E018-06`).
          strip_item_ids: [targetItem.id],
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
