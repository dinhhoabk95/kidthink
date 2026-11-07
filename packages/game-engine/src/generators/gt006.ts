import { numberKeycap, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

/** Số bước 3..5 (`BR-E006-03`); chuỗi dài hơn cho trẻ thêm thời gian trước khi gợi ý. */
const MIN_STEPS = 3;
const MAX_STEPS = 5;
/** Keycap `1️⃣`..`9️⃣`: `🔟` không có chữ số để đọc lại thứ tự nên không dùng. */
const MAX_DIGIT = 9;

/**
 * Trục thứ tự của bộ sinh là **số đếm tăng dần liên tiếp** — thứ tự duy nhất
 * không tranh cãi (`GT-006.md` §14, `BR-E006-04`). Bản cũ xếp ngẫu nhiên danh
 * từ chủ đề nên "đúng" chỉ là thứ tự do máy bốc, không có lý do nào để suy luận.
 */
export const GT006Generator: LevelGenerator = {
  engine: "GT-006",
  axes: {
    age_band: ["5-6"],
    what: ["ordering", "sequence"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng }) {
    const stepCount = MIN_STEPS + rng.nextInt(MAX_STEPS - MIN_STEPS + 1);
    const start = 1 + rng.nextInt(MAX_DIGIT - stepCount + 1);

    const sequence = Array.from({ length: stepCount }, (_, idx) => ({
      step_id: `step_${idx + 1}`,
      order_index: idx,
      asset: { kind: "emoji" as const, ref: numberKeycap(start + idx) },
      label: String(start + idx),
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xếp các số theo thứ tự từ nhỏ đến lớn nhé!",
        sequence,
      },
      difficulty_params: {
        hint_after_ms: 10_000 + 2500 * (stepCount - MIN_STEPS),
        allow_retry: true,
        shuffle_initial: true,
      },
    };
  },
};
