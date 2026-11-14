import type { AgeBand } from "#src/contracts/types";
import type {
  GT037Content,
  GT037Difficulty,
  GT037Symbol,
} from "#src/templates/GT-037/template";
import { sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface TierConfig {
  readonly itemCount: number;
  readonly targetCopies: number;
  readonly rotationJitter: boolean;
  readonly finishMode: "auto" | "declare";
  readonly showTargetCounter: boolean;
  readonly confusableCount: number;
}

const NUMBER_POOL: readonly GT037Symbol[] = [
  {
    id: "num_3",
    label: "số 3",
    asset: { kind: "text", text: "3" },
    orientation_free: false,
  },
  {
    id: "num_8",
    label: "số 8",
    asset: { kind: "text", text: "8" },
    orientation_free: false,
  },
  {
    id: "num_6",
    label: "số 6",
    asset: { kind: "text", text: "6" },
    orientation_free: false,
  },
  {
    id: "num_9",
    label: "số 9",
    asset: { kind: "text", text: "9" },
    orientation_free: false,
  },
  {
    id: "num_2",
    label: "số 2",
    asset: { kind: "text", text: "2" },
    orientation_free: false,
  },
  {
    id: "num_5",
    label: "số 5",
    asset: { kind: "text", text: "5" },
    orientation_free: false,
  },
  {
    id: "num_4",
    label: "số 4",
    asset: { kind: "text", text: "4" },
    orientation_free: false,
  },
  {
    id: "num_7",
    label: "số 7",
    asset: { kind: "text", text: "7" },
    orientation_free: false,
  },
];

const LETTER_POOL: readonly GT037Symbol[] = [
  {
    id: "let_a",
    label: "chữ A",
    asset: { kind: "text", text: "A" },
    orientation_free: false,
  },
  {
    id: "let_b",
    label: "chữ B",
    asset: { kind: "text", text: "B" },
    orientation_free: false,
  },
  {
    id: "let_d",
    label: "chữ D",
    asset: { kind: "text", text: "D" },
    orientation_free: false,
  },
  {
    id: "let_p",
    label: "chữ P",
    asset: { kind: "text", text: "P" },
    orientation_free: false,
  },
  {
    id: "let_c",
    label: "chữ C",
    asset: { kind: "text", text: "C" },
    orientation_free: false,
  },
  {
    id: "let_e",
    label: "chữ E",
    asset: { kind: "text", text: "E" },
    orientation_free: false,
  },
  {
    id: "let_h",
    label: "chữ H",
    asset: { kind: "text", text: "H" },
    orientation_free: false,
  },
  {
    id: "let_m",
    label: "chữ M",
    asset: { kind: "text", text: "M" },
    orientation_free: false,
  },
];

const GEOMETRY_POOL: readonly GT037Symbol[] = [
  {
    id: "geo_star",
    label: "ngôi sao",
    asset: { kind: "emoji", ref: "⭐" },
    orientation_free: true,
  },
  {
    id: "geo_diamond",
    label: "hình thoi",
    asset: { kind: "emoji", ref: "🔷" },
    orientation_free: true,
  },
  {
    id: "geo_heart",
    label: "trái tim",
    asset: { kind: "emoji", ref: "❤️" },
    orientation_free: false,
  },
  {
    id: "geo_circle",
    label: "hình tròn",
    asset: { kind: "emoji", ref: "🟢" },
    orientation_free: true,
  },
  {
    id: "geo_square",
    label: "hình vuông",
    asset: { kind: "emoji", ref: "🟦" },
    orientation_free: true,
  },
  {
    id: "geo_orange",
    label: "hình thoi cam",
    asset: { kind: "emoji", ref: "🔶" },
    orientation_free: true,
  },
  {
    id: "geo_purple",
    label: "hình tròn tím",
    asset: { kind: "emoji", ref: "🟣" },
    orientation_free: true,
  },
  {
    id: "geo_yellow",
    label: "hình tròn vàng",
    asset: { kind: "emoji", ref: "🟡" },
    orientation_free: true,
  },
];

const COLOUR_POOL: readonly GT037Symbol[] = [
  {
    id: "col_red",
    label: "màu đỏ",
    asset: { kind: "emoji", ref: "🔴" },
    orientation_free: true,
  },
  {
    id: "col_blue",
    label: "màu xanh dương",
    asset: { kind: "emoji", ref: "🔵" },
    orientation_free: true,
  },
  {
    id: "col_green",
    label: "màu xanh lá",
    asset: { kind: "emoji", ref: "🟢" },
    orientation_free: true,
  },
  {
    id: "col_yellow",
    label: "màu vàng",
    asset: { kind: "emoji", ref: "🟡" },
    orientation_free: true,
  },
  {
    id: "col_purple",
    label: "màu tím",
    asset: { kind: "emoji", ref: "🟣" },
    orientation_free: true,
  },
  {
    id: "col_orange",
    label: "màu cam",
    asset: { kind: "emoji", ref: "🟠" },
    orientation_free: true,
  },
  {
    id: "col_brown",
    label: "màu nâu",
    asset: { kind: "emoji", ref: "🟤" },
    orientation_free: true,
  },
  {
    id: "col_white",
    label: "màu trắng",
    asset: { kind: "emoji", ref: "⚪" },
    orientation_free: true,
  },
];

const OBJECT_POOL: readonly GT037Symbol[] = [
  {
    id: "obj_apple",
    label: "quả táo",
    asset: { kind: "emoji", ref: "🍎" },
    orientation_free: true,
  },
  {
    id: "obj_orange",
    label: "quả cam",
    asset: { kind: "emoji", ref: "🍊" },
    orientation_free: true,
  },
  {
    id: "obj_berry",
    label: "quả dâu",
    asset: { kind: "emoji", ref: "🍓" },
    orientation_free: true,
  },
  {
    id: "obj_flower",
    label: "bông hoa",
    asset: { kind: "emoji", ref: "🌸" },
    orientation_free: true,
  },
  {
    id: "obj_clover",
    label: "cỏ bốn lá",
    asset: { kind: "emoji", ref: "🍀" },
    orientation_free: true,
  },
  {
    id: "obj_butterfly",
    label: "bướm",
    asset: { kind: "emoji", ref: "🦋" },
    orientation_free: true,
  },
  {
    id: "obj_shell",
    label: "vỏ sò",
    asset: { kind: "emoji", ref: "🐚" },
    orientation_free: true,
  },
  {
    id: "obj_grape",
    label: "chùm nho",
    asset: { kind: "emoji", ref: "🍇" },
    orientation_free: true,
  },
];

const POOLS_BY_WHAT: Readonly<Record<string, readonly GT037Symbol[]>> = {
  number: NUMBER_POOL,
  letter: LETTER_POOL,
  geometry: GEOMETRY_POOL,
  colour: COLOUR_POOL,
  object: OBJECT_POOL,
};

function resolveTier(
  ageBand: AgeBand,
  escalationStep: number | undefined
): TierConfig {
  const step = escalationStep ?? 0;
  if (ageBand === "4-5") {
    if (step <= 0) {
      return {
        itemCount: 12,
        targetCopies: 3,
        rotationJitter: false,
        finishMode: "auto",
        showTargetCounter: true,
        confusableCount: 0,
      };
    }
    if (step === 1) {
      return {
        itemCount: 14,
        targetCopies: 4,
        rotationJitter: false,
        finishMode: "auto",
        showTargetCounter: true,
        confusableCount: 1,
      };
    }
    return {
      itemCount: 16,
      targetCopies: 4,
      rotationJitter: false,
      finishMode: "auto",
      showTargetCounter: true,
      confusableCount: 2,
    };
  }

  if (step <= 0) {
    return {
      itemCount: 15,
      targetCopies: 4,
      rotationJitter: true,
      finishMode: "auto",
      showTargetCounter: true,
      confusableCount: 1,
    };
  }
  if (step === 1) {
    return {
      itemCount: 18,
      targetCopies: 5,
      rotationJitter: true,
      finishMode: "auto",
      showTargetCounter: true,
      confusableCount: 2,
    };
  }
  return {
    itemCount: 20,
    targetCopies: 5,
    rotationJitter: true,
    finishMode: "declare",
    showTargetCounter: false,
    confusableCount: 2,
  };
}

export const GT037Generator: LevelGenerator<GT037Content, GT037Difficulty> = {
  engine: "GT-037",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number", "geometry", "colour", "letter", "object"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate(input) {
    const pool = POOLS_BY_WHAT[input.what ?? "object"] ?? OBJECT_POOL;
    const tier = resolveTier(input.age_band, input.escalation_step);
    const chosen = sampleUnique(input.rng, [...pool], Math.min(pool.length, 6));
    const target = chosen[0] ?? pool[0];
    if (!target) {
      throw new Error("GT037Generator: empty symbol pool");
    }
    const distractors = chosen.slice(1);
    const confusableIds = distractors
      .slice(0, Math.min(tier.confusableCount, distractors.length))
      .map((s) => s.id);
    const label = target.label ?? target.id;
    const contentPack: GT037Content = {
      prompt: `Con tìm hết ${label} nhé`,
      symbols: [...chosen],
      target_ids: [target.id],
      target_copies: tier.targetCopies,
      item_count: tier.itemCount,
      confusable_ids: confusableIds,
    };
    const difficultyParams: GT037Difficulty = {
      item_count: tier.itemCount,
      target_copies: tier.targetCopies,
      rotation_jitter: tier.rotationJitter,
      allow_retry: true,
      show_target_counter: tier.showTargetCounter,
      finish_mode: tier.finishMode,
      hint_after_ms: input.age_band === "4-5" ? 8000 : 10_000,
    };
    return {
      content_pack: contentPack,
      difficulty_params: difficultyParams,
      seed: input.rng.nextInt(1_000_000) + 1,
    };
  },
};
