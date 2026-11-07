import { AGE_BANDS, type AgeBand } from "#src/contracts/types";
import { deriveDerangement } from "#src/rng/derangement";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

/** Số ô theo band: 3-4 không quá 4 ô (`GT-008.md` §10), band lớn dần thêm ô và thời gian. */
const SLOT_RANGE_BY_BAND: Record<AgeBand, readonly [number, number]> = {
  "3-4": [2, 3],
  "4-5": [3, 4],
  "5-6": [4, 5],
};

const HINT_AFTER_MS_BY_BAND: Record<AgeBand, number> = {
  "3-4": 8000,
  "4-5": 10_000,
  "5-6": 12_000,
};

/**
 * Mỗi ô mang tên đúng vật nó nhận (`BR-E008-04`): bản cũ đặt nhãn "Ô n" nên
 * không ô nào nói được vật nào vừa, bài chỉ còn là đoán. Khay xếp theo hoán vị
 * không điểm cố định để thứ tự vật không trùng thứ tự ô.
 */
export const GT008Generator: LevelGenerator = {
  engine: "GT-008",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["placement", "slot-matching"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 8);
    const [minSlots, maxSlots] = SLOT_RANGE_BY_BAND[age_band];
    const count = minSlots + rng.nextInt(maxSlots - minSlots + 1);
    const sampled = sampleUnique(rng, nouns, count);

    const slots = sampled.map((item, idx) => ({
      slot_id: `slot_${idx + 1}`,
      label: item.label_vi,
      expected_item_id: `item_${idx + 1}`,
    }));

    const itemsInSlotOrder = sampled.map((item, idx) => ({
      item_id: `item_${idx + 1}`,
      label: item.label_vi,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    }));

    return {
      content_pack: {
        prompt: "Bé hãy đặt đúng hình vào từng ô nhé!",
        slots,
        items: deriveDerangement(itemsInSlotOrder, rng),
      },
      difficulty_params: {
        slot_count: count,
        distractor_count: 0,
        hint_after_ms: HINT_AFTER_MS_BY_BAND[age_band],
        allow_retry: true,
      },
    };
  },
};
