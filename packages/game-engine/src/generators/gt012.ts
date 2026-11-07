import { AGE_BANDS, type AgeBand } from "#src/contracts/types";
import { FLASH_ITEM_CAP_BY_BAND } from "#src/templates/GT-012/template";
import {
  generateNumericOptions,
  getNouns,
  pickOne,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

/** Sàn/trần `flash_ms` của schema và `timer-system` (`GT-012.md` §10). */
const FLASH_MS_MIN = 800;
const FLASH_MS_MAX = 3000;
/** Thời gian nền cộng mỗi vật: trẻ nhỏ cần lâu hơn để nhận lượng. */
const FLASH_BASE_MS = 600;
const FLASH_PER_ITEM_MS: Record<AgeBand, number> = {
  "3-4": 1000,
  "4-5": 600,
  "5-6": 450,
};
/** Số phương án nhiễu: band lớn có nhiều lựa chọn hơn (`distractor_count` 1..5). */
const DISTRACTORS_BY_BAND: Record<AgeBand, number> = {
  "3-4": 1,
  "4-5": 2,
  "5-6": 3,
};
const HINT_AFTER_MS_BY_BAND: Record<AgeBand, number> = {
  "3-4": 8000,
  "4-5": 10_000,
  "5-6": 12_000,
};
const MAX_OPTION_VALUE = 10;

/**
 * `flash_ms` tính từ band và số vật (`BR-E012-05`): bản cũ cố định 1500 ms cho
 * mọi level nên tham số độ khó chính của engine không đổi. Số vật nằm ở hai
 * mức sát trần band (`cap-1`, `cap`) để band 3-4 không còn kẹt ở đúng 2 vật.
 */
export const GT012Generator: LevelGenerator = {
  engine: "GT-012",
  axes: {
    age_band: [...AGE_BANDS],
    what: ["memory", "subitizing", "number"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const item = pickOne(rng, nouns);

    // Trần trí nhớ thị giác theo band (BR-E012-03): 2 · 3 · 4 vật.
    const cap = FLASH_ITEM_CAP_BY_BAND[age_band];
    const count = cap - 1 + rng.nextInt(2); // cap-1..cap

    const flash_items = Array.from({ length: count }, (_, i) => ({
      item_id: `flash_${i + 1}`,
      asset: { kind: "emoji" as const, ref: item.emoji_ref },
    }));

    const distractorCount = DISTRACTORS_BY_BAND[age_band];
    const options = generateNumericOptions(
      count,
      distractorCount + 1,
      rng,
      MAX_OPTION_VALUE
    ).map(({ value, is_correct }) => ({ value, is_correct }));

    const flashMs =
      Math.round((FLASH_BASE_MS + FLASH_PER_ITEM_MS[age_band] * count) / 100) *
      100;

    return {
      content_pack: {
        prompt: "Bé hãy nhìn nhanh và nhớ xem có bao nhiêu hình nhé!",
        flash_items,
        arrangement:
          rng.nextInt(2) === 0 ? ("dice" as const) : ("line" as const),
        options,
      },
      difficulty_params: {
        flash_ms: Math.min(FLASH_MS_MAX, Math.max(FLASH_MS_MIN, flashMs)),
        item_count: count,
        distractor_count: distractorCount,
        allow_replay: true,
        hint_after_ms: HINT_AFTER_MS_BY_BAND[age_band],
        allow_retry: true,
      },
    };
  },
};
