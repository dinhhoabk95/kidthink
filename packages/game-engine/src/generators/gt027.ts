import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT027Generator: LevelGenerator = {
  engine: "GT-027",
  axes: {
    age_band: ["5-6"],
    what: ["cognitive-flexibility", "rule-switch", "classification"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 4);

    const rules = [
      {
        id: "rule_1",
        name: "Luật màu đỏ",
        description: "Chọn theo màu",
        dimension: "color" as const,
        target_value: "red",
        signal_text: "Chọn đồ vật màu đỏ",
      },
      {
        id: "rule_2",
        name: "Luật hình tròn",
        description: "Chọn theo hình",
        dimension: "shape" as const,
        target_value: "circle",
        signal_text: "Đổi luật: Chọn đồ vật hình tròn",
      },
    ];

    const items = [
      {
        id: "item_1",
        asset: { kind: "emoji" as const, ref: sampled[0]?.emoji_ref },
        color: "red",
        shape: "circle",
      },
      {
        id: "item_2",
        asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
        color: "red",
        shape: "square",
      },
      {
        id: "item_3",
        asset: { kind: "emoji" as const, ref: sampled[2]?.emoji_ref },
        color: "blue",
        shape: "circle",
      },
      {
        id: "item_4",
        asset: { kind: "emoji" as const, ref: sampled[3]?.emoji_ref },
        color: "blue",
        shape: "square",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy chú ý lắng nghe hiệu lệnh để đổi luật phân loại nhé!",
        rules,
        items,
        switch_after_trials: 2,
      },
      difficulty_params: {
        signal_duration_ms: 2000,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
