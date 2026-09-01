import {
  getNouns,
  pickOne,
  sampleUnique,
  VALID_GENERATOR_THEMES,
} from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface CubeCoord {
  x: number;
  y: number;
  z: number;
  colorToken?: string;
}

export const GT017Generator: LevelGenerator = {
  engine: "GT-017",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "3d", "geometry", "counting"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const minCubes = age_band === "4-5" ? 3 : 4;
    const maxExtra = age_band === "4-5" ? 2 : 4;
    const targetCubeCount = minCubes + rng.nextInt(maxExtra);

    const model: CubeCoord[] = [{ x: 0, y: 0, z: 0 }];
    const occupied = new Set<string>(["0,0,0"]);

    const colorTokens = ["berry", "amber", "mint", "sky", "violet", "peach"];
    const chosenColor = pickOne(rng, colorTokens);

    let attempts = 0;
    while (model.length < targetCubeCount && attempts < 100) {
      attempts++;
      const baseCube = pickOne(rng, model);
      const candidates: Array<{ x: number; y: number; z: number }> = [
        { x: baseCube.x + 1, y: baseCube.y, z: baseCube.z },
        { x: baseCube.x - 1, y: baseCube.y, z: baseCube.z },
        { x: baseCube.x, y: baseCube.y + 1, z: baseCube.z },
        { x: baseCube.x, y: baseCube.y - 1, z: baseCube.z },
        { x: baseCube.x, y: baseCube.y, z: baseCube.z + 1 },
      ];

      const validCandidates = candidates.filter((c) => {
        if (c.x < 0 || c.x > 3 || c.y < 0 || c.y > 3 || c.z < 0 || c.z > 3) {
          return false;
        }
        if (occupied.has(`${c.x},${c.y},${c.z}`)) {
          return false;
        }
        // Kiểm tra không lơ lửng nếu z > 0
        if (c.z > 0 && !occupied.has(`${c.x},${c.y},${c.z - 1}`)) {
          return false;
        }
        return true;
      });

      if (validCandidates.length > 0) {
        const nextCoord = pickOne(rng, validCandidates);
        model.push({ ...nextCoord, colorToken: chosenColor });
        occupied.add(`${nextCoord.x},${nextCoord.y},${nextCoord.z}`);
      }
    }

    const correctCount = model.length;
    const nouns = getNouns(vocabulary, 4);
    const sampledNouns = sampleUnique(rng, nouns, 3);

    const optionCount = age_band === "4-5" ? 3 : 4;
    const distractorDeltas = [-2, -1, 1, 2, 3].filter(
      (d) => correctCount + d > 0 && correctCount + d <= 10
    );
    const sampledDeltas = sampleUnique(rng, distractorDeltas, optionCount - 1);

    const distractorCounts = sampledDeltas.map((d) => correctCount + d);
    const allCounts = [correctCount, ...distractorCounts];
    const shuffledCounts = sampleUnique(rng, allCounts, allCounts.length);

    const defaultNoun = nouns[0] ?? {
      emoji_ref: "EMJ-star",
      label_vi: "ngôi sao",
    };
    const options = shuffledCounts.map((count, idx) => {
      const noun =
        sampledNouns[idx % (sampledNouns.length || 1)] ?? defaultNoun;
      return {
        option_id: `opt_${idx + 1}`,
        asset: { kind: "emoji" as const, ref: noun.emoji_ref },
        is_correct: count === correctCount,
      };
    });

    return {
      content_pack: {
        prompt: `Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé! (Có ${correctCount} khối)`,
        model,
        question: "count_cubes" as const,
        options,
      },
      difficulty_params: {
        hidden_cube_count: model.filter((c) => c.z > 0).length > 0 ? 1 : 0,
        distractor_count: options.length - 1,
        allow_rotate: age_band === "5-6",
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
