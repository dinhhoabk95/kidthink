import { AGE_BANDS } from "#src/contracts/types";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface PairItem {
  pair_id: string;
  left: { item_id: string; asset: { kind: "emoji"; ref: string } };
  right: { item_id: string; asset: { kind: "emoji"; ref: string } };
}

export const GT005Generator: LevelGenerator = {
  engine: "GT-005",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["pairing", "matching"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const pairCount = age_band === "3-4" ? 2 : 3;
    const sampled = sampleUnique(rng, nouns, pairCount);

    // Nối hình giống hệt nhau: quan hệ duy nhất kiểm chứng được mà không cần
    // bảng quan hệ. Ghép hai danh từ ngẫu nhiên thì "cặp" không có nghĩa, và
    // trẻ đúng do may (`GT-005.md` §14).
    const pairs: PairItem[] = sampled.map((noun, i) => ({
      pair_id: `pair_${i + 1}`,
      left: {
        item_id: `left_${i + 1}`,
        asset: { kind: "emoji" as const, ref: noun.emoji_ref },
      },
      right: {
        item_id: `right_${i + 1}`,
        asset: { kind: "emoji" as const, ref: noun.emoji_ref },
      },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy nối các hình giống nhau nhé!",
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
