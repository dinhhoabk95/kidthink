import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT016Generator: LevelGenerator = {
  engine: "GT-016",
  axes: {
    age_band: ["5-6"],
    what: ["time", "measurement", "clock", "angle"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng }) {
    const targetHour = 1 + rng.nextInt(12);
    const targetMinute: 0 | 30 = rng.nextInt(2) === 0 ? 0 : 30;
    const targetTime = { hour: targetHour, minute: targetMinute };

    const distractorHour1 = (targetHour % 12) + 1;
    const distractorHour2 = ((targetHour + 2) % 12) + 1;

    const options = [
      {
        hour: targetTime.hour,
        minute: targetTime.minute,
        is_correct: true,
      },
      {
        hour: distractorHour1,
        minute: targetTime.minute,
        is_correct: false,
      },
      {
        hour: distractorHour2,
        minute: targetTime.minute === 0 ? 30 : 0,
        is_correct: false,
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy xem đồng hồ chỉ mấy giờ nhé!",
        mode: "read",
        target_time: targetTime,
        options,
      },
      difficulty_params: {
        show_analog_face: true,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
