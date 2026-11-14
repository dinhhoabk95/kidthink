import { shuffle } from "#src/rng/shuffle";
import type {
  GT032Content,
  GT032Cup,
  GT032CupShape,
  GT032Difficulty,
  GT032QuestionType,
} from "#src/templates/GT-032/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const SHAPES: readonly GT032CupShape[] = [
  "standard",
  "narrow_tall",
  "wide_short",
  "fluted",
];
const QUESTION_TYPES: readonly GT032QuestionType[] = [
  "more",
  "less",
  "same",
  "pour_to_mark",
];
const TRAP_PAIRS: readonly (readonly [GT032CupShape, GT032CupShape])[] = [
  ["narrow_tall", "wide_short"],
  ["fluted", "standard"],
  ["fluted", "wide_short"],
  ["narrow_tall", "fluted"],
];
const COLORS: readonly string[] = ["sky", "mint", "berry", "amber"];

function promptForQuestion(
  qType: GT032QuestionType,
  targetUnits?: number
): string {
  if (qType === "less") {
    return "Bé hãy chạm vào chiếc cốc có ít nước nhất nhé!";
  }
  if (qType === "same") {
    return "Bé hãy chạm vào hai chiếc cốc có lượng nước bằng nhau nhé!";
  }
  if (qType === "pour_to_mark") {
    const mark = targetUnits ?? 4;
    return `Bé hãy rót nước đến vạch ${mark} cho chiếc cốc nhé!`;
  }
  return "Bé hãy chạm vào chiếc cốc có nhiều nước nhất nhé!";
}

function resolveCupCount(step: number): number {
  if (step >= 5) {
    return 4;
  }
  return step >= 2 ? 3 : 2;
}

function buildPourCups(
  cupCount: number,
  capacity: number,
  step: number,
  color: string,
  firstShape: GT032CupShape
): { cups: GT032Cup[]; targetUnits: number } {
  const targetUnits = Math.min(capacity - 1, 3 + (step % 4));
  const initialFill = Math.max(1, targetUnits - (2 + (step % 2)));
  const cups: GT032Cup[] = [
    {
      cup_id: "cup_1",
      shape: firstShape,
      capacity_units: capacity,
      fill_units: initialFill,
      target_units: targetUnits,
      color,
    },
  ];
  for (let i = 1; i < cupCount; i++) {
    cups.push({
      cup_id: `cup_${i + 1}`,
      shape: SHAPES[(i + 1) % SHAPES.length] ?? "fluted",
      capacity_units: capacity,
      fill_units: targetUnits,
      target_units: targetUnits,
      color,
    });
  }
  return { cups, targetUnits };
}

function buildTrapCups(
  cupCount: number,
  capacity: number,
  qType: GT032QuestionType,
  color: string,
  targetFill: number,
  pair: readonly [GT032CupShape, GT032CupShape]
): GT032Cup[] {
  const cups: GT032Cup[] = [
    {
      cup_id: "cup_1",
      shape: pair[0],
      capacity_units: capacity,
      fill_units: targetFill,
      color,
    },
    {
      cup_id: "cup_2",
      shape: pair[1],
      capacity_units: capacity,
      fill_units: targetFill,
      color,
    },
  ];
  for (let i = 2; i < cupCount; i++) {
    const delta = qType === "less" ? i : -Math.min(targetFill - 1, i);
    const otherFill = Math.max(1, Math.min(capacity, targetFill + delta));
    cups.push({
      cup_id: `cup_${i + 1}`,
      shape: SHAPES[i % SHAPES.length] ?? "standard",
      capacity_units: capacity,
      fill_units: otherFill,
      color,
    });
  }
  return cups;
}

function buildDistinctCups(
  cupCount: number,
  capacity: number,
  step: number,
  color: string
): GT032Cup[] {
  const cups: GT032Cup[] = [];
  for (let i = 0; i < cupCount; i++) {
    cups.push({
      cup_id: `cup_${i + 1}`,
      shape: SHAPES[(i + step) % SHAPES.length] ?? "standard",
      capacity_units: capacity,
      fill_units: Math.min(capacity, 2 + i * 2),
      color,
    });
  }
  return cups;
}

export const GT032Generator: LevelGenerator<GT032Content, GT032Difficulty> = {
  engine: "GT-032",
  axes: {
    age_band: ["5-6"],
    what: ["capacity", "quantity", "size"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, escalation_step }) {
    const step = Math.max(0, Math.min(8, Math.round(escalation_step ?? 0)));
    const qType = QUESTION_TYPES[rng.nextInt(QUESTION_TYPES.length)] ?? "more";
    const isTrap =
      qType !== "pour_to_mark" && (qType === "same" || rng.nextInt(2) === 1);
    const cupCount = resolveCupCount(step);
    const capacity = Math.min(10, 6 + Math.floor(step / 2));
    const color = COLORS[rng.nextInt(COLORS.length)] ?? "sky";

    let cups: GT032Cup[];
    let targetUnits: number | undefined;
    if (qType === "pour_to_mark") {
      const firstShape = SHAPES[rng.nextInt(SHAPES.length)] ?? "standard";
      const built = buildPourCups(cupCount, capacity, step, color, firstShape);
      cups = built.cups;
      targetUnits = built.targetUnits;
    } else if (isTrap) {
      const targetFill = Math.min(capacity - 2, 3 + rng.nextInt(3));
      const pair = TRAP_PAIRS[rng.nextInt(TRAP_PAIRS.length)] ?? [
        "fluted",
        "wide_short",
      ];
      cups = buildTrapCups(cupCount, capacity, qType, color, targetFill, pair);
    } else {
      cups = buildDistinctCups(cupCount, capacity, step, color);
    }

    const orderedCups: GT032Cup[] = shuffle(cups, rng).map((cup, i) => ({
      ...cup,
      cup_id: `cup_${i + 1}`,
    }));

    return {
      content_pack: {
        prompt: promptForQuestion(qType, targetUnits),
        cups: orderedCups,
        question_type: qType,
        ...(targetUnits === undefined ? {} : { target_units: targetUnits }),
        conservation_trap: isTrap,
      },
      difficulty_params: {
        item_count: orderedCups.length,
        cup_count: orderedCups.length,
        level_steps: Math.max(...orderedCups.map((c) => c.capacity_units)),
        conservation_trap: isTrap,
        allow_retry: true,
        hint_after_ms: 8000,
      },
    };
  },
};
