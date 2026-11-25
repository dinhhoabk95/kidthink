import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetAsset,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel } from "@mindkid/shared";
import { createRng, safeGetItem, sanitizeChildPrompt } from "./utils.js";

type UnitPoint = readonly [number, number];

/**
 * Nét viết một nét liền của chữ số và chữ cái thường (`BR-E024-09`), toạ độ
 * trong hộp đơn vị (x sang phải, y xuống dưới), điểm đầu là chỗ đặt bút. Chỉ
 * khai ký hiệu viết được bằng **một** nét không đè chấm: chữ cần hai nét (t, x)
 * hoặc dấu phụ (ă, ê, đ) không có ở đây, bộ chiếu không giả hình cho chúng.
 */
export const GT024_STROKES: Readonly<Record<string, readonly UnitPoint[]>> = {
  "0": [
    [0.5, 0],
    [0.15, 0.2],
    [0.1, 0.5],
    [0.15, 0.8],
    [0.5, 1],
    [0.85, 0.8],
    [0.9, 0.5],
    [0.85, 0.2],
    [0.5, 0],
  ],
  "1": [
    [0.25, 0.2],
    [0.55, 0],
    [0.55, 0.5],
    [0.55, 1],
  ],
  "2": [
    [0.15, 0.2],
    [0.5, 0],
    [0.85, 0.2],
    [0.8, 0.45],
    [0.15, 1],
    [0.9, 1],
  ],
  "3": [
    [0.15, 0.1],
    [0.6, 0],
    [0.85, 0.2],
    [0.5, 0.45],
    [0.85, 0.7],
    [0.6, 1],
    [0.15, 0.9],
  ],
  "4": [
    [0.65, 1],
    [0.65, 0],
    [0.1, 0.7],
    [0.95, 0.7],
  ],
  "5": [
    [0.85, 0],
    [0.2, 0],
    [0.15, 0.45],
    [0.6, 0.4],
    [0.85, 0.65],
    [0.6, 1],
    [0.15, 0.9],
  ],
  "6": [
    [0.75, 0],
    [0.3, 0.25],
    [0.15, 0.65],
    [0.4, 1],
    [0.8, 0.85],
    [0.75, 0.55],
    [0.4, 0.5],
    [0.17, 0.68],
  ],
  "7": [
    [0.1, 0],
    [0.9, 0],
    [0.4, 1],
  ],
  "8": [
    [0.5, 0],
    [0.2, 0.22],
    [0.82, 0.75],
    [0.5, 1],
    [0.18, 0.75],
    [0.8, 0.22],
    [0.5, 0],
  ],
  "9": [
    [0.82, 0.18],
    [0.5, 0],
    [0.18, 0.22],
    [0.35, 0.48],
    [0.82, 0.4],
    [0.82, 1],
  ],
  a: [
    [0.85, 0.45],
    [0.5, 0.3],
    [0.15, 0.65],
    [0.5, 1],
    [0.85, 0.8],
    [0.85, 0.3],
    [0.9, 1],
  ],
  b: [
    [0.2, 0],
    [0.2, 1],
    [0.6, 0.95],
    [0.85, 0.65],
    [0.55, 0.35],
    [0.2, 0.55],
  ],
  c: [
    [0.85, 0.4],
    [0.5, 0.3],
    [0.15, 0.65],
    [0.5, 1],
    [0.85, 0.9],
  ],
  d: [
    [0.8, 0.45],
    [0.45, 0.35],
    [0.15, 0.65],
    [0.45, 1],
    [0.8, 0.8],
    [0.8, 0],
    [0.85, 1],
  ],
  e: [
    [0.15, 0.65],
    [0.85, 0.65],
    [0.6, 0.3],
    [0.2, 0.45],
    [0.3, 0.9],
    [0.85, 0.9],
  ],
  g: [
    [0.8, 0.2],
    [0.45, 0.05],
    [0.15, 0.3],
    [0.45, 0.55],
    [0.8, 0.4],
    [0.8, 0.05],
    [0.8, 0.85],
    [0.5, 1],
    [0.2, 0.9],
  ],
  l: [
    [0.5, 0],
    [0.5, 1],
  ],
  o: [
    [0.5, 0.3],
    [0.15, 0.65],
    [0.5, 1],
    [0.85, 0.65],
    [0.5, 0.3],
  ],
  s: [
    [0.85, 0.35],
    [0.5, 0.3],
    [0.15, 0.45],
    [0.5, 0.65],
    [0.85, 0.82],
    [0.5, 1],
    [0.15, 0.9],
  ],
  u: [
    [0.15, 0.3],
    [0.2, 0.85],
    [0.5, 1],
    [0.8, 0.85],
    [0.85, 0.3],
    [0.85, 1],
  ],
  v: [
    [0.1, 0.3],
    [0.5, 1],
    [0.9, 0.3],
  ],
};

interface ShapeOutline {
  readonly name: string;
  readonly ref: string;
  readonly points: readonly UnitPoint[];
}

function regularOutline(count: number): UnitPoint[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const angle = (2 * Math.PI * (i % count)) / count - Math.PI / 2;
    return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)];
  });
}

function starOutline(): UnitPoint[] {
  return Array.from({ length: 11 }, (_, i) => {
    const k = i % 10;
    const r = k % 2 === 0 ? 0.5 : 0.21;
    const angle = (2 * Math.PI * k) / 10 - Math.PI / 2;
    return [0.5 + r * Math.cos(angle), 0.52 + r * Math.sin(angle)];
  });
}

/**
 * Hình nối chấm khi dataset không có ký hiệu viết được (vật khung `BR-SDS-17`):
 * đề gọi đúng tên hình mà các chấm vẽ ra (`BR-E024-09`).
 */
function shapeForCount(count: number): ShapeOutline {
  if (count <= 3) {
    return {
      name: "hình tam giác",
      ref: "🔺",
      points: [
        [0.5, 0],
        [0.95, 1],
        [0.05, 1],
        [0.5, 0],
      ],
    };
  }
  if (count <= 5) {
    return {
      name: "hình vuông",
      ref: "🟦",
      points: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    };
  }
  if (count <= 7) {
    return {
      name: "ngôi nhà",
      ref: "🏠",
      points: [
        [0.1, 1],
        [0.1, 0.45],
        [0.5, 0],
        [0.9, 0.45],
        [0.9, 1],
        [0.1, 1],
      ],
    };
  }
  if (count <= 10) {
    return { name: "hình tròn", ref: "⭕", points: regularOutline(count) };
  }
  return { name: "ngôi sao", ref: "⭐", points: starOutline() };
}

/** Chèn trung điểm vào đoạn dài nhất tới khi đủ `target` chấm (tối đa 12). */
function densify(points: readonly UnitPoint[], target: number): UnitPoint[] {
  const out: UnitPoint[] = [...points];
  const goal = Math.min(12, target);
  while (out.length < goal) {
    let best = 0;
    let bestLen = -1;
    for (let i = 0; i < out.length - 1; i++) {
      const [ax, ay] = safeGetItem(out, i);
      const [bx, by] = safeGetItem(out, i + 1);
      const len = Math.hypot(bx - ax, by - ay);
      if (len > bestLen) {
        bestLen = len;
        best = i;
      }
    }
    const [ax, ay] = safeGetItem(out, best);
    const [bx, by] = safeGetItem(out, best + 1);
    out.splice(best + 1, 0, [(ax + bx) / 2, (ay + by) / 2]);
  }
  return out;
}

const BOX = { x: 380, y: 110, w: 200, h: 320 } as const;
const SHAPE_BOX = { x: 320, y: 110, w: 320, h: 320 } as const;

function toWaypoints(
  points: readonly UnitPoint[],
  box: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  }
) {
  const firstLabel = "1";
  const [fx, fy] = safeGetItem(points, 0);
  return points.map(([ux, uy], i) => {
    const closes = i > 0 && i === points.length - 1 && ux === fx && uy === fy;
    return {
      id: `wp${i + 1}`,
      x: Math.round(box.x + ux * box.w),
      y: Math.round(box.y + uy * box.h),
      order: i,
      label: closes ? firstLabel : `${i + 1}`,
    };
  });
}

const DIGIT_GLYPH = /^\d$/;

/** Tên ký hiệu: nhãn của vật nếu nó đã gọi tên ký hiệu, không thì "số n"/"chữ x". */
function glyphName(glyph: string, label: string): string {
  if (DIGIT_GLYPH.test(glyph)) {
    return label.startsWith("số ") ? label : `số ${glyph}`;
  }
  return label.startsWith("chữ ") ? label : `chữ ${glyph}`;
}

export function isTraceableGlyph(glyph: string | undefined): boolean {
  return glyph !== undefined && Object.hasOwn(GT024_STROKES, glyph);
}

export const projectGT024: Projection<"GT-024"> = {
  template: "GT-024",
  requires: { min_items: 1, max_items: 12 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-024`
      );
    }

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const params = getEngineDifficultyParams("GT-024", opts.difficulty);

    const traceable = dataset.items.filter((i) => isTraceableGlyph(i.glyph));
    const hasGlyph = dataset.items.some((i) => i.glyph);
    if (hasGlyph && traceable.length === 0) {
      throw new Error(
        `[BR-E024-09] Dataset ${dataset.skill_code} có glyph nhưng không ký hiệu nào viết được bằng một nét nối chấm`
      );
    }

    let shapeName: string;
    let guide: DatasetAsset;
    let waypoints: ReturnType<typeof toWaypoints>;
    let prompt: string;
    if (traceable.length > 0) {
      const item = safeGetItem(traceable, rng.nextInt(traceable.length));
      const glyph = item.glyph ?? "";
      const stroke = GT024_STROKES[glyph] ?? [];
      waypoints = toWaypoints(
        densify(stroke, Math.max(3, Math.min(params.item_count, 12))),
        BOX
      );
      // Đề gọi tên **ký hiệu** đang nối, không gọi tên vật minh hoạ: "tạo quả
      // dưa lê" trên nét chữ số 1 là đề nói dối (`BR-E024-09`).
      shapeName = glyphName(glyph, item.label);
      guide = { kind: "text", text: glyph };
      prompt = sanitizeChildPrompt(
        `Bé lướt tay nối chấm tạo ${formatPromptLabel(shapeName)} nhé!`,
        "Bé nối theo chấm tròn để viết nhé!"
      );
    } else {
      const shape = shapeForCount(params.item_count);
      waypoints = toWaypoints(shape.points, SHAPE_BOX);
      shapeName = shape.name;
      guide = { kind: "emoji", ref: shape.ref };
      prompt = `Bé lướt tay nối chấm tạo ${shape.name} nhé!`;
    }

    return {
      content_pack: {
        prompt,
        shape_name: shapeName,
        guide_asset: guide,
        waypoints,
      },
      difficulty_params: {
        item_count: waypoints.length,
        tolerance_px: params.tolerance_px ?? 24,
        show_numbered_dots: params.show_numbered_dots ?? true,
        show_guide_lines: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
