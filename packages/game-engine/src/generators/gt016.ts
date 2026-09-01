import { timeToAngles } from "../systems/rotation-system.js";
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
    // Sinh giờ đích sao cho góc hai kim lệch nhau ít nhất 30° (tránh 12:00 trùng góc)
    let targetHour = 1 + rng.nextInt(12);
    let targetMinute: 0 | 30 = rng.nextInt(2) === 0 ? 0 : 30;
    let targetTime = { hour: targetHour, minute: targetMinute };
    let angles = timeToAngles(targetTime);
    let angleDiff = Math.abs(angles.hourAngleDeg - angles.minuteAngleDeg);
    let shortestDiff = Math.min(angleDiff, 360 - angleDiff);

    let attempts = 0;
    while (shortestDiff < 30 && attempts < 20) {
      attempts++;
      targetHour = 1 + rng.nextInt(12);
      targetMinute = rng.nextInt(2) === 0 ? 0 : 30;
      targetTime = { hour: targetHour, minute: targetMinute };
      angles = timeToAngles(targetTime);
      angleDiff = Math.abs(angles.hourAngleDeg - angles.minuteAngleDeg);
      shortestDiff = Math.min(angleDiff, 360 - angleDiff);
    }

    if (shortestDiff < 30) {
      // Fallback an toàn nếu trùng: 3:00 (kim giờ 90°, kim phút 0° -> lệch 90°)
      targetTime = { hour: 3, minute: 0 };
    }

    const distractorHour1 = (targetTime.hour % 12) + 1;
    const distractorHour2 = ((targetTime.hour + 2) % 12) + 1;

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
        minute_step: 30,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
