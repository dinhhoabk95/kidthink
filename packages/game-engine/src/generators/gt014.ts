import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT014Generator: LevelGenerator = {
  engine: "GT-014",
  axes: {
    age_band: ["5-6"],
    what: ["weight", "measurement", "balance", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 5);

    const leftNoun = sampled[0] ?? nouns[0];
    const rightNoun = sampled[1] ?? nouns[1];
    const trayNouns = sampled.slice(2);

    // Đĩa trái nặng 5, đĩa phải nặng 2. Cần thêm 3 vào đĩa phải để cân bằng.
    const leftPan = [
      {
        item_id: "left_1",
        asset: {
          kind: "emoji" as const,
          ref: leftNoun?.emoji_ref ?? "EMJ-apple",
        },
        weight: 5,
      },
    ];

    const rightPan = [
      {
        item_id: "right_1",
        asset: {
          kind: "emoji" as const,
          ref: rightNoun?.emoji_ref ?? "EMJ-banana",
        },
        weight: 2,
      },
    ];

    const tray = [
      {
        item_id: "tray_1",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[0]?.emoji_ref ?? "EMJ-carrot",
        },
        weight: 3, // Vật cân bằng chính xác
      },
      {
        item_id: "tray_2",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[1]?.emoji_ref ?? "EMJ-grape",
        },
        weight: 1, // Nhiễu
      },
      {
        item_id: "tray_3",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[2]?.emoji_ref ?? "EMJ-lemon",
        },
        weight: 4, // Nhiễu
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy đặt thêm vật lên đĩa cân để hai bên thăng bằng nhé!",
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal: "balance",
      },
      difficulty_params: {
        tray_count: tray.length,
        weight_span: 5,
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
