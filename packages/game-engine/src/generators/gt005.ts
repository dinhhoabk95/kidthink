import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface PairItem {
  pair_id: string;
  left: { item_id: string; asset: { kind: "emoji"; ref: string } };
  right: { item_id: string; asset: { kind: "emoji"; ref: string } };
}

export const GT005Generator: LevelGenerator = {
  engine: "GT-005",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["pairing", "matching"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 10);
    const pairCount = age_band === "3-4" ? 2 : 3;
    const sampled = sampleUnique(rng, nouns, pairCount * 2);

    const pairs: PairItem[] = [];
    for (let i = 0; i < pairCount; i++) {
      const leftEmoji = sampled[i * 2]?.emoji_ref || "🍎";
      const rightEmoji = sampled[i * 2 + 1]?.emoji_ref || "🍌";
      pairs.push({
        pair_id: `pair_${i + 1}`,
        left: {
          item_id: `left_${i + 1}`,
          asset: { kind: "emoji" as const, ref: leftEmoji },
        },
        right: {
          item_id: `right_${i + 1}`,
          asset: { kind: "emoji" as const, ref: rightEmoji },
        },
      });
    }

    return {
      content_pack: {
        prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
        pairs,
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
    };
  },
};
