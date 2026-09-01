import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT017Generator: LevelGenerator = {
  engine: "GT-017",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "3d", "geometry", "counting"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ age_band }) {
    const cubeCount = age_band === "4-5" ? 3 : 4;
    let model: Array<{ x: number; y: number; z: number }> = [];

    if (cubeCount === 3) {
      // 3 cubes: (0,0,0), (1,0,0), (0,0,1)
      model = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ];
    } else {
      // 4 cubes: (0,0,0), (1,0,0), (0,1,0), (0,0,1)
      model = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ];
    }

    const correctCount = model.length;

    const options = [
      {
        option_id: "opt_correct",
        asset: { kind: "emoji" as const, ref: "EMJ-star" },
        is_correct: true,
      },
      {
        option_id: "opt_dist_1",
        asset: { kind: "emoji" as const, ref: "EMJ-circle" },
        is_correct: false,
      },
      {
        option_id: "opt_dist_2",
        asset: { kind: "emoji" as const, ref: "EMJ-triangle" },
        is_correct: false,
      },
    ];

    return {
      content_pack: {
        prompt: `Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé! (Có ${correctCount} khối)`,
        model,
        question: "count_cubes",
        options,
      },
      difficulty_params: {
        hidden_cube_count: 0,
        distractor_count: 2,
        allow_rotate: false,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
