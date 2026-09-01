import type {
  GT032Cup,
  GT032CupShape,
  GT032QuestionType,
} from "#src/templates/GT-032/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const SHAPES: GT032CupShape[] = [
  "standard",
  "narrow_tall",
  "wide_short",
  "fluted",
];
const COLORS = ["sky", "mint", "berry", "amber"];

export const GT032Generator: LevelGenerator = {
  engine: "GT-032",
  axes: {
    age_band: ["5-6"],
    what: ["capacity", "quantity", "size"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band }) {
    const isTrap = rng.nextInt(2) === 1;
    let qType: GT032QuestionType = "more";
    if (isTrap) {
      qType = "same";
    } else if (rng.nextInt(2) === 0) {
      qType = "more";
    } else {
      qType = "less";
    }
    const cupCount = 2 + rng.nextInt(2); // 2 or 3 cups

    const cups: GT032Cup[] = [];
    const color = COLORS[rng.nextInt(COLORS.length)] ?? "sky";

    if (isTrap) {
      // Conservation trap: 2 cups with same fill_units and capacity_units, but different shapes
      const targetFill = 3 + rng.nextInt(4); // 3, 4, 5, 6
      const capacity = targetFill + 2 + rng.nextInt(3); // targetFill + 2..4

      cups.push({
        cup_id: "cup_1",
        shape: "narrow_tall",
        capacity_units: capacity,
        fill_units: targetFill,
        color,
      });

      cups.push({
        cup_id: "cup_2",
        shape: "wide_short",
        capacity_units: capacity,
        fill_units: targetFill,
        color,
      });

      if (cupCount === 3) {
        const diffFill = Math.max(1, targetFill - 2);
        cups.push({
          cup_id: "cup_3",
          shape: "standard",
          capacity_units: capacity,
          fill_units: diffFill,
          color,
        });
      }
    } else {
      // Non-trap: distinct fill levels
      const capacity = 8;
      const fills = [2, 4, 6];
      for (let i = 0; i < cupCount; i++) {
        const shape = SHAPES[i % SHAPES.length] ?? "standard";
        cups.push({
          cup_id: `cup_${i + 1}`,
          shape,
          capacity_units: capacity,
          fill_units: fills[i] ?? i + 2,
          color,
        });
      }
    }

    let prompt = "Bé hãy chạm vào chiếc cốc có nhiều nước nhất nhé!";
    if (qType === "less") {
      prompt = "Bé hãy chạm vào chiếc cốc có ít nước nhất nhé!";
    } else if (qType === "same") {
      prompt = "Bé hãy chạm vào chiếc cốc có lượng nước bằng nhau nhé!";
    }

    return {
      content_pack: {
        prompt,
        cups,
        question_type: qType,
        conservation_trap: isTrap,
      },
      difficulty_params: {
        cup_count: cups.length,
        level_steps: 8,
        conservation_trap: isTrap,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
