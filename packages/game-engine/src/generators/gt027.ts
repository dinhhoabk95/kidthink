import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import type {
  GT027Content,
  GT027Difficulty,
} from "#src/templates/GT-027/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

type Dimension = "color" | "shape" | "size";

interface CriterionOption {
  readonly dimension: Dimension;
  readonly value: string;
  readonly nameVi: string;
  readonly descVi: string;
  readonly signalVi: string;
  readonly audioVi: string;
}

const COLOR_OPTIONS: readonly [CriterionOption, ...CriterionOption[]] = [
  {
    dimension: "color",
    value: "red",
    nameVi: "Luật màu đỏ",
    descVi: "Tìm các hình có màu đỏ",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình màu đỏ nhé!",
    audioVi: "Đổi luật, chọn hình màu đỏ",
  },
  {
    dimension: "color",
    value: "blue",
    nameVi: "Luật màu xanh biển",
    descVi: "Tìm các hình có màu xanh biển",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình màu xanh biển nhé!",
    audioVi: "Đổi luật, chọn hình màu xanh biển",
  },
  {
    dimension: "color",
    value: "yellow",
    nameVi: "Luật màu vàng",
    descVi: "Tìm các hình có màu vàng",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình màu vàng nhé!",
    audioVi: "Đổi luật, chọn hình màu vàng",
  },
  {
    dimension: "color",
    value: "green",
    nameVi: "Luật màu xanh lá",
    descVi: "Tìm các hình có màu xanh lá",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình màu xanh lá nhé!",
    audioVi: "Đổi luật, chọn hình màu xanh lá",
  },
];

const SHAPE_OPTIONS: readonly [CriterionOption, ...CriterionOption[]] = [
  {
    dimension: "shape",
    value: "circle",
    nameVi: "Luật hình tròn",
    descVi: "Tìm các hình tròn",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn tất cả hình tròn nhé!",
    audioVi: "Đổi luật, chọn hình tròn",
  },
  {
    dimension: "shape",
    value: "square",
    nameVi: "Luật hình vuông",
    descVi: "Tìm các hình vuông",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn tất cả hình vuông nhé!",
    audioVi: "Đổi luật, chọn hình vuông",
  },
  {
    dimension: "shape",
    value: "star",
    nameVi: "Luật hình ngôi sao",
    descVi: "Tìm tất cả hình ngôi sao",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn hình ngôi sao nhé!",
    audioVi: "Đổi luật, chọn hình ngôi sao",
  },
  {
    dimension: "shape",
    value: "triangle",
    nameVi: "Luật hình tam giác",
    descVi: "Tìm các hình tam giác",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn hình tam giác nhé!",
    audioVi: "Đổi luật, chọn hình tam giác",
  },
];

const SIZE_OPTIONS: readonly [CriterionOption, ...CriterionOption[]] = [
  {
    dimension: "size",
    value: "large",
    nameVi: "Luật cỡ lớn",
    descVi: "Tìm các hình cỡ lớn",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình cỡ lớn nhé!",
    audioVi: "Đổi luật, chọn hình cỡ lớn",
  },
  {
    dimension: "size",
    value: "small",
    nameVi: "Luật cỡ nhỏ",
    descVi: "Tìm các hình cỡ nhỏ",
    signalVi: "Đổi luật rồi: Giờ bé hãy chọn các hình cỡ nhỏ nhé!",
    audioVi: "Đổi luật, chọn hình cỡ nhỏ",
  },
];

const ALL_COLORS: readonly [string, ...string[]] = [
  "red",
  "blue",
  "yellow",
  "green",
];
const ALL_SHAPES: readonly [string, ...string[]] = [
  "circle",
  "square",
  "star",
  "triangle",
];
const ALL_SIZES: readonly [string, ...string[]] = ["small", "medium", "large"];

function pickOtherValue(
  pool: readonly [string, ...string[]],
  exclude: string,
  index: number
): string {
  const filtered = pool.filter((v) => v !== exclude);
  return filtered[index % filtered.length] ?? pool[0];
}

function resolveEscalationConfig(step: number): readonly [number, number] {
  if (step >= 5) {
    return [3, 1800];
  }
  if (step >= 4) {
    return [4, 1800];
  }
  if (step >= 2) {
    return [3, 2000];
  }
  return [2, 2200];
}

function selectRuleOptions(rng: Rng, step: number): CriterionOption[] {
  const colorOpt =
    COLOR_OPTIONS[rng.nextInt(COLOR_OPTIONS.length)] ?? COLOR_OPTIONS[0];
  const shapeOpt =
    SHAPE_OPTIONS[rng.nextInt(SHAPE_OPTIONS.length)] ?? SHAPE_OPTIONS[0];
  const sizeOpt =
    SIZE_OPTIONS[rng.nextInt(SIZE_OPTIONS.length)] ?? SIZE_OPTIONS[0];

  if (step >= 5) {
    return [colorOpt, shapeOpt, sizeOpt];
  }
  const pairMode = (step + rng.nextInt(3)) % 3;
  if (pairMode === 0) {
    return [colorOpt, shapeOpt];
  }
  if (pairMode === 1) {
    return [shapeOpt, sizeOpt];
  }
  return [colorOpt, sizeOpt];
}

function applyRuleTarget(
  attrs: { color: string; shape: string; size: string },
  opt: CriterionOption | undefined
): void {
  if (!opt) {
    return;
  }
  if (opt.dimension === "color") {
    attrs.color = opt.value;
  } else if (opt.dimension === "shape") {
    attrs.shape = opt.value;
  } else {
    attrs.size = opt.value;
  }
}

export const GT027Generator: LevelGenerator<GT027Content, GT027Difficulty> = {
  engine: "GT-027",
  axes: {
    age_band: ["5-6"],
    what: ["cognitive-flexibility", "rule-switch", "classification"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary, escalation_step = 0 }) {
    const step = Math.max(0, Math.min(6, escalation_step));
    const [switchAfterTrials, signalDurationMs] = resolveEscalationConfig(step);
    const selectedOpts = selectRuleOptions(rng, step);
    const itemCount =
      selectedOpts.length >= 3
        ? Math.min(10, Math.max(6, switchAfterTrials * 3 + 1))
        : Math.min(10, Math.max(6, switchAfterTrials * 2 + 2));

    const nouns = getNouns(vocabulary, Math.min(4, itemCount));
    const sampled = sampleUnique(rng, nouns, itemCount);

    const rules: GT027Content["rules"] = selectedOpts.map((opt, idx) => ({
      id: `rule_${idx + 1}_${opt.dimension}_${opt.value}`,
      name: opt.nameVi,
      description: idx === 0 ? opt.descVi : `Đổi luật: ${opt.descVi}`,
      dimension: opt.dimension,
      target_value: opt.value,
      signal_text:
        idx === 0
          ? `Luật 1: Bé hãy ${opt.descVi.toLowerCase()} nhé!`
          : opt.signalVi,
      signal_audio_text: opt.audioVi,
    }));

    const targetColor =
      selectedOpts.find((o) => o.dimension === "color")?.value ?? "red";
    const targetShape =
      selectedOpts.find((o) => o.dimension === "shape")?.value ?? "circle";
    const targetSize =
      selectedOpts.find((o) => o.dimension === "size")?.value ?? "large";

    const rawItems: GT027Content["items"] = [];
    for (let i = 0; i < itemCount; i++) {
      const noun = sampled[i % sampled.length];
      const attrs = {
        color: pickOtherValue(ALL_COLORS, targetColor, i),
        shape: pickOtherValue(ALL_SHAPES, targetShape, i + 1),
        size: pickOtherValue(ALL_SIZES, targetSize, i + 2),
      };

      if (i < switchAfterTrials) {
        applyRuleTarget(attrs, selectedOpts[0]);
      } else if (i < switchAfterTrials * 2) {
        applyRuleTarget(attrs, selectedOpts[1]);
      } else if (selectedOpts.length >= 3 && i < switchAfterTrials * 3) {
        applyRuleTarget(attrs, selectedOpts[2]);
      }

      rawItems.push({
        id: `item_${i + 1}`,
        asset: { kind: "emoji", ref: noun?.emoji_ref ?? "🔴" },
        color: attrs.color,
        shape: attrs.shape,
        size: attrs.size,
      });
    }

    const items = shuffle(rawItems, rng);

    return {
      content_pack: {
        prompt: "Bé hãy chú ý lắng nghe hiệu lệnh để đổi luật phân loại nhé!",
        rules,
        items,
        switch_after_trials: switchAfterTrials,
      },
      difficulty_params: {
        item_count: items.length,
        signal_duration_ms: signalDurationMs,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
