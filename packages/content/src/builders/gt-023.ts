import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetAsset,
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  createRng,
  safeGetItem,
  sanitizeChildPrompt,
  shuffleDeterministic,
  visualAssetKey,
} from "./utils.js";

interface ModelPart {
  readonly x: number;
  readonly y: number;
  readonly ref: string;
  readonly name: string;
}

interface ConstructModel {
  readonly name: string;
  readonly ref: string;
  readonly parts: readonly ModelPart[];
}

/**
 * Mô hình ghép của khuôn (`BR-E023-12`, vật khung `BR-SDS-17`): mỗi mô hình là
 * các mảnh **khác hình mô hình** và có ít nhất hai loại mảnh, đứng đúng chỗ của
 * nó trong hình (mái trên thân, bánh dưới thân). Mảnh cùng hình (hai bánh xe)
 * thay nhau được theo `BR-E023-04`.
 */
export const GT023_MODELS: Readonly<Record<number, readonly ConstructModel[]>> =
  {
    2: [
      {
        name: "ngôi nhà",
        ref: "🏠",
        parts: [
          { x: 480, y: 190, ref: "🔺", name: "mái nhà" },
          { x: 480, y: 310, ref: "🟫", name: "thân nhà" },
        ],
      },
      {
        name: "cái cây",
        ref: "🌳",
        parts: [
          { x: 480, y: 190, ref: "🟢", name: "tán lá" },
          { x: 480, y: 310, ref: "🟫", name: "thân cây" },
        ],
      },
    ],
    3: [
      {
        name: "xe ô tô",
        ref: "🚗",
        parts: [
          { x: 480, y: 230, ref: "🟥", name: "thân xe" },
          { x: 400, y: 330, ref: "⚫", name: "bánh xe" },
          { x: 560, y: 330, ref: "⚫", name: "bánh xe" },
        ],
      },
      {
        name: "người tuyết",
        ref: "⛄",
        parts: [
          { x: 480, y: 130, ref: "🎩", name: "cái mũ" },
          { x: 480, y: 230, ref: "⚪", name: "đầu người tuyết" },
          { x: 480, y: 340, ref: "⚪", name: "thân người tuyết" },
        ],
      },
    ],
    4: [
      {
        name: "tên lửa",
        ref: "🚀",
        parts: [
          { x: 480, y: 120, ref: "🔺", name: "mũi tên lửa" },
          { x: 480, y: 220, ref: "🔵", name: "cửa sổ" },
          { x: 480, y: 320, ref: "⬜", name: "thân tên lửa" },
          { x: 480, y: 420, ref: "🔥", name: "ngọn lửa" },
        ],
      },
      {
        name: "xe tải",
        ref: "🚚",
        parts: [
          { x: 380, y: 230, ref: "🟦", name: "buồng lái" },
          { x: 560, y: 230, ref: "🟧", name: "thùng xe" },
          { x: 380, y: 330, ref: "⚫", name: "bánh xe" },
          { x: 560, y: 330, ref: "⚫", name: "bánh xe" },
        ],
      },
    ],
    6: [
      {
        name: "đoàn tàu",
        ref: "🚂",
        parts: [
          { x: 320, y: 240, ref: "🟥", name: "đầu tàu" },
          { x: 480, y: 240, ref: "🟦", name: "toa xanh" },
          { x: 640, y: 240, ref: "🟩", name: "toa lá" },
          { x: 320, y: 340, ref: "⚫", name: "bánh xe" },
          { x: 480, y: 340, ref: "⚫", name: "bánh xe" },
          { x: 640, y: 340, ref: "⚫", name: "bánh xe" },
        ],
      },
    ],
    8: [
      {
        name: "đoàn tàu dài",
        ref: "🚂",
        parts: [
          { x: 240, y: 240, ref: "🟥", name: "đầu tàu" },
          { x: 400, y: 240, ref: "🟦", name: "toa xanh" },
          { x: 560, y: 240, ref: "🟩", name: "toa lá" },
          { x: 720, y: 240, ref: "🟨", name: "toa vàng" },
          { x: 240, y: 340, ref: "⚫", name: "bánh xe" },
          { x: 400, y: 340, ref: "⚫", name: "bánh xe" },
          { x: 560, y: 340, ref: "⚫", name: "bánh xe" },
          { x: 720, y: 340, ref: "⚫", name: "bánh xe" },
        ],
      },
    ],
  };

/** Mô hình "đoàn tàu số" cho dataset dạy chữ số (`BR-E023-12`). */
export const GT023_NUMBER_TRAIN = { name: "đoàn tàu số", ref: "🚃" } as const;

function getAnchorPositions(count: number): Array<{ x: number; y: number }> {
  if (count <= 4) {
    const spacing = 720 / (count + 1);
    return Array.from({ length: count }, (_, i) => ({
      x: Math.round(120 + spacing * (i + 1)),
      y: 270,
    }));
  }
  const cols = Math.ceil(count / 2);
  const spacing = 720 / (cols + 1);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      x: Math.round(120 + spacing * (col + 1)),
      y: row === 0 ? 190 : 350,
    };
  });
}

interface BuiltPart {
  readonly x: number;
  readonly y: number;
  readonly asset: DatasetAsset;
  readonly name: string;
}

interface BuiltModel {
  readonly name: string;
  readonly asset: DatasetAsset;
  readonly prompt: string;
  readonly parts: readonly BuiltPart[];
}

/**
 * Dataset dạy chữ số (vật có `glyph` và `value`): các toa mang chữ số khác nhau,
 * xếp từ bé đến lớn — glyph hiện ra theo `BR-SDS-03`.
 */
function numberTrain(
  dataset: SkillDataset,
  count: number,
  rng: ReturnType<typeof createRng>
): BuiltModel | null {
  const byValue = new Map<number, DatasetItem>();
  for (const item of dataset.items) {
    if (
      item.glyph &&
      typeof item.value === "number" &&
      !byValue.has(item.value)
    ) {
      byValue.set(item.value, item);
    }
  }
  if (byValue.size < count) {
    return null;
  }
  const chosen = shuffleDeterministic([...byValue.values()], rng)
    .slice(0, count)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
  const positions = getAnchorPositions(count);
  return {
    name: GT023_NUMBER_TRAIN.name,
    asset: { kind: "emoji", ref: GT023_NUMBER_TRAIN.ref },
    prompt: "Bé ghép toa số theo thứ tự từ bé đến lớn nhé!",
    parts: chosen.map((item, i) => {
      const pos = safeGetItem(positions, i);
      return {
        x: pos.x,
        y: pos.y,
        asset: { kind: "text", text: item.glyph ?? item.label },
        name: `toa số ${item.label}`,
      };
    }),
  };
}

function catalogModel(
  count: number,
  rng: ReturnType<typeof createRng>
): BuiltModel {
  const pool = GT023_MODELS[count];
  if (!pool || pool.length === 0) {
    throw new Error(`[BR-E023-12] Không có mô hình ghép ${count} mảnh`);
  }
  const model = safeGetItem(pool, rng.nextInt(pool.length));
  return {
    name: model.name,
    asset: { kind: "emoji", ref: model.ref },
    prompt: sanitizeChildPrompt(
      `Bé thử ghép các mảnh gỗ thành ${model.name} nhé!`,
      "Bé ghép các mảnh thành hình hoàn chỉnh nhé!"
    ),
    parts: model.parts.map((p) => ({
      x: p.x,
      y: p.y,
      asset: { kind: "emoji", ref: p.ref },
      name: p.name,
    })),
  };
}

export const projectGT023: Projection<"GT-023"> = {
  template: "GT-023",
  requires: { min_items: 2, max_items: 6 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-023`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-023", opts.difficulty);
    const model =
      numberTrain(dataset, params.item_count, rng) ??
      catalogModel(params.item_count, rng);

    const targetKey = visualAssetKey(model.asset);
    if (model.parts.some((p) => visualAssetKey(p.asset) === targetKey)) {
      throw new Error(
        `[BR-E023-12] Mô hình ${model.name} có mảnh trùng hình mô hình`
      );
    }

    const anchors = model.parts.map((p, i) => ({
      anchor_id: `a${i + 1}`,
      x: p.x,
      y: p.y,
      accepted_part_id: `p${i + 1}`,
      label: p.name,
    }));

    const parts = model.parts.map((p, i) => ({
      part_id: `p${i + 1}`,
      target_anchor_id: `a${i + 1}`,
      asset: p.asset,
      name: p.name,
    }));

    return {
      content_pack: {
        prompt: model.prompt,
        target_model: {
          name: model.name,
          asset: model.asset,
        },
        anchors,
        parts: shuffleDeterministic(parts, rng),
      },
      difficulty_params: {
        item_count: parts.length,
        snap_radius_px: params.snap_radius_px ?? 40,
        show_anchor_outline: params.show_anchor_outline ?? true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
