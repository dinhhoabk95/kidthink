import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT022Generator: LevelGenerator = {
  engine: "GT-022",
  axes: {
    age_band: ["3-4", "4-5", "5-6"],
    what: ["observation", "hidden-object", "scene"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 10);
    const count = age_band === "3-4" ? 4 : 6;
    const sampled = sampleUnique(rng, nouns, count);
    const target = sampled[0] || {
      emoji_ref: "EMJ-red-apple",
      label_vi: "Táo",
    };

    const scene_objects = sampled.map((item, idx) => ({
      id: `obj_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: item?.emoji_ref || "🍎" },
      is_target: idx === 0,
      is_hidden: false,
      x: 100 + (idx % 3) * 200,
      y: 100 + Math.floor(idx / 3) * 150,
    }));

    return {
      content_pack: {
        prompt: `Bé hãy tìm hình ${target.label_vi} trong bức tranh nhé!`,
        target_description: target.label_vi,
        scene_objects,
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
