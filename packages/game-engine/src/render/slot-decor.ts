import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  applyCanvasFontAtSize,
  canvasFontPx,
  type LogicSpace,
  spaceOf,
} from "./type-scale.js";

export function drawCheckMark(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const badgeR = Math.max(12, r * 0.32);
  const cx = slot.x + r * 0.55;
  const cy = slot.y - r * 0.55;
  const arm = badgeR * 0.55;

  ctx.save();
  // Emerald circle badge
  ctx.fillStyle = designTokens.colors.montessori.emeraldBright;
  ctx.strokeStyle = designTokens.colors.montessori.emerald;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crisp white checkmark
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = Math.max(2.5, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - arm * 0.7, cy);
  ctx.lineTo(cx - arm * 0.1, cy + arm * 0.6);
  ctx.lineTo(cx + arm * 0.7, cy - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Ô đích rỗng — viền đứt, hốc chìm chờ trẻ thả vật vào. */
export function drawEmptyTargetSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  const r = Math.min(slot.w, slot.h) / 2;
  const radius = Math.max(12, r * 0.25);

  // 1. Soft recessed inner shadow (sunken wooden socket)
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(slot.x - r, slot.y - r, r * 2, r * 2, radius);
  ctx.fill();

  // Inset rim shadow
  ctx.strokeStyle = alpha(designTokens.colors.montessori.woodBorder, 0.25);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 2. Dashed warm honey amber guide border
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(
    slot.x - r + 3,
    slot.y - r + 3,
    (r - 3) * 2,
    (r - 3) * 2,
    Math.max(10, r * 0.2)
  );
  ctx.stroke();
  ctx.restore();
}

export function drawSlotOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    slot.x - slot.hitW / 2,
    slot.y - slot.hitH / 2,
    slot.hitW,
    slot.hitH
  );
  ctx.restore();
}

const ELASTIC_DASH: readonly number[] = Object.freeze([10, 7]);
const NO_DASH: readonly number[] = Object.freeze([]);

/**
 * Dây nối đàn hồi (Bezier bậc hai) từ vị trí gốc tới ngón tay, hai đầu có chấm.
 * Màu do nơi gọi truyền từ `designTokens` (không hex ở đây).
 */
export function drawElasticConnector(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  solid: boolean
): void {
  const dist = Math.hypot(toX - fromX, toY - fromY);
  if (dist < 16) {
    return;
  }
  const archOffset = Math.min(36, dist * 0.14);
  const ctrlX = (fromX + toX) / 2;
  const ctrlY = (fromY + toY) / 2 - archOffset;

  ctx.save();
  ctx.strokeStyle = alpha(color, 0.85);
  ctx.lineWidth = solid ? 5 : 4;
  ctx.lineCap = "round";
  ctx.setLineDash(solid ? NO_DASH : ELASTIC_DASH);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, toX, toY);
  ctx.stroke();

  ctx.setLineDash(NO_DASH);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(fromX, fromY, 6, 0, Math.PI * 2);
  ctx.arc(toX, toY, solid ? 8 : 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Dải lụa đi theo đường kéo của ngón tay, đầu dải có chấm. */
export function drawTrailRibbon(
  ctx: CanvasRenderingContext2D,
  points: readonly { readonly x: number; readonly y: number }[],
  color: string,
  headRimColor: string
): void {
  const first = points[0];
  const last = points.at(-1);
  if (points.length < 2 || !first || !last) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = alpha(color, 0.72);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt) {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.strokeStyle = headRimColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Vòng viền tròn ôm ngoài slot (dùng cho khoanh chọn, highlight đích). */
export function drawCircleOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth = 4,
  padding = 4
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  const r = Math.min(slot.w, slot.h) / 2 + padding;
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawLabelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color = designTokens.colors.surface[700]
): void {
  ctx.save();
  ctx.fillStyle = color;
  applyCanvasFontAtSize(ctx, fontSize, "sans");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawCounterBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: number,
  total: number,
  space?: LogicSpace,
  scale?: number
): void {
  const fontPx = canvasFontPx(space ?? DEFAULT_LOGIC_SPACE, "badge", scale);
  const badgeRadius = Math.max(18, Math.round(fontPx * 1.15));
  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[600];
  ctx.beginPath();
  ctx.arc(x, y, badgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = designTokens.colors.surface[0];
  applyCanvasFontAtSize(ctx, fontPx, "sans", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${current}/${total}`, x, y);
  ctx.restore();
}

/** Đồng hồ tiến độ ở góc trên phải — vị trí suy từ khung logic, không hằng số. */
export function drawProgressBadge(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  current: number,
  total: number
): void {
  const { space, scale } = spaceOf(rs);
  drawCounterBadge(ctx, rs.LOGIC_WIDTH - 44, 40, current, total, space, scale);
}

export function drawDividerLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawMatchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = designTokens.colors.semantic.success[500]
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  fill: string,
  border: string
): void {
  ctx.save();
  ctx.fillStyle = fill;
  const rx = slot.x - slot.hitW / 2;
  const ry = slot.y - slot.hitH / 2;
  ctx.fillRect(rx, ry, slot.hitW, slot.hitH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(rx, ry, slot.hitW, slot.hitH);
  ctx.restore();
}

/** Vẽ thẻ manh mối bo góc theo đúng kích thước ngang/dọc của slot (GT-009). */
export function drawClueBannerSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  fill: string,
  border: string
): void {
  const rx = slot.x - slot.w / 2;
  const ry = slot.y - slot.h / 2;
  const radius = Math.min(16, Math.min(slot.w, slot.h) * 0.28);
  ctx.save();
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(rx, ry, slot.w, slot.h, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rx, ry, slot.w, slot.h, radius);
  ctx.stroke();
  ctx.restore();
}

/** Vẽ chữ manh mối 1 hoặc 2 dòng (GT-009). */
export function drawClueText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  fontSize = 16,
  color = designTokens.colors.surface[700]
): void {
  ctx.save();
  ctx.fillStyle = color;
  applyCanvasFontAtSize(ctx, fontSize, "sans");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const metrics = ctx.measureText(text);
  if (metrics.width > maxW && text.includes(" ")) {
    const words = text.split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");
    ctx.fillText(line1, x, y - 10, maxW);
    ctx.fillText(line2, x, y + 10, maxW);
  } else {
    ctx.fillText(text, x, y, maxW);
  }
  ctx.restore();
}

/** Ký hiệu của một manh mối số — không chữ, trẻ chưa biết đọc vẫn hiểu hướng (`BR-ENG-10`). */
export type ClueSymbol =
  | { kind: "greater_than" | "less_than" | "not_equal"; value: number }
  | { kind: "between"; min: number; max: number }
  | { kind: "other" };

function strokeClueArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dir: "up" | "down" | "both"
): void {
  const half = size / 2;
  const head = size * 0.28;
  ctx.beginPath();
  if (dir === "both") {
    // Mũi tên hai đầu nằm ngang: "ở giữa hai số".
    ctx.moveTo(x - half, y);
    ctx.lineTo(x + half, y);
    ctx.moveTo(x - half + head, y - head);
    ctx.lineTo(x - half, y);
    ctx.lineTo(x - half + head, y + head);
    ctx.moveTo(x + half - head, y - head);
    ctx.lineTo(x + half, y);
    ctx.lineTo(x + half - head, y + head);
  } else {
    const tip = dir === "up" ? y - half : y + half;
    const tail = dir === "up" ? y + half : y - half;
    const back = dir === "up" ? head : -head;
    ctx.moveTo(x, tail);
    ctx.lineTo(x, tip);
    ctx.moveTo(x - head, tip + back);
    ctx.lineTo(x, tip);
    ctx.lineTo(x + head, tip + back);
  }
  ctx.stroke();
}

/** Vẽ ký hiệu manh mối số trong thẻ: chữ số kèm mũi tên lớn hơn/bé hơn/khác/ở giữa (GT-009). */
export function drawClueSymbol(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  symbol: ClueSymbol,
  color = designTokens.colors.surface[700]
): void {
  const fontSize = Math.max(18, Math.min(40, Math.floor(slot.h * 0.5)));
  const arrow = fontSize * 0.9;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  applyCanvasFontAtSize(ctx, fontSize, "sans");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (symbol.kind === "other") {
    ctx.fillText("\u{1F50D}", slot.x, slot.y);
  } else if (symbol.kind === "between") {
    const gap = Math.min(slot.w * 0.28, fontSize * 2);
    ctx.fillText(String(symbol.min), slot.x - gap - fontSize * 0.6, slot.y);
    strokeClueArrow(ctx, slot.x, slot.y, gap * 1.2, "both");
    ctx.fillText(String(symbol.max), slot.x + gap + fontSize * 0.6, slot.y);
  } else {
    const offset = fontSize * 0.9;
    ctx.fillText(String(symbol.value), slot.x - offset / 2, slot.y);
    if (symbol.kind === "not_equal") {
      const tx = slot.x - offset / 2;
      const r = fontSize * 0.7;
      ctx.strokeStyle = designTokens.colors.montessori.coral;
      ctx.beginPath();
      ctx.moveTo(tx - r, slot.y + r);
      ctx.lineTo(tx + r, slot.y - r);
      ctx.stroke();
    } else {
      strokeClueArrow(
        ctx,
        slot.x + fontSize * 0.9,
        slot.y,
        arrow,
        symbol.kind === "greater_than" ? "up" : "down"
      );
    }
  }
  ctx.restore();
}

/** Vẽ đường gạch chéo loại trừ ứng viên (GT-009). */
export function drawSlashLine(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color = designTokens.colors.surface[500],
  lineWidth = 3
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  const half = Math.min(slot.w, slot.h) * 0.35;
  ctx.beginPath();
  ctx.moveTo(slot.x - half, slot.y - half);
  ctx.lineTo(slot.x + half, slot.y + half);
  ctx.stroke();
  ctx.restore();
}

/** Viền bo góc quanh nhóm ô lưới (GT-011). */
export function drawRoundedBoxOutline(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  color = designTokens.colors.scene.sky[400],
  lineWidth = 3,
  radius = 8,
  inset = 4
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(
    box.x - inset,
    box.y - inset,
    box.w + inset * 2,
    box.h + inset * 2,
    radius
  );
  ctx.stroke();
  ctx.restore();
}

export interface SlotVisualComparisonCue {
  readonly kind: "length" | "height" | "size" | "weight" | "capacity";
  readonly glyphScale: number;
  readonly barRatio: number;
}

const SLOT_LONG_RE =
  /(?:^|\s)(rất dài|dài nhất|dài hơn|dài|rộng nhất|rộng hơn|rộng|xa nhất|xa hơn|xa)(?:$|\s)/i;
const SLOT_SHORT_RE =
  /(?:^|\s)(rất ngắn|ngắn nhất|ngắn hơn|ngắn|hẹp nhất|hẹp hơn|hẹp|gần nhất|gần hơn|gần)(?:$|\s)/i;
const SLOT_TALL_RE = /(?:^|\s)(rất cao|cao nhất|cao hơn|cao)(?:$|\s)/i;
const SLOT_LOW_RE = /(?:^|\s)(rất thấp|thấp nhất|thấp hơn|thấp|lùn)(?:$|\s)/i;
const SLOT_BIG_RE =
  /(?:^|\s)(rất to|to lớn|khổng lồ|to nhất|to hơn|lớn nhất|lớn hơn|dày nhất|dày hơn|dày|to|lớn)(?:$|\s)/i;
const SLOT_SMALL_RE =
  /(?:^|\s)(nhỏ xíu|rất nhỏ|bé xíu|tí hon|nhỏ nhất|nhỏ hơn|bé nhất|bé hơn|mỏng nhất|mỏng hơn|mỏng|nhỏ|bé)(?:$|\s)/i;
const SLOT_HEAVY_RE = /(?:^|\s)(rất nặng|nặng nhất|nặng hơn|nặng)(?:$|\s)/i;
const SLOT_LIGHT_RE = /(?:^|\s)(rất nhẹ|nhẹ nhất|nhẹ hơn|nhẹ)(?:$|\s)/i;
const SLOT_FULL_RE =
  /(?:^|\s)(đầy tràn|rất đầy|đầy nước|đầy|nhiều nước)(?:$|\s)/i;
const SLOT_EMPTY_RE = /(?:^|\s)(vơi|cạn|rỗng|ít nước|trống)(?:$|\s)/i;
const SKIP_LETTER_NUMBER_RE = /^(?:chữ|số|dấu|âm|vần)\s/i;
const MEAS_CMP_ID_RE = /^(?:meas|cmp|srt|c1[_-]meas|c1[_-]cmp)/i;

const EMOJI_MEAS_CUE_MAP: Readonly<Record<string, SlotVisualComparisonCue>> = {
  "🐍": { kind: "length", glyphScale: 1.24, barRatio: 0.86 },
  "🚂": { kind: "length", glyphScale: 1.24, barRatio: 0.88 },
  "🥖": { kind: "length", glyphScale: 1.16, barRatio: 0.76 },
  "📏": { kind: "length", glyphScale: 1.16, barRatio: 0.76 },
  "🥒": { kind: "length", glyphScale: 1.14, barRatio: 0.74 },
  "🖍️": { kind: "length", glyphScale: 0.78, barRatio: 0.32 },
  "🐛": { kind: "length", glyphScale: 0.76, barRatio: 0.3 },
  "📎": { kind: "length", glyphScale: 0.72, barRatio: 0.24 },
  "🦒": { kind: "height", glyphScale: 1.26, barRatio: 0.88 },
  "🌴": { kind: "height", glyphScale: 1.22, barRatio: 0.84 },
  "🌲": { kind: "height", glyphScale: 1.2, barRatio: 0.82 },
  "🏢": { kind: "height", glyphScale: 1.24, barRatio: 0.86 },
  "🍄": { kind: "height", glyphScale: 0.74, barRatio: 0.28 },
  "🌱": { kind: "height", glyphScale: 0.72, barRatio: 0.26 },
  "🐘": { kind: "size", glyphScale: 1.28, barRatio: 0.88 },
  "🐋": { kind: "size", glyphScale: 1.28, barRatio: 0.88 },
  "🍉": { kind: "size", glyphScale: 1.2, barRatio: 0.78 },
  "🎃": { kind: "size", glyphScale: 1.2, barRatio: 0.78 },
  "🐻": { kind: "size", glyphScale: 1.22, barRatio: 0.82 },
  "🐜": { kind: "size", glyphScale: 0.68, barRatio: 0.24 },
  "🐝": { kind: "size", glyphScale: 0.7, barRatio: 0.26 },
  "🍒": { kind: "size", glyphScale: 0.74, barRatio: 0.32 },
  "🍓": { kind: "size", glyphScale: 0.76, barRatio: 0.34 },
  "🐞": { kind: "size", glyphScale: 0.7, barRatio: 0.26 },
  "🪨": { kind: "weight", glyphScale: 1.22, barRatio: 0.86 },
  "🧱": { kind: "weight", glyphScale: 1.18, barRatio: 0.8 },
  "🪶": { kind: "weight", glyphScale: 0.74, barRatio: 0.24 },
  "🎈": { kind: "weight", glyphScale: 0.78, barRatio: 0.28 },
  "🍃": { kind: "weight", glyphScale: 0.74, barRatio: 0.26 },
};

const slotCueCache = new Map<string, SlotVisualComparisonCue | null>();
const EXTREME_LONG_RE = /rất dài|dài nhất|very long/i;
const EXTREME_SHORT_RE = /rất ngắn|ngắn nhất|very short/i;
const EXTREME_TALL_RE = /rất cao|cao nhất|very tall/i;
const EXTREME_LOW_RE = /rất thấp|thấp nhất|very low/i;
const EXTREME_BIG_RE = /rất to|khổng lồ|to lớn|to nhất|lớn nhất/i;
const EXTREME_SMALL_RE = /nhỏ xíu|rất nhỏ|bé xíu|tí hon|nhỏ nhất|bé nhất/i;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: fast cached comparison cue detector
export function detectSlotVisualComparisonCue(
  label?: string,
  id?: string,
  emojiRef?: string
): SlotVisualComparisonCue | null {
  if (!(label || id || emojiRef)) {
    return null;
  }
  const cacheKey = `${label ?? ""}|${id ?? ""}|${emojiRef ?? ""}`;
  const cached = slotCueCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const cleanLabel = (label ?? "").trim();
  const cleanId = (id ?? "").replaceAll("_", " ").replaceAll("-", " ").trim();
  const combined = `${cleanLabel} ${cleanId}`;

  let result: SlotVisualComparisonCue | null = null;

  if (!SKIP_LETTER_NUMBER_RE.test(cleanLabel)) {
    if (SLOT_LONG_RE.test(combined)) {
      const isExtreme = EXTREME_LONG_RE.test(combined);
      result = {
        kind: "length",
        glyphScale: isExtreme ? 1.24 : 1.15,
        barRatio: isExtreme ? 0.88 : 0.76,
      };
    } else if (SLOT_SHORT_RE.test(combined)) {
      const isExtreme = EXTREME_SHORT_RE.test(combined);
      result = {
        kind: "length",
        glyphScale: isExtreme ? 0.72 : 0.8,
        barRatio: isExtreme ? 0.24 : 0.34,
      };
    } else if (SLOT_TALL_RE.test(combined)) {
      const isExtreme = EXTREME_TALL_RE.test(combined);
      result = {
        kind: "height",
        glyphScale: isExtreme ? 1.24 : 1.15,
        barRatio: isExtreme ? 0.88 : 0.76,
      };
    } else if (SLOT_LOW_RE.test(combined)) {
      const isExtreme = EXTREME_LOW_RE.test(combined);
      result = {
        kind: "height",
        glyphScale: isExtreme ? 0.72 : 0.8,
        barRatio: isExtreme ? 0.24 : 0.34,
      };
    } else if (SLOT_FULL_RE.test(combined)) {
      result = {
        kind: "capacity",
        glyphScale: 1.1,
        barRatio: 0.84,
      };
    } else if (SLOT_EMPTY_RE.test(combined)) {
      result = {
        kind: "capacity",
        glyphScale: 0.9,
        barRatio: 0.24,
      };
    } else if (SLOT_HEAVY_RE.test(combined)) {
      result = {
        kind: "weight",
        glyphScale: 1.2,
        barRatio: 0.84,
      };
    } else if (SLOT_LIGHT_RE.test(combined)) {
      result = {
        kind: "weight",
        glyphScale: 0.78,
        barRatio: 0.28,
      };
    } else if (SLOT_BIG_RE.test(combined)) {
      const isExtreme = EXTREME_BIG_RE.test(combined);
      result = {
        kind: "size",
        glyphScale: isExtreme ? 1.28 : 1.18,
        barRatio: isExtreme ? 0.88 : 0.76,
      };
    } else if (SLOT_SMALL_RE.test(combined)) {
      const isExtreme = EXTREME_SMALL_RE.test(combined);
      result = {
        kind: "size",
        glyphScale: isExtreme ? 0.68 : 0.76,
        barRatio: isExtreme ? 0.26 : 0.36,
      };
    } else if (emojiRef && id && MEAS_CMP_ID_RE.test(id)) {
      const emojiCue = EMOJI_MEAS_CUE_MAP[emojiRef];
      if (emojiCue) {
        result = emojiCue;
      }
    }
  }

  if (slotCueCache.size > 2048) {
    slotCueCache.clear();
  }
  slotCueCache.set(cacheKey, result);
  return result;
}

/**
 * Vẽ thước đo trực quan Montessori bên trong ô (`slot`) cho các khái niệm so sánh
 * (dài-ngắn, cao-thấp, to-nhỏ, nặng-nhẹ, đầy-vơi).
 */
export function drawSlotVisualComparisonCue(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  cue: SlotVisualComparisonCue
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  if (r < 24) {
    return;
  }

  ctx.save();
  if (cue.kind === "length" || cue.kind === "weight") {
    const trackW = Math.round(r * 1.28);
    const barH = Math.max(6, Math.round(r * 0.16));
    const trackX = slot.x - trackW / 2;
    const trackY = slot.y + Math.round(r * 0.52) - barH / 2;
    const fillW = Math.max(barH, Math.round(trackW * cue.barRatio));

    ctx.fillStyle = designTokens.colors.surface[100];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, barH, barH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      cue.kind === "weight"
        ? designTokens.colors.brand[500]
        : designTokens.colors.cta[500];
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, fillW, barH, barH / 2);
    ctx.fill();
  } else if (cue.kind === "height" || cue.kind === "capacity") {
    const rodW = Math.max(6, Math.round(r * 0.16));
    const trackH = Math.round(r * 1.16);
    const rodX = slot.x + Math.round(r * 0.54) - rodW / 2;
    const rodBottom = slot.y + Math.round(trackH / 2);
    const rodTop = rodBottom - trackH;
    const fillH = Math.max(rodW, Math.round(trackH * cue.barRatio));

    ctx.fillStyle = designTokens.colors.surface[100];
    ctx.strokeStyle = designTokens.colors.surface[300];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rodX, rodTop, rodW, trackH, rodW / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      cue.kind === "capacity"
        ? designTokens.colors.brand[400]
        : designTokens.colors.semantic.success[500];
    ctx.beginPath();
    ctx.roundRect(rodX, rodBottom - fillH, rodW, fillH, rodW / 2);
    ctx.fill();
  } else if (cue.kind === "size") {
    const ringR = Math.max(10, Math.round(r * (0.28 + 0.46 * cue.barRatio)));
    ctx.fillStyle = alpha(designTokens.colors.montessori.amberLight, 0.38);
    ctx.strokeStyle = alpha(designTokens.colors.montessori.amber, 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, ringR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ── Vòng khoanh lấp lánh quanh điểm tìm ra (GT-025, `BR-E025-07`) ─────

/** Vòng khoanh được vẽ liền nét trong ngần này ms kể từ lúc tìm ra. */
export const FIND_RING_SWEEP_MS = 350;
const FIND_RING_TWINKLE_MS = 900;
export const FIND_RING_SPARKLES = 4;

export interface FindRingPose {
  /** Phần vòng đã vẽ, 0..1. */
  readonly sweep: number;
  /** Độ sáng 0..1 của từng tia lấp lánh; đứng yên cho tới khi vòng khép kín. */
  readonly sparkles: readonly number[];
}

/**
 * Tư thế vòng khoanh ở `elapsedMs` kể từ lúc tìm ra — hàm thuần. Vòng khép dần
 * rồi bốn tia lấp lánh nhấp nháy lệch pha. `reduced_motion` là trạng thái
 * cuối tĩnh: vòng đầy, mọi tia sáng đều (`BR-FBK-09`).
 */
export function findRingPose(
  elapsedMs: number,
  reducedMotion: boolean
): FindRingPose {
  if (reducedMotion) {
    return {
      sweep: 1,
      sparkles: Array.from({ length: FIND_RING_SPARKLES }, () => 1),
    };
  }
  const sweep = Math.min(1, Math.max(0, elapsedMs / FIND_RING_SWEEP_MS));
  const phase = (elapsedMs - FIND_RING_SWEEP_MS) / FIND_RING_TWINKLE_MS;
  return {
    sweep,
    sparkles: Array.from({ length: FIND_RING_SPARKLES }, (_, i) =>
      sweep < 1
        ? 0
        : 0.5 + 0.5 * Math.sin(Math.PI * 2 * (phase + i / FIND_RING_SPARKLES))
    ),
  };
}

/** Vòng khoanh vàng quanh tâm `(cx, cy)` bán kính `radius`, kèm bốn tia lấp lánh. */
export function drawFindRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  pose: FindRingPose
): void {
  ctx.save();
  if (pose.sweep > 0) {
    const start = -Math.PI / 2;
    ctx.strokeStyle = designTokens.colors.montessori.amber;
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * pose.sweep);
    ctx.stroke();
  }
  pose.sparkles.forEach((brightness, i) => {
    if (brightness <= 0) {
      return;
    }
    const angle = Math.PI / 4 + (i * Math.PI * 2) / pose.sparkles.length;
    const sx = cx + Math.cos(angle) * radius;
    const sy = cy + Math.sin(angle) * radius;
    const arm = radius * (0.08 + 0.14 * brightness);
    ctx.fillStyle = alpha(
      designTokens.colors.montessori.amberGlow,
      0.4 + 0.6 * brightness
    );
    ctx.strokeStyle = alpha(
      designTokens.colors.montessori.amberDeep,
      brightness
    );
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - arm);
    ctx.lineTo(sx + arm * 0.35, sy - arm * 0.35);
    ctx.lineTo(sx + arm, sy);
    ctx.lineTo(sx + arm * 0.35, sy + arm * 0.35);
    ctx.lineTo(sx, sy + arm);
    ctx.lineTo(sx - arm * 0.35, sy + arm * 0.35);
    ctx.lineTo(sx - arm, sy);
    ctx.lineTo(sx - arm * 0.35, sy - arm * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}
