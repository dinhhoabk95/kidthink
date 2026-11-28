import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import { timeToAngles } from "#src/systems/rotation-system";
import type {
  GT016Content,
  GT016Difficulty,
} from "#src/templates/GT-016/template";
import { sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export interface ClockTime {
  hour: number;
  minute: 0 | 30;
}

/** Hai kim phải lệch nhau ít nhất góc này, không thì đọc giờ thành đoán (12:00, 6:30...). */
const MIN_HAND_GAP_DEG = 30;
const MAX_TARGET_ATTEMPTS = 50;
export const HINT_AFTER_MS_BY_STEP = { 60: 9000, 30: 12_000 } as const;

function handGapDeg(time: ClockTime): number {
  const { hourAngleDeg, minuteAngleDeg } = timeToAngles(time);
  const diff = Math.abs(hourAngleDeg - minuteAngleDeg);
  return Math.min(diff, 360 - diff);
}

function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

export function pickTarget(rng: Rng, minuteStep: 30 | 60): ClockTime {
  for (let attempt = 0; attempt < MAX_TARGET_ATTEMPTS; attempt++) {
    const candidate: ClockTime = {
      hour: 1 + rng.nextInt(12),
      minute: minuteStep === 30 && rng.nextInt(2) === 1 ? 30 : 0,
    };
    if (handGapDeg(candidate) >= MIN_HAND_GAP_DEG) {
      return candidate;
    }
  }
  return { hour: 3, minute: 0 };
}

export function pickDistractors(
  rng: Rng,
  target: ClockTime,
  minuteStep: 30 | 60,
  count: number
): ClockTime[] {
  const minutes = minuteStep === 30 ? ([0, 30] as const) : ([0] as const);
  const trap: ClockTime[] =
    minuteStep === 30
      ? [{ hour: target.hour, minute: target.minute === 0 ? 30 : 0 }]
      : [];
  const rest: ClockTime[] = [];
  for (let hour = 1; hour <= 12; hour++) {
    for (const minute of minutes) {
      const time: ClockTime = { hour, minute };
      if (!(sameTime(time, target) || trap.some((t) => sameTime(t, time)))) {
        rest.push(time);
      }
    }
  }
  return [...trap, ...sampleUnique(rng, rest, count - trap.length)];
}

/**
 * Hai bậc độ khó: `minute_step` 60 (chỉ giờ chẵn, đọc kim giờ) và 30 (thêm giờ
 * rưỡi, đọc cả hai kim). Nhiễu không theo khuôn `+1`/`+3` giờ như bản cũ — khuôn
 * đó cho đáp án luôn là phương án đứng trước khoảng trống lớn nhất theo vòng
 * giờ. Bậc 30 luôn có một bẫy lẫn kim: cùng giờ khác phút (`BR-E016-04`).
 */
export const GT016Generator: LevelGenerator<GT016Content, GT016Difficulty> = {
  engine: "GT-016",
  axes: {
    age_band: ["5-6"],
    what: ["time", "measurement", "clock", "angle"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng }): {
    content_pack: GT016Content;
    difficulty_params: GT016Difficulty;
  } {
    const minuteStep = rng.nextInt(2) === 0 ? (60 as const) : (30 as const);

    const target = pickTarget(rng, minuteStep);

    const distractorCount = minuteStep === 60 ? 2 : 2 + rng.nextInt(2);
    const distractors = pickDistractors(
      rng,
      target,
      minuteStep,
      distractorCount
    );

    const options = shuffle(
      [
        { ...target, is_correct: true },
        ...distractors.map((d) => ({ ...d, is_correct: false })),
      ],
      rng
    );

    return {
      content_pack: {
        prompt: "Bé hãy xem đồng hồ chỉ mấy giờ nhé!",
        mode: "read",
        target_time: target,
        options,
        activity_cards: [],
      },
      difficulty_params: {
        item_count: options.length,
        minute_step: minuteStep,
        distractor_count: distractorCount,
        hint_after_ms: HINT_AFTER_MS_BY_STEP[minuteStep],
        allow_retry: true,
      },
    };
  },
};
