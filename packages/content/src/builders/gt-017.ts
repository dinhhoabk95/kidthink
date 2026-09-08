import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, shuffleDeterministic } from "./utils.js";

export const projectGT017: Projection<"GT-017"> = {
  template: "GT-017",
  requires: { min_items: 0, max_items: 10 },
  project(_dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const params = getEngineDifficultyParams("GT-017", opts.difficulty);
    const expectedItemCount = params.item_count;
    const hiddenCubeCount =
      (params as { hidden_cube_count?: number }).hidden_cube_count ?? 0;
    const distractorCount =
      params.distractor_count ?? Math.max(1, expectedItemCount - 1);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const cubeCount = 2 + Math.min(opts.difficulty, 3) + hiddenCubeCount;

    const model: Array<{
      x: number;
      y: number;
      z: number;
      colorToken: string;
    }> = [];
    for (let i = 0; i < cubeCount; i++) {
      model.push({
        x: i % 3,
        y: Math.floor(i / 3),
        z: 0,
        colorToken: "primary",
      });
    }

    const distractorValues = new Set<number>();
    let offset = 1;
    while (distractorValues.size < distractorCount) {
      if (cubeCount + offset <= 10) {
        distractorValues.add(cubeCount + offset);
      }
      if (distractorValues.size < distractorCount && cubeCount - offset >= 1) {
        distractorValues.add(cubeCount - offset);
      }
      offset++;
    }

    const options = shuffleDeterministic(
      [
        {
          option_id: `opt_${cubeCount}`,
          asset: { kind: "text" as const, text: `${cubeCount}` },
          is_correct: true,
        },
        ...Array.from(distractorValues).map((val) => ({
          option_id: `opt_${val}`,
          asset: { kind: "text" as const, text: `${val}` },
          is_correct: false,
        })),
      ],
      rng
    );

    return {
      content_pack: {
        prompt: "Bé hãy đếm xem có bao nhiêu khối lập phương nhé!",
        model,
        question: "count_cubes" as const,
        options,
      },
      difficulty_params: {
        item_count: expectedItemCount,
        hidden_cube_count: hiddenCubeCount,
        distractor_count: distractorCount,
        allow_rotate: false,
        hint_after_ms: params.hint_after_ms ?? 8000,
        allow_retry: params.allow_retry ?? true,
      },
    };
  },
};
