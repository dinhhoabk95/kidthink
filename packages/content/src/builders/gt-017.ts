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
    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const cubeCount = 2 + rng.nextInt(3); // 2..4 cubes (bounds x <= 3)

    const model = [{ x: 0, y: 0, z: 0, colorToken: "primary" }];
    for (let i = 1; i < cubeCount; i++) {
      model.push({ x: i, y: 0, z: 0, colorToken: "primary" });
    }

    const options = shuffleDeterministic(
      [
        {
          option_id: `opt_${cubeCount}`,
          asset: { kind: "text" as const, text: `${cubeCount}` },
          is_correct: true,
        },
        {
          option_id: `opt_${cubeCount + 1}`,
          asset: { kind: "text" as const, text: `${cubeCount + 1}` },
          is_correct: false,
        },
        {
          option_id: `opt_${Math.max(1, cubeCount - 1)}`,
          asset: {
            kind: "text" as const,
            text: `${Math.max(1, cubeCount - 1)}`,
          },
          is_correct: false,
        },
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
        hidden_cube_count: 0,
        distractor_count: 2,
        allow_rotate: false,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
