import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng } from "./utils.js";

export const projectGT032: Projection<"GT-032"> = {
  template: "GT-032",
  requires: { min_items: 0, max_items: 10 },
  project(_dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const fill1 = 2 + rng.nextInt(3); // 2..4
    const fill2 = fill1 + 2; // fill1 + 2

    const cups = [
      {
        cup_id: "cup_1",
        shape: "standard" as const,
        capacity_units: 8,
        fill_units: fill1,
        color: "sky",
      },
      {
        cup_id: "cup_2",
        shape: "standard" as const,
        capacity_units: 8,
        fill_units: fill2,
        color: "sky",
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy chọn chiếc cốc có nhiều nước hơn nhé!",
        cups,
        question_type: "more" as const,
        conservation_trap: false,
      },
      difficulty_params: {
        allow_retry: true,
      },
    };
  },
};
