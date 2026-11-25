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
/**
 * Nét nối chấm một nét liền của chữ số và chữ cái thường (`BR-E024-09`), toạ độ
 * trong hộp đơn vị (x sang phải, y xuống dưới), điểm đầu là chỗ đặt bút. Chấm
 * thưa có chủ đích: mọi cặp chấm cách nhau ít nhất `GT024_MIN_DOT_GAP` cạnh hộp
 * để vùng chạm không chồng trên màn hẹp (`BR-LAY-05`); điểm lặp lại đúng toạ độ
 * cũ (vòng của 6, 8, 9, e) được engine vẽ một lần (`BR-E024-07`). Chữ không vẽ
 * được bằng một nét thưa như vậy (a, g, t, x, chữ có dấu phụ) không có ở đây.
 */
export const GT024_STROKES: Readonly<Record<string, readonly UnitPoint[]>> = {
  "0": [
    [0.5, 0],
    [0.125, 0.28],
    [0.125, 0.72],
    [0.5, 1],
    [0.875, 0.72],
    [0.875, 0.28],
    [0.5, 0],
  ],
  "1": [
    [0.2, 0.3],
    [0.6, 0],
    [0.6, 1],
  ],
  "2": [
    [0.1, 0.25],
    [0.5, 0],
    [0.9, 0.3],
    [0.1, 1],
    [0.9, 1],
  ],
  "3": [
    [0.1, 0],
    [0.85, 0.12],
    [0.35, 0.5],
    [0.9, 0.8],
    [0.1, 0.95],
  ],
  "4": [
    [0.65, 1],
    [0.65, 0],
    [0.1, 0.7],
    [1, 0.65],
  ],
  "5": [
    [0.85, 0],
    [0.15, 0],
    [0.15, 0.45],
    [0.85, 0.65],
    [0.15, 1],
  ],
  "6": [
    [0.8, 0],
    [0.15, 0.6],
    [0.5, 1],
    [0.85, 0.65],
    [0.15, 0.6],
  ],
  "7": [
    [0.1, 0],
    [0.9, 0],
    [0.4, 1],
  ],
  "8": [
    [0.5, 0.5],
    [0.9, 0.25],
    [0.5, 0],
    [0.1, 0.25],
    [0.5, 0.5],
    [0.1, 0.75],
    [0.5, 1],
    [0.9, 0.75],
    [0.5, 0.5],
  ],
  "9": [
    [0.85, 0.45],
    [0.5, 0],
    [0.15, 0.3],
    [0.85, 0.45],
    [0.85, 1],
  ],
  b: [
    [0, 0],
    [0, 1],
    [0.75, 0.95],
    [0.85, 0.5],
    [0, 0.55],
  ],
  c: [
    [0.9, 0.15],
    [0.4, 0],
    [0, 0.5],
    [0.4, 1],
    [0.9, 0.85],
  ],
  d: [
    [1, 0.55],
    [0.15, 0.5],
    [0.25, 0.95],
    [1, 1],
    [1, 0],
  ],
  e: [
    [0, 0.5],
    [1, 0.5],
    [0.5, 0],
    [0, 0.5],
    [0.5, 1],
    [1, 0.95],
  ],
  l: [
    [0.5, 0],
    [0.5, 1],
  ],
  o: [
    [0.5, 0],
    [0.125, 0.28],
    [0.125, 0.72],
    [0.5, 1],
    [0.875, 0.72],
    [0.875, 0.28],
    [0.5, 0],
  ],
  s: [
    [0.95, 0.12],
    [0.45, 0],
    [0, 0.25],
    [0.5, 0.5],
    [1, 0.75],
    [0.55, 1],
    [0.05, 0.88],
  ],
  u: [
    [0, 0],
    [0.05, 0.75],
    [0.5, 1],
    [0.95, 0.75],
    [1, 0],
  ],
  v: [
    [0, 0],
    [0.5, 1],
    [1, 0],
  ],
};

interface ShapeOutline {
  readonly name: string;
  readonly ref: string;
  readonly points: readonly UnitPoint[];
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

/**
 * Khoảng cách tối thiểu giữa hai chấm khác toạ độ, tính theo cạnh lớn của hộp
 * chấm: engine co hộp chấm đồng đều vào sân khấu, chấm gần hơn thì vùng chạm
 * chồng nhau trên màn hẹp (`BR-PSZ-01`, `BR-LAY-05`).
 */
export const GT024_MIN_DOT_GAP = 0.42;

/**
 * Kéo nét về trọn hộp đơn vị, giữ tỉ lệ: engine co theo hộp bao các chấm nên
 * khoảng cách thật là khoảng cách so với cạnh lớn của hộp bao.
 */
function normalizeStroke(points: readonly UnitPoint[]): UnitPoint[] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const span = Math.max(1e-6, w, h);
  return points.map(([x, y]) => [
    (x - minX) / span + (1 - w / span) / 2,
    (y - minY) / span + (1 - h / span) / 2,
  ]);
}

/** Hai điểm trùng toạ độ là một chấm (`BR-E024-07`), không tính khoảng cách. */
function samePoint(a: UnitPoint, b: UnitPoint): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Mọi cặp chấm khác toạ độ cách nhau ≥ `GT024_MIN_DOT_GAP` cạnh hộp. */
export function isWellSpaced(points: readonly UnitPoint[]): boolean {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = safeGetItem(points, i);
      const b = safeGetItem(points, j);
      if (
        !samePoint(a, b) &&
        Math.hypot(a[0] - b[0], a[1] - b[1]) < GT024_MIN_DOT_GAP
      ) {
        return false;
      }
    }
  }
  return true;
}

/** Chèn trung điểm vào đoạn dài nhất (nếu vẫn đủ thưa) tới khi đủ `target` chấm. */
function spacedDots(points: readonly UnitPoint[], target: number): UnitPoint[] {
  const out: UnitPoint[] = [...points];
  const goal = Math.min(12, target);
  const tried = new Set<string>();
  while (out.length < goal) {
    let best = -1;
    let bestLen = -1;
    for (let i = 0; i < out.length - 1; i++) {
      const a = safeGetItem(out, i);
      const b = safeGetItem(out, i + 1);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!tried.has(`${a}|${b}`) && len > bestLen) {
        bestLen = len;
        best = i;
      }
    }
    if (best < 0) {
      break;
    }
    const a = safeGetItem(out, best);
    const b = safeGetItem(out, best + 1);
    const mid: UnitPoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const next = [...out.slice(0, best + 1), mid, ...out.slice(best + 1)];
    if (isWellSpaced(next)) {
      out.splice(best + 1, 0, mid);
    } else {
      tried.add(`${a}|${b}`);
    }
  }
  return out;
}

const BOX = { x: 320, y: 110, w: 320, h: 320 } as const;
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
  const stroke = glyph === undefined ? undefined : GT024_STROKES[glyph];
  return stroke !== undefined && isWellSpaced(normalizeStroke(stroke));
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
      const stroke = normalizeStroke(GT024_STROKES[glyph] ?? []);
      waypoints = toWaypoints(
        spacedDots(stroke, Math.max(3, Math.min(params.item_count, 12))),
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
