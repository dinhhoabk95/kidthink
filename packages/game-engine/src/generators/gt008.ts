import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT008Generator: LevelGenerator = {
  engine: "GT-008",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["placement", "slot-matching"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 8);
    const count = age_band === "3-4" ? 2 : 3;
    const sampled = sampleUnique(rng, nouns, count);

    const slots = sampled.map((_item, idx) => ({
      slot_id: `slot_${idx + 1}`,
      label: `Ô ${idx + 1}`,
      expected_item_id: `item_${idx + 1}`,
    }));

    const items = sampled.map((item, idx) => ({
      item_id: `item_${idx + 1}`,
      label: item?.label_vi,
      asset: { kind: "emoji" as const, ref: item?.emoji_ref || "🍎" },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy đặt đúng hình vào từng ô nhé!",
        slots,
        items,
      },
      difficulty_params: {
        slot_count: count,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
        ordered_placement: false,
      },
    };
  },
};
