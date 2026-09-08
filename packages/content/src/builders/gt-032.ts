import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng } from "./utils.js";

interface CupItem {
  cup_id: string;
  shape: "standard" | "narrow_tall" | "wide_short" | "fluted";
  capacity_units: number;
  fill_units: number;
  color: string;
}

function buildCups(
  cupCount: number,
  isTrap: boolean,
  rng: ReturnType<typeof createRng>
): {
  cups: CupItem[];
  question_type: "more" | "less" | "same" | "pour_to_mark";
  prompt: string;
} {
  if (isTrap) {
    const targetFill = 2 + rng.nextInt(3); // 2..4
    const cups: CupItem[] = [
      {
        cup_id: "cup_1",
        shape: "narrow_tall",
        capacity_units: 8,
        fill_units: targetFill,
        color: "sky",
      },
      {
        cup_id: "cup_2",
        shape: "wide_short",
        capacity_units: 8,
        fill_units: targetFill,
        color: "sky",
      },
    ];
    if (cupCount >= 3) {
      cups.push({
        cup_id: "cup_3",
        shape: "standard",
        capacity_units: 8,
        fill_units: Math.max(1, targetFill - 1),
        color: "sky",
      });
    }
    if (cupCount >= 4) {
      cups.push({
        cup_id: "cup_4",
        shape: "fluted",
        capacity_units: 8,
        fill_units: targetFill + 2,
        color: "sky",
      });
    }
    return {
      cups: cups.slice(0, cupCount),
      question_type: "same",
      prompt: "Bé hãy chọn chiếc cốc có lượng nước bằng nhau nhé!",
    };
  }

  const cups: CupItem[] = Array.from({ length: cupCount }, (_, i) => ({
    cup_id: `cup_${i + 1}`,
    shape: "standard",
    capacity_units: 10,
    fill_units: 2 + i * 2,
    color: "sky",
  }));

  return {
    cups,
    question_type: "more",
    prompt: "Bé hãy chọn chiếc cốc có nhiều nước hơn nhé!",
  };
}

export const projectGT032: Projection<"GT-032"> = {
  template: "GT-032",
  requires: { min_items: 0, max_items: 10 },
  project(_dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-032", opts.difficulty);
    const trap = params.conservation_trap ?? false;

    const { cups, question_type, prompt } = buildCups(
      params.item_count,
      trap,
      rng
    );

    return {
      content_pack: {
        prompt,
        cups,
        question_type,
        conservation_trap: trap,
      },
      difficulty_params: {
        item_count: params.item_count,
        cup_count: params.cup_count ?? cups.length,
        level_steps: params.level_steps ?? 3,
        conservation_trap: trap,
        allow_retry: true,
      },
    };
  },
};
