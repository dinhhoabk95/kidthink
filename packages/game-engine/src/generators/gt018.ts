import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT018Generator: LevelGenerator = {
  engine: "GT-018",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["auditory", "listening", "observation"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 3);
    const target = sampled[0] || { emoji_ref: "🍎", label_vi: "Táo" };

    const options = sampled.map((item, idx) => ({
      item_id: `opt_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item?.emoji_ref || "🍎" },
      is_correct: idx === 0,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy lắng nghe âm thanh và chọn hình tương ứng nhé!",
        audio_prompt: {
          text: target.label_vi,
        },
        response_mode: "select" as const,
        options,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  },
};
