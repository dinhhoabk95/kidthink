import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, safeGetItem, shuffleDeterministic } from "./utils.js";

type CardShape = "circle" | "square";

interface ColorCards {
  readonly color: string;
  readonly name_vi: string;
  readonly circle: string;
  readonly square: string;
}

/**
 * Thẻ đổi luật (`BR-E027-08`, vật khung `BR-SDS-17`): mỗi thẻ là hình **mang
 * sẵn màu** trong chính asset (🔴 là tròn đỏ, 🟦 là vuông xanh). Cấm — NEVER
 * gán màu tuỳ ý cho ảnh không mang màu (🎁 "màu xanh" chỉ là chấm 10 px).
 */
export const GT027_COLOR_CARDS: readonly ColorCards[] = [
  { color: "red", name_vi: "màu đỏ", circle: "🔴", square: "🟥" },
  { color: "blue", name_vi: "màu xanh biển", circle: "🔵", square: "🟦" },
  { color: "yellow", name_vi: "màu vàng", circle: "🟡", square: "🟨" },
  { color: "green", name_vi: "màu xanh lá", circle: "🟢", square: "🟩" },
  { color: "orange", name_vi: "màu cam", circle: "🟠", square: "🟧" },
  { color: "purple", name_vi: "màu tím", circle: "🟣", square: "🟪" },
];

const SHAPE_NAME_VI: Readonly<Record<CardShape, string>> = {
  circle: "hình tròn",
  square: "hình vuông",
};

/** Câu mở vòng: nói luật đầu (`BR-E027-09`). */
export function gt027OpeningLine(valueVi: string): string {
  return `Bé chọn các ${valueVi} nhé!`;
}

/** Lời đọc luật mới, phát sau tiếng còi (`BR-E027-09`). */
export function gt027SwitchLine(valueVi: string): string {
  return `Luật mới! Bé chọn các ${valueVi} nhé!`;
}

function buildRuleSwitchItems(
  itemCount: number,
  colors: readonly [ColorCards, ColorCards]
) {
  const shapes: readonly CardShape[] = ["circle", "square"];
  return Array.from({ length: itemCount }, (_, i) => {
    const color = colors[i % 2] ?? colors[0];
    const shape = shapes[Math.floor(i / 2) % 2] ?? "circle";
    return {
      id: `${shape}_${color.color}_${i + 1}`,
      asset: { kind: "emoji" as const, ref: color[shape] },
      color: color.color,
      shape,
      size: "medium",
    };
  });
}

export const projectGT027: Projection<"GT-027"> = {
  template: "GT-027",
  requires: { min_items: 4, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-027 đòi hỏi tối thiểu 2 vật`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-027", opts.difficulty);
    const pickedColors = shuffleDeterministic(GT027_COLOR_CARDS, rng);
    const colorA = safeGetItem(pickedColors, 0);
    const colorB = safeGetItem(pickedColors, 1);
    const targetShape: CardShape = rng.nextInt(2) === 0 ? "circle" : "square";
    const shapeVi = SHAPE_NAME_VI[targetShape];

    // `BR-E027-09`: prompt nói luật đầu; `signal_audio_text` là lời đọc sau còi.
    const rules = [
      {
        id: "rule_shape",
        name: "Theo hình dạng",
        description: `Chọn ${shapeVi}`,
        dimension: "shape" as const,
        target_value: targetShape,
        signal_text: `Hãy chọn ${shapeVi}`,
        signal_audio_text: gt027SwitchLine(shapeVi),
      },
      {
        id: "rule_color",
        name: "Theo màu sắc",
        description: `Chọn ${colorA.name_vi}`,
        dimension: "color" as const,
        target_value: colorA.color,
        signal_text: `Đổi quy luật: hãy chọn ${colorA.name_vi}`,
        signal_audio_text: gt027SwitchLine(`hình ${colorA.name_vi}`),
      },
    ];

    const rawItems = buildRuleSwitchItems(params.item_count, [colorA, colorB]);
    const items = shuffleDeterministic(rawItems, rng);

    return {
      content_pack: {
        prompt: gt027OpeningLine(shapeVi),
        rules,
        items,
        switch_after_trials: 2,
      },
      difficulty_params: {
        item_count: params.item_count,
        target_count: params.target_count ?? 2,
        signal_duration_ms: params.signal_duration_ms ?? 3000,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
