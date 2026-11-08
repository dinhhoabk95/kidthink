import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";

export interface LiquidCupParams {
  readonly cupId: string;
  readonly shape: "standard" | "narrow_tall" | "wide_short" | "fluted";
  readonly capacityUnits: number;
  readonly fillUnits: number;
  readonly color?: string;
  readonly isSelected?: boolean;
  readonly showHintMarks?: boolean;
  /** Dung tích lớn nhất trong lượt, để các cốc cùng thang diện tích. */
  readonly maxCapacityUnits?: number;
}

/** Hệ số bề ngang × bề cao của từng hình cốc; tích luôn bằng 1 (diện tích như nhau). */
const CUP_SHAPE_FACTORS: Readonly<
  Record<LiquidCupParams["shape"], { readonly w: number; readonly h: number }>
> = {
  standard: { w: 1, h: 1 },
  narrow_tall: { w: 0.8, h: 1.25 },
  wide_short: { w: 1.3, h: 1 / 1.3 },
  fluted: { w: 1.1, h: 1 / 1.1 },
};

export interface LiquidCupRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Hình học thân cốc, đáy canh theo đáy ô (`BR-E032-03`, `BR-E032-05`).
 * Diện tích vẽ tỉ lệ với `capacityUnits`, không phụ thuộc hình cốc: cùng số vạch
 * nước thì cùng lượng nước nhìn thấy (2D), nên "bằng nhau" là bằng thật.
 */
export function liquidCupRect(
  slot: Slot,
  shape: LiquidCupParams["shape"],
  capacityUnits: number,
  maxCapacityUnits: number
): LiquidCupRect {
  const scale =
    maxCapacityUnits > 0 ? Math.sqrt(capacityUnits / maxCapacityUnits) : 1;
  const baseW = slot.w * 0.8 * scale;
  const baseH = slot.h * 0.85 * scale;
  const f = CUP_SHAPE_FACTORS[shape];
  const w = baseW * f.w;
  const h = baseH * f.h;
  return {
    x: slot.x - w / 2,
    y: slot.y + (slot.h * 0.85) / 2 - h,
    w,
    h,
  };
}

/** Cốc `fluted`: đáy hẹp, miệng rộng; trung bình hai bề ngang = 1 nên diện tích thân giữ nguyên (`BR-E032-11`). */
export const CUP_FLARE_BOTTOM = 0.7;
export const CUP_FLARE_TOP = 1.3;

/**
 * Chiều cao mực nước (0..1 so với thân) để diện tích nước bằng `fillRatio` lần
 * diện tích thân. Cốc chữ nhật thì trùng `fillRatio`; cốc loe giải
 * `(top - bottom)/2 · s² + bottom · s = fillRatio` (`BR-E032-11`).
 */
export function cupWaterLevel(
  shape: LiquidCupParams["shape"],
  fillRatio: number
): number {
  const r = Math.min(1, Math.max(0, fillRatio));
  if (shape !== "fluted") {
    return r;
  }
  const a = (CUP_FLARE_TOP - CUP_FLARE_BOTTOM) / 2;
  return (
    (Math.sqrt(CUP_FLARE_BOTTOM * CUP_FLARE_BOTTOM + 4 * a * r) -
      CUP_FLARE_BOTTOM) /
    (2 * a)
  );
}

/** Vạch ngoài cùng của thân cốc: hình thang với `fluted`, chữ nhật bo góc với các hình còn lại. */
function traceCupBody(
  ctx: CanvasRenderingContext2D,
  shape: LiquidCupParams["shape"],
  rect: LiquidCupRect,
  grow: number,
  radii: [number, number, number, number]
): void {
  const { x, y, w, h } = rect;
  if (shape === "fluted") {
    const cx = x + w / 2;
    const half = w / 2;
    const bottom = half * CUP_FLARE_BOTTOM + grow;
    const top = half * CUP_FLARE_TOP + grow;
    ctx.moveTo(cx - top, y - grow);
    ctx.lineTo(cx + top, y - grow);
    ctx.lineTo(cx + bottom, y + h + grow);
    ctx.lineTo(cx - bottom, y + h + grow);
    ctx.closePath();
    return;
  }
  ctx.roundRect(x - grow, y - grow, w + 2 * grow, h + 2 * grow, radii);
}

function liquidFillColor(color: string | undefined): string {
  if (color === "mint") {
    return designTokens.colors.semantic.success[500];
  }
  if (color === "berry") {
    return designTokens.colors.montessori.coral;
  }
  if (color === "amber") {
    return designTokens.colors.retry[500];
  }
  return designTokens.colors.brand[500];
}

export interface DetachedWaterCup {
  readonly slot: Slot;
  readonly shape: LiquidCupParams["shape"];
  readonly capacityUnits: number;
  readonly fillUnits: number;
  readonly color?: string;
}

/** Bề ngang cột nước tách khỏi cốc (CSS px logic). */
const DETACHED_COLUMN_W = 36;
const DETACHED_COLUMN_GAP = 14;

/**
 * Hai (hoặc nhiều) cột nước tách khỏi cốc và xếp cạnh nhau, chung một đáy, chung
 * bề ngang — nên chiều cao so được thẳng lượng nước (`BR-E032-03`, `BR-E032-10`).
 * `progress` 0 = cột còn nằm đúng chỗ nước trong cốc, 1 = đã xếp cạnh nhau.
 */
export function drawDetachedWaterColumns(
  ctx: CanvasRenderingContext2D,
  cups: readonly DetachedWaterCup[],
  maxCapacityUnits: number,
  progress: number
): void {
  if (cups.length === 0) {
    return;
  }
  const rects = cups.map((c) =>
    liquidCupRect(c.slot, c.shape, c.capacityUnits, maxCapacityUnits)
  );
  const baseY = Math.max(...rects.map((r) => r.y + r.h));
  const centerX = cups.reduce((sum, c) => sum + c.slot.x, 0) / cups.length;
  const stackedH = cups.map((c, i) => {
    const r = rects[i];
    const ratio = c.capacityUnits > 0 ? c.fillUnits / c.capacityUnits : 0;
    return r ? (r.w * r.h * ratio) / DETACHED_COLUMN_W : 0;
  });
  const maxCupH = Math.max(...rects.map((r) => r.h));
  const tallest = Math.max(...stackedH);
  const scale = tallest > maxCupH ? maxCupH / tallest : 1;
  const t = Math.min(1, Math.max(0, progress));
  const eased = 1 - (1 - t) ** 3;

  ctx.save();
  ctx.strokeStyle = alpha(designTokens.colors.surface[500], 0.6);
  ctx.lineWidth = 3;
  ctx.beginPath();
  const span = cups.length * (DETACHED_COLUMN_W + DETACHED_COLUMN_GAP);
  ctx.moveTo(centerX - span / 2 - 8, baseY);
  ctx.lineTo(centerX + span / 2 + 8, baseY);
  ctx.stroke();
  cups.forEach((c, i) => {
    const r = rects[i];
    if (!r) {
      return;
    }
    const ratio = c.capacityUnits > 0 ? c.fillUnits / c.capacityUnits : 0;
    const level = cupWaterLevel(c.shape, ratio);
    const startH = r.h * level;
    const endH = (stackedH[i] ?? 0) * scale;
    const h = startH + (endH - startH) * eased;
    const startW = r.w;
    const w = startW + (DETACHED_COLUMN_W - startW) * eased;
    const endX =
      centerX +
      (i - (cups.length - 1) / 2) * (DETACHED_COLUMN_W + DETACHED_COLUMN_GAP);
    const x = c.slot.x + (endX - c.slot.x) * eased;
    ctx.fillStyle = liquidFillColor(c.color);
    ctx.beginPath();
    if (c.shape === "fluted") {
      // Nước trong cốc loe là hình thang (đáy hẹp, mặt rộng): vẽ đúng hình đó ở
      // khung đầu để diện tích bằng lượng nước, rồi thẳng dần thành cột (`BR-E032-13`).
      const startBottom = r.w * CUP_FLARE_BOTTOM;
      const startTop =
        r.w * (CUP_FLARE_BOTTOM + (CUP_FLARE_TOP - CUP_FLARE_BOTTOM) * level);
      const bottomW = startBottom + (DETACHED_COLUMN_W - startBottom) * eased;
      const topW = startTop + (DETACHED_COLUMN_W - startTop) * eased;
      ctx.moveTo(x - topW / 2, baseY - h);
      ctx.lineTo(x + topW / 2, baseY - h);
      ctx.lineTo(x + bottomW / 2, baseY);
      ctx.lineTo(x - bottomW / 2, baseY);
      ctx.closePath();
    } else {
      ctx.roundRect(x - w / 2, baseY - h, w, h, [4, 4, 8, 8]);
    }
    ctx.fill();
  });
  ctx.restore();
}

export interface PourDemoCup {
  readonly slot: Slot;
  readonly shape: LiquidCupParams["shape"];
  readonly capacityUnits: number;
  readonly fillUnits: number;
  readonly color?: string;
}

/** Cốc bản sao nghiêng trên miệng cốc nhận (rad). */
const POUR_TILT_RAD = 0.9;

/**
 * Màn rót của bài bảo toàn (`BR-E032-12`): cốc bản sao mờ có hình của `source`
 * nghiêng trên miệng `dest`, cạn dần, nước chảy thành tia tới mặt nước của `dest`.
 * `progress` 0..1; ngoài khoảng mở (0, 1) thì không vẽ gì. Cốc `dest` thật do
 * người gọi vẽ với mực nước đang dâng (`destFillUnits`).
 */
export function drawPourDemo(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  source: PourDemoCup,
  dest: PourDemoCup,
  maxCapacityUnits: number,
  progress: number
): void {
  if (!(progress > 0 && progress < 1)) {
    return;
  }
  const destRect = liquidCupRect(
    dest.slot,
    dest.shape,
    dest.capacityUnits,
    maxCapacityUnits
  );
  const srcRect = liquidCupRect(
    source.slot,
    source.shape,
    source.capacityUnits,
    maxCapacityUnits
  );
  const lipX = destRect.x + destRect.w / 2 - destRect.w * 0.2;
  const lipY = destRect.y - 28;
  const destRatio =
    dest.capacityUnits > 0
      ? (dest.fillUnits * progress) / dest.capacityUnits
      : 0;
  const surfaceY =
    destRect.y + destRect.h - destRect.h * cupWaterLevel(dest.shape, destRatio);

  ctx.save();
  // Tia nước từ môi cốc bản sao xuống mặt nước.
  ctx.fillStyle = liquidFillColor(source.color);
  ctx.fillRect(lipX - 3, lipY, 6, Math.max(0, surfaceY - lipY));

  // Cốc bản sao: gốc toạ độ ở môi cốc (góc trên bên phải), nghiêng quanh đó.
  ctx.translate(lipX, lipY);
  ctx.rotate(POUR_TILT_RAD);
  ctx.globalAlpha = 0.6;
  const ghostSlot: Slot = {
    ...source.slot,
    x: -srcRect.w / 2,
    y: srcRect.h - source.slot.h * 0.425,
  };
  drawLiquidCup(ctx, rs, ghostSlot, {
    cupId: "pour_demo_copy",
    shape: source.shape,
    capacityUnits: source.capacityUnits,
    fillUnits: source.fillUnits * (1 - progress),
    color: source.color,
    maxCapacityUnits,
  });
  ctx.restore();
}

export function drawLiquidCup(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: LiquidCupParams
): void {
  const rect = liquidCupRect(
    slot,
    params.shape,
    params.capacityUnits,
    params.maxCapacityUnits ?? params.capacityUnits
  );
  const { x, y, w: cupW, h: cupH } = rect;

  ctx.save();

  // Glass Background
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.5);
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 4;

  ctx.beginPath();
  traceCupBody(ctx, params.shape, rect, 0, [6, 6, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Liquid fill calculation (BR-E032-03, BR-E032-11)
  const fillRatio =
    params.capacityUnits > 0
      ? Math.min(1, Math.max(0, params.fillUnits / params.capacityUnits))
      : 0;

  const liquidH = cupH * cupWaterLevel(params.shape, fillRatio);
  const liquidY = y + cupH - liquidH;

  if (liquidH > 0) {
    ctx.save();
    // Clip inside cup
    ctx.beginPath();
    traceCupBody(ctx, params.shape, rect, -2, [4, 4, 14, 14]);
    ctx.clip();

    // Draw liquid (cốc loe rộng tới 1,3 hộp ở miệng nên tô rộng bằng đó, clip cắt theo thân)
    ctx.fillStyle = liquidFillColor(params.color);
    const fillW = params.shape === "fluted" ? cupW * CUP_FLARE_TOP : cupW;
    const fillX = x + (cupW - fillW) / 2;

    ctx.fillRect(fillX, liquidY, fillW, liquidH);

    // Meniscus / surface highlight
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.4);
    ctx.fillRect(fillX, liquidY, fillW, Math.min(6, liquidH));
    ctx.restore();
  }

  // Hint Marks (tick marks): mỗi khoảng giữa hai vạch chứa cùng lượng nước
  if (params.showHintMarks) {
    ctx.strokeStyle = alpha(designTokens.colors.surface[500], 0.6);
    ctx.lineWidth = 2;
    for (let step = 1; step < params.capacityUnits; step++) {
      const stepY =
        y +
        cupH -
        cupH * cupWaterLevel(params.shape, step / params.capacityUnits);
      const edge =
        params.shape === "fluted"
          ? (cupW / 2) *
            (CUP_FLARE_BOTTOM +
              (CUP_FLARE_TOP - CUP_FLARE_BOTTOM) *
                cupWaterLevel(params.shape, step / params.capacityUnits))
          : cupW / 2;
      const left = x + cupW / 2 - edge;
      ctx.beginPath();
      ctx.moveTo(left + 4, stepY);
      ctx.lineTo(left + 14, stepY);
      ctx.stroke();
    }
  }

  // Selected highlight
  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 6;
    ctx.beginPath();
    traceCupBody(ctx, params.shape, rect, 4, [10, 10, 20, 20]);
    ctx.stroke();
  }

  ctx.restore();
}

export interface WeaveCellParams {
  readonly cellIndex: number;
  readonly colorId: string | null;
  readonly isOriginal: boolean;
  readonly isSelected?: boolean;
  readonly isBrokenRow?: boolean;
  readonly isBrokenCol?: boolean;
}

export function drawWeaveCell(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: WeaveCellParams
): void {
  const w = slot.w;
  const h = slot.h;
  const x = slot.x - w / 2;
  const y = slot.y - h / 2;

  ctx.save();

  // Cell base background
  ctx.fillStyle = params.colorId
    ? getColorForYarn(params.colorId)
    : designTokens.colors.surface[100];
  ctx.strokeStyle = designTokens.colors.surface[300];
  ctx.lineWidth = 2;

  if (params.isBrokenRow || params.isBrokenCol) {
    ctx.strokeStyle = designTokens.colors.retry[500];
    ctx.lineWidth = 4;
  }

  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 4;
  }

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Ký hiệu hình theo màu: trẻ mù màu đỏ-lục vẫn phân biệt được (`BR-A11-03`).
  if (params.colorId) {
    drawYarnMark(ctx, params.colorId, slot.x, slot.y, Math.min(w, h) * 0.28);
  }

  // Weave texture lines if color is present
  if (params.colorId) {
    ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal yarn line
    ctx.moveTo(x + 4, y + h / 2);
    ctx.lineTo(x + w - 4, y + h / 2);
    // Vertical yarn line
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.stroke();
  } else {
    // Empty dashed border indicator
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = designTokens.colors.surface[400];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 4);
    ctx.stroke();
  }

  ctx.restore();
}

type YarnMarkShape = "circle" | "square" | "diamond" | "triangle" | "cross";

/** Mỗi họ màu một hình — màu không bao giờ là tín hiệu duy nhất. */
function yarnMarkShape(colorId: string): YarnMarkShape {
  switch (colorId.toLowerCase()) {
    case "blue":
    case "sky":
      return "square";
    case "yellow":
    case "amber":
      return "diamond";
    case "green":
    case "mint":
      return "triangle";
    case "orange":
    case "purple":
    case "indigo":
      return "cross";
    default:
      return "circle";
  }
}

function tracePolygon(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[]
): void {
  points.forEach(([px, py], i) => {
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.closePath();
}

/** Vẽ ký hiệu hình của một màu len: lòng trắng, viền tối, tâm (cx, cy). */
export function drawYarnMark(
  ctx: CanvasRenderingContext2D,
  colorId: string,
  cx: number,
  cy: number,
  size: number
): void {
  const r = size / 2;
  ctx.save();
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.92);
  ctx.strokeStyle = designTokens.colors.surface[800];
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  switch (yarnMarkShape(colorId)) {
    case "square":
      tracePolygon(ctx, [
        [cx - r * 0.85, cy - r * 0.85],
        [cx + r * 0.85, cy - r * 0.85],
        [cx + r * 0.85, cy + r * 0.85],
        [cx - r * 0.85, cy + r * 0.85],
      ]);
      break;
    case "diamond":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      break;
    case "triangle":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      ctx.closePath();
      break;
    case "cross": {
      const t = r * 0.38;
      tracePolygon(ctx, [
        [cx - t, cy - r],
        [cx + t, cy - r],
        [cx + t, cy - t],
        [cx + r, cy - t],
        [cx + r, cy + t],
        [cx + t, cy + t],
        [cx + t, cy + r],
        [cx - t, cy + r],
        [cx - t, cy + t],
        [cx - r, cy + t],
        [cx - r, cy - t],
        [cx - t, cy - t],
      ]);
      break;
    }
    default:
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Chấm màu len kèm ký hiệu hình — dùng cho bảng màu, nơi asset len giống hệt nhau. */
export function drawYarnSwatch(
  ctx: CanvasRenderingContext2D,
  colorId: string,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.fillStyle = getColorForYarn(colorId);
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawYarnMark(ctx, colorId, cx, cy, radius * 1.1);
}

/** Màu vẽ của sợi/cuộn len theo `color_id` (một nguồn cho ô, cuộn, sợi kéo). */
export function yarnFillColor(colorId: string): string {
  return getColorForYarn(colorId);
}

function getColorForYarn(colorId: string): string {
  switch (colorId.toLowerCase()) {
    case "red":
    case "berry":
      return designTokens.colors.montessori.coral;
    case "blue":
    case "sky":
      return designTokens.colors.scene.blue[500];
    case "yellow":
    case "amber":
      return designTokens.colors.montessori.amber;
    case "green":
    case "mint":
      return designTokens.colors.semantic.success[500];
    case "purple":
    case "indigo":
      return designTokens.colors.montessori.indigo;
    case "orange":
      return designTokens.colors.cta[500];
    default:
      return designTokens.colors.brand[400];
  }
}

// ── Quầy chợ và heo đất (GT-031, `BR-E031-12`) ───────────────────────

/** Heo đất nảy nhẹ trong ngần này ms sau mỗi xu bỏ vào. */
export const PIGGY_BOUNCE_MS = 300;
const PIGGY_BOUNCE_AMPLITUDE = 0.1;
const PIGGY_BOUNCE_CYCLES = 2;
const PIGGY_MAX_PX = 64;
const PIGGY_GAP_PX = 8;
const CANOPY_STRIPES = 6;

interface StallRect {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

export interface MarketStallGeometry {
  /** Quầy gỗ ngay dưới thẻ giá; `null` khi không đủ chỗ. */
  readonly counter: StallRect | null;
  /** Mái che sọc ngay trên thẻ giá; `null` khi không đủ chỗ. */
  readonly canopy: StallRect | null;
  /** Heo đất cạnh thẻ giá (tâm, cạnh); `null` khi không đủ chỗ hai bên. */
  readonly piggy: {
    readonly cx: number;
    readonly cy: number;
    readonly size: number;
  } | null;
}

/**
 * Hình học quầy chợ quanh thẻ giá `slot` trong `bounds` (thân sân khấu). Mái
 * che nằm trên mép trên thẻ, quầy nằm dưới mép dưới thẻ, heo đất đứng cạnh thẻ
 * (ưu tiên bên phải, rồi bên trái). Mọi thứ bị kẹp trong `bounds` và không
 * chồng lên thẻ giá nên không che vùng chạm.
 */
export function marketStallGeometry(
  slot: Slot,
  bounds: StallRect,
  /** Dải dưới thẻ dành cho nhãn giá (`slotLabelBandPx`); thanh quầy nằm dưới dải này. */
  labelBandPx = 0
): MarketStallGeometry {
  const top = slot.y - slot.h / 2;
  const bottom = slot.y + slot.h / 2;
  const canopyW = Math.min(bounds.w, slot.w * 1.7);
  const canopyH = Math.min(slot.h * 0.22, top - bounds.y);
  const canopy: StallRect | null =
    canopyH >= 8
      ? { x: slot.x - canopyW / 2, y: top - canopyH, w: canopyW, h: canopyH }
      : null;
  const counterW = Math.min(bounds.w, slot.w * 1.5);
  const counterTop = bottom + labelBandPx;
  const counterH = Math.min(slot.h * 0.12, bounds.y + bounds.h - counterTop);
  const counter: StallRect | null =
    counterH >= 6
      ? { x: slot.x - counterW / 2, y: counterTop, w: counterW, h: counterH }
      : null;
  const size = Math.min(PIGGY_MAX_PX, slot.w * 0.5);
  const cy = bottom - size / 2;
  const fitsY =
    cy - size / 2 >= bounds.y && cy + size / 2 <= bounds.y + bounds.h;
  const rightCx = slot.x + slot.w / 2 + PIGGY_GAP_PX + size / 2;
  const leftCx = slot.x - slot.w / 2 - PIGGY_GAP_PX - size / 2;
  let piggy: MarketStallGeometry["piggy"] = null;
  if (fitsY && rightCx + size / 2 <= bounds.x + bounds.w) {
    piggy = { cx: rightCx, cy, size };
  } else if (fitsY && leftCx - size / 2 >= bounds.x) {
    piggy = { cx: leftCx, cy, size };
  }
  return { canopy, counter, piggy };
}

/**
 * Độ phồng theo chiều dọc của heo đất ở `elapsedMs` kể từ lúc có xu rơi vào:
 * sóng sin tắt dần quanh 1, về đúng 1 khi hết nhịp. `reduced_motion` luôn 1.
 */
export function piggyBounceScale(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs <= 0 || elapsedMs >= PIGGY_BOUNCE_MS) {
    return 1;
  }
  const t = elapsedMs / PIGGY_BOUNCE_MS;
  return (
    1 +
    PIGGY_BOUNCE_AMPLITUDE *
      (1 - t) *
      Math.sin(Math.PI * 2 * PIGGY_BOUNCE_CYCLES * t)
  );
}

/** Mái che sọc đỏ–kem có diềm lượn và quầy gỗ; không vẽ gì khi hình học là `null`. */
export function drawMarketStall(
  ctx: CanvasRenderingContext2D,
  geometry: MarketStallGeometry
): void {
  const m = designTokens.colors.montessori;
  ctx.save();
  const { canopy, counter } = geometry;
  if (canopy) {
    const stripeW = canopy.w / CANOPY_STRIPES;
    for (let i = 0; i < CANOPY_STRIPES; i++) {
      // Sọc sáng phải khác nền giấy (`paper`), không thì mái rã thành các cục đỏ rời.
      ctx.fillStyle = i % 2 === 0 ? m.coral : m.amberLight;
      ctx.fillRect(canopy.x + i * stripeW, canopy.y, stripeW, canopy.h);
      // Diềm lượn dưới mỗi sọc
      ctx.beginPath();
      ctx.arc(
        canopy.x + (i + 0.5) * stripeW,
        canopy.y + canopy.h,
        stripeW / 2,
        0,
        Math.PI
      );
      ctx.fill();
    }
  }
  if (counter) {
    ctx.fillStyle = m.woodBorder;
    ctx.fillRect(counter.x, counter.y, counter.w, counter.h);
    ctx.fillStyle = m.woodBevel;
    ctx.fillRect(counter.x, counter.y, counter.w, Math.max(2, counter.h * 0.3));
  }
  ctx.restore();
}

/**
 * Heo đất hồng vẽ vector, tâm `(cx, cy)`, cạnh `size`. `scaleY` (≥ 0) phồng
 * dọc quanh đáy để heo nảy khi có xu rơi vào. Khe bỏ xu là đúng một `roundRect`.
 */
export function drawPiggyBank(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  scaleY: number
): void {
  const m = designTokens.colors.montessori;
  const base = cy + size * 0.4;
  const rx = size * 0.46;
  const ry = size * 0.36;
  ctx.save();
  ctx.translate(cx, base);
  ctx.scale(1, scaleY);
  ctx.translate(-cx, -base);
  ctx.fillStyle = m.coralLight;
  ctx.strokeStyle = m.coral;
  ctx.lineWidth = 2;
  // Chân
  ctx.beginPath();
  ctx.ellipse(
    cx - rx * 0.5,
    cy + ry * 0.95,
    size * 0.1,
    size * 0.09,
    0,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    cx + rx * 0.5,
    cy + ry * 0.95,
    size * 0.1,
    size * 0.09,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  // Thân
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Tai
  ctx.beginPath();
  ctx.ellipse(
    cx - rx * 0.25,
    cy - ry * 0.95,
    size * 0.09,
    size * 0.12,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  // Mõm
  ctx.beginPath();
  ctx.ellipse(
    cx + rx * 0.95,
    cy + ry * 0.1,
    size * 0.1,
    size * 0.13,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  // Mắt
  ctx.fillStyle = designTokens.colors.surface[900];
  ctx.beginPath();
  ctx.arc(cx + rx * 0.5, cy - ry * 0.25, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // Đuôi xoắn
  ctx.beginPath();
  ctx.arc(
    cx - rx * 1.05,
    cy - ry * 0.1,
    size * 0.07,
    0.5 * Math.PI,
    2.4 * Math.PI
  );
  ctx.stroke();
  // Khe bỏ xu trên lưng
  ctx.fillStyle = m.coral;
  ctx.beginPath();
  ctx.roundRect(
    cx - size * 0.12,
    cy - ry * 0.95,
    size * 0.24,
    size * 0.05,
    size * 0.025
  );
  ctx.fill();
  ctx.restore();
}

// ── Nhân vật kể chuyện vẽ vector (Task #313 Đợt A) ───────────────────

/** Nhân vật kể chuyện còn thiếu hình: một nhân vật mỗi khung chuyện. */
export const STORY_CHARACTER_KINDS = [
  "squirrel",
  "monkey",
  "elephant",
  "weasel",
  "hen",
  "butterfly",
  "mouse",
  "hippo",
  "giraffe",
  "beaver",
  "bat",
  "fairy",
  "duck",
  "woodpecker",
  "ant",
  "fox",
  "caterpillar",
  "pony",
  "cricket",
  "robot",
  "nightingale",
] as const;

export type StoryCharacterKind = (typeof STORY_CHARACTER_KINDS)[number];

interface CharacterRect {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

const CHARACTER_MARGIN_PX = 6;
const CHARACTER_CLEARANCE_PX = 4;

/**
 * Chỗ đặt nhân vật cạnh `size` trong `bounds`: thử bốn góc (trên-phải, trên-trái,
 * dưới-phải, dưới-trái), lấy góc đầu tiên không chạm hình nào trong `occupied`
 * (vùng chạm). Không góc nào trống thì `null` — khi đó không vẽ nhân vật.
 */
export function pickCharacterSpot(
  bounds: CharacterRect,
  occupied: readonly CharacterRect[],
  size: number
): { readonly cx: number; readonly cy: number } | null {
  if (
    size <= 0 ||
    bounds.w < size + CHARACTER_MARGIN_PX * 2 ||
    bounds.h < size + CHARACTER_MARGIN_PX * 2
  ) {
    return null;
  }
  const left = bounds.x + CHARACTER_MARGIN_PX + size / 2;
  const right = bounds.x + bounds.w - CHARACTER_MARGIN_PX - size / 2;
  const top = bounds.y + CHARACTER_MARGIN_PX + size / 2;
  const bottom = bounds.y + bounds.h - CHARACTER_MARGIN_PX - size / 2;
  const corners = [
    { cx: right, cy: top },
    { cx: left, cy: top },
    { cx: right, cy: bottom },
    { cx: left, cy: bottom },
  ];
  const pad = CHARACTER_CLEARANCE_PX;
  for (const c of corners) {
    const box = {
      x: c.cx - size / 2 - pad,
      y: c.cy - size / 2 - pad,
      w: size + pad * 2,
      h: size + pad * 2,
    };
    const clear = occupied.every(
      (o) =>
        box.x + box.w <= o.x ||
        o.x + o.w <= box.x ||
        box.y + box.h <= o.y ||
        o.y + o.h <= box.y
    );
    if (clear) {
      return c;
    }
  }
  return null;
}

function characterEyes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dx: number,
  r: number
): void {
  ctx.fillStyle = designTokens.colors.surface[900];
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * dx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function characterBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string,
  rotation = 0
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function characterSmile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawSquirrel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Đuôi xù cong sau lưng, hai tai nhọn, má sáng
  characterBlob(
    ctx,
    cx - r * 1.1,
    cy - r * 0.2,
    r * 0.5,
    r * 1.1,
    m.amberDeep,
    m.amberDark,
    -0.35
  );
  characterBlob(ctx, cx, cy, r, r * 0.9, m.amberDeep, m.amberDark);
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.6,
      cy - r * 0.95,
      r * 0.22,
      r * 0.34,
      m.amberDeep,
      m.amberDark
    );
  }
  characterBlob(
    ctx,
    cx,
    cy + r * 0.3,
    r * 0.55,
    r * 0.4,
    m.amberLight,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.15, r * 0.4, size * 0.05);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonkey(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Hai tai tròn, mặt sáng hình bầu dục
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 1.05,
      cy,
      r * 0.32,
      r * 0.32,
      m.amberDeep,
      m.amberDark
    );
  }
  characterBlob(ctx, cx, cy, r, r * 0.95, m.amberDeep, m.amberDark);
  characterBlob(
    ctx,
    cx,
    cy + r * 0.2,
    r * 0.72,
    r * 0.65,
    m.amberLight,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.1, r * 0.3, size * 0.045);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
  characterSmile(ctx, cx, cy + r * 0.28, r * 0.25);
}

function drawElephant(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Hai tai to, vòi cong xuống
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 1.05,
      cy,
      r * 0.5,
      r * 0.7,
      m.indigoLight,
      m.indigo
    );
  }
  characterBlob(
    ctx,
    cx,
    cy - r * 0.1,
    r * 0.85,
    r * 0.8,
    m.indigoLight,
    m.indigo
  );
  ctx.fillStyle = m.indigoLight;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.2, cy + r * 0.1, r * 0.4, r * 0.95, r * 0.2);
  ctx.fill();
  ctx.stroke();
  characterEyes(ctx, cx, cy - r * 0.3, r * 0.35, size * 0.045);
}

function drawWeasel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Đầu thon, tai tròn nhỏ, mõm và bụng sáng, mặt nạ thám tử
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.65,
      cy - r * 0.8,
      r * 0.2,
      r * 0.2,
      m.amber,
      m.amberDark
    );
  }
  characterBlob(ctx, cx, cy, r * 0.9, r * 0.8, m.amber, m.amberDark);
  characterBlob(
    ctx,
    cx,
    cy + r * 0.35,
    r * 0.5,
    r * 0.35,
    m.amberGlow,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.15, r * 0.35, size * 0.045);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.22, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawHen(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Thân tròn trắng, mào đỏ, mỏ vàng
  ctx.strokeStyle = m.woodBorder;
  characterBlob(ctx, cx, cy, r, r * 0.95, m.paper, m.woodBorder);
  ctx.fillStyle = m.coral;
  ctx.strokeStyle = m.coral;
  for (const dx of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.arc(cx + r * dx, cy - r * 0.98, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = m.amber;
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy + r * 0.05);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.05);
  ctx.lineTo(cx, cy + r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  characterEyes(ctx, cx, cy - r * 0.25, r * 0.38, size * 0.045);
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Bướm: hai cặp cánh, thân dọc, hai râu
  ctx.strokeStyle = m.indigo;
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.65,
      cy - r * 0.35,
      r * 0.62,
      r * 0.5,
      m.coralLight,
      m.coral,
      dir * -0.4
    );
    characterBlob(
      ctx,
      cx + dir * r * 0.5,
      cy + r * 0.45,
      r * 0.42,
      r * 0.35,
      m.indigoLight,
      m.indigo,
      dir * 0.4
    );
  }
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.12, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  for (const dir of [-1, 1]) {
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx + dir * r * 0.4, cy - r * 1.1);
  }
  ctx.stroke();
}

function drawMouse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Hai tai tròn to, mặt xám nhạt, mũi hồng, râu
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.75,
      cy - r * 0.7,
      r * 0.42,
      r * 0.42,
      m.coralLight,
      m.woodBorder
    );
  }
  characterBlob(ctx, cx, cy, r * 0.9, r * 0.85, m.woodBevel, m.woodBorder);
  characterEyes(ctx, cx, cy - r * 0.15, r * 0.32, size * 0.045);
  ctx.fillStyle = m.coral;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.3, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const dir of [-1, 1]) {
    ctx.moveTo(cx + dir * r * 0.2, cy + r * 0.3);
    ctx.lineTo(cx + dir * r * 0.95, cy + r * 0.2);
    ctx.moveTo(cx + dir * r * 0.2, cy + r * 0.38);
    ctx.lineTo(cx + dir * r * 0.95, cy + r * 0.5);
  }
  ctx.stroke();
}

function drawHippo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Đầu to màu tím nhạt, mõm rộng có hai lỗ mũi, tai nhỏ trên đỉnh
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.7,
      cy - r * 0.85,
      r * 0.2,
      r * 0.25,
      m.indigoLight,
      m.indigo
    );
  }
  characterBlob(
    ctx,
    cx,
    cy - r * 0.2,
    r * 0.95,
    r * 0.75,
    m.indigoLight,
    m.indigo
  );
  characterBlob(
    ctx,
    cx,
    cy + r * 0.45,
    r * 0.85,
    r * 0.5,
    m.coralLight,
    m.indigo
  );
  characterEyes(ctx, cx, cy - r * 0.55, r * 0.4, size * 0.045);
  ctx.fillStyle = ink;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.3, cy + r * 0.38, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGiraffe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Cổ dài vàng có đốm, đầu nhỏ, hai sừng nhỏ
  ctx.fillStyle = m.amberLight;
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.3, cy - r * 0.2, r * 0.6, r * 1.3, r * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.amberDeep;
  for (const [dx, dy] of [
    [-0.1, 0.35],
    [0.1, 0.75],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx + r * dx, cy + r * dy, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = m.amberDark;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.2, cy - r * 0.75);
    ctx.lineTo(cx + dir * r * 0.25, cy - r * 1.0);
    ctx.stroke();
    ctx.fillStyle = m.amberDark;
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.25, cy - r * 1.02, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  characterBlob(
    ctx,
    cx,
    cy - r * 0.4,
    r * 0.55,
    r * 0.45,
    m.amberLight,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.5, r * 0.22, size * 0.04);
}

function drawBeaver(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Mặt nâu, tai tròn nhỏ, hai răng cửa to
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.7,
      cy - r * 0.75,
      r * 0.25,
      r * 0.25,
      m.amberDeep,
      m.amberDark
    );
  }
  characterBlob(ctx, cx, cy, r * 0.95, r * 0.85, m.amberDeep, m.amberDark);
  characterBlob(
    ctx,
    cx,
    cy + r * 0.3,
    r * 0.5,
    r * 0.35,
    m.amberLight,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.2, r * 0.38, size * 0.045);
  ctx.fillStyle = m.paper;
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.2, cy + r * 0.35, r * 0.4, r * 0.35, r * 0.06);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.35);
  ctx.lineTo(cx, cy + r * 0.7);
  ctx.stroke();
}

function drawBat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const ink = designTokens.colors.surface[900];
  const r = size * 0.36;
  // Hai cánh dơi xoè, thân tròn tối, tai nhọn
  for (const dir of [-1, 1]) {
    ctx.fillStyle = m.indigo;
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.4, cy - r * 0.1);
    ctx.lineTo(cx + dir * r * 1.25, cy - r * 0.6);
    ctx.lineTo(cx + dir * r * 1.1, cy + r * 0.1);
    ctx.lineTo(cx + dir * r * 0.85, cy + r * 0.0);
    ctx.lineTo(cx + dir * r * 0.7, cy + r * 0.5);
    ctx.lineTo(cx + dir * r * 0.35, cy + r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.2, cy - r * 0.6);
    ctx.lineTo(cx + dir * r * 0.35, cy - r * 1.0);
    ctx.lineTo(cx + dir * r * 0.5, cy - r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  characterBlob(ctx, cx, cy, r * 0.5, r * 0.6, m.indigo, ink);
  ctx.fillStyle = m.amber;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + dir * r * 0.2, cy - r * 0.15, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFairy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Hai cánh mỏng, váy hình chuông, đầu tròn, đũa phép có sao
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.75,
      cy - r * 0.2,
      r * 0.5,
      r * 0.8,
      m.indigoLight,
      m.indigo,
      dir * 0.5
    );
  }
  ctx.fillStyle = m.coralLight;
  ctx.strokeStyle = m.coral;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.2, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.65, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.65, cy + r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  characterBlob(
    ctx,
    cx,
    cy - r * 0.45,
    r * 0.38,
    r * 0.38,
    m.plateLight,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.45, r * 0.16, size * 0.03);
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.3, cy + r * 0.3);
  ctx.lineTo(cx + r * 1.0, cy - r * 0.5);
  ctx.stroke();
  ctx.fillStyle = m.amber;
  ctx.beginPath();
  ctx.arc(cx + r * 1.0, cy - r * 0.55, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawDuck(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Đầu tròn vàng, mỏ dẹt cam, chỏm lông nhỏ
  ctx.strokeStyle = m.amberDark;
  ctx.fillStyle = m.amber;
  for (const dx of [-0.1, 0.1]) {
    ctx.beginPath();
    ctx.arc(cx + r * dx, cy - r * 1.0, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  characterBlob(ctx, cx, cy, r, r * 0.95, m.amber, m.amberDark);
  characterBlob(
    ctx,
    cx,
    cy + r * 0.35,
    r * 0.55,
    r * 0.28,
    m.amberDeep,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.2, r * 0.4, size * 0.045);
}

function drawWoodpecker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Thân đen trắng, mào đỏ, mỏ dài nhọn
  characterBlob(ctx, cx, cy, r * 0.9, r, m.paper, m.woodBorder);
  characterBlob(
    ctx,
    cx - r * 0.45,
    cy + r * 0.1,
    r * 0.4,
    r * 0.8,
    m.indigo,
    m.woodBorder
  );
  ctx.fillStyle = m.coral;
  ctx.strokeStyle = m.coral;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.3, cy - r * 0.9);
  ctx.lineTo(cx, cy - r * 1.35);
  ctx.lineTo(cx + r * 0.3, cy - r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.amberDark;
  ctx.strokeStyle = m.amberDark;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.2, cy - r * 0.35);
  ctx.lineTo(cx + r * 1.0, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.2, cy - r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  characterEyes(ctx, cx + r * 0.1, cy - r * 0.45, r * 0.15, size * 0.04);
}

function characterLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawAnt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  motion: StoryCharacterMotion
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.2;
  // Sáu chân co duỗi ngược pha nhau theo `step` (0..1), rồi ba đốt thân và râu.
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 2;
  const swing = Math.sin((motion.step ?? 0) * Math.PI * 2) * r * 0.35;
  [-1, 0, 1].forEach((leg, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    for (const side of [-1, 1]) {
      characterLine(
        ctx,
        cx + leg * r * 0.9,
        cy,
        cx + leg * r * 0.9 + sign * swing,
        cy + side * r * 1.5
      );
    }
  });
  characterBlob(ctx, cx - r * 1.5, cy, r * 1.2, r, m.woodBorder, m.amberDark);
  characterBlob(ctx, cx, cy, r * 0.8, r * 0.7, m.woodBorder, m.amberDark);
  characterBlob(
    ctx,
    cx + r * 1.4,
    cy,
    r * 0.8,
    r * 0.8,
    m.woodBorder,
    m.amberDark
  );
  characterLine(ctx, cx + r * 1.9, cy - r * 0.5, cx + r * 2.6, cy - r * 1.3);
  characterLine(ctx, cx + r * 1.9, cy + r * 0.1, cx + r * 2.7, cy - r * 0.6);
  characterEyes(ctx, cx + r * 1.7, cy - r * 0.2, r * 0.25, size * 0.025);
}

function drawFox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Tai nhọn, đầu cam, mõm trắng, đuôi xù sau lưng
  characterBlob(
    ctx,
    cx + r * 0.9,
    cy + r * 0.6,
    r * 0.55,
    r * 0.3,
    m.amberDeep,
    m.amberDark,
    -0.6
  );
  ctx.fillStyle = m.amberDeep;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.25, cy - r * 0.6);
    ctx.lineTo(cx + dir * r * 0.85, cy - r * 1.15);
    ctx.lineTo(cx + dir * r * 0.85, cy - r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  characterBlob(ctx, cx, cy, r, r * 0.85, m.amberDeep, m.amberDark);
  characterBlob(
    ctx,
    cx,
    cy + r * 0.35,
    r * 0.55,
    r * 0.4,
    m.paper,
    m.amberDark
  );
  characterBlob(
    ctx,
    cx,
    cy + r * 0.2,
    r * 0.12,
    r * 0.09,
    m.amberDark,
    m.amberDark
  );
  characterEyes(ctx, cx, cy - r * 0.15, r * 0.4, size * 0.04);
}

function drawCaterpillar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.15;
  // Bốn đốt thân xanh nối nhau, đầu cam bên phải có hai râu
  for (let i = 0; i < 4; i++) {
    characterBlob(
      ctx,
      cx - r * 1.5 + i * r * 1.1 - r * 0.6,
      cy + r * 0.4,
      r,
      r,
      m.emeraldBright,
      m.emerald
    );
  }
  const hx = cx + r * 2.6;
  characterBlob(
    ctx,
    hx,
    cy + r * 0.2,
    r * 1.15,
    r * 1.15,
    m.amber,
    m.amberDark
  );
  ctx.strokeStyle = m.amberDark;
  characterLine(ctx, hx - r * 0.3, cy - r * 0.8, hx - r * 0.6, cy - r * 1.7);
  characterLine(ctx, hx + r * 0.3, cy - r * 0.8, hx + r * 0.7, cy - r * 1.7);
  characterEyes(ctx, hx, cy, r * 0.4, size * 0.03);
}

function drawPony(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Bờm chàm sau đầu, tai dựng, mõm dài lệch xuống
  characterBlob(
    ctx,
    cx - r * 0.6,
    cy - r * 0.2,
    r * 0.45,
    r * 0.9,
    m.indigo,
    m.amberDark
  );
  ctx.fillStyle = m.amberLight;
  for (const dx of [0.1, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(cx + r * dx - r * 0.15, cy - r * 0.7);
    ctx.lineTo(cx + r * dx, cy - r * 1.3);
    ctx.lineTo(cx + r * dx + r * 0.2, cy - r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  characterBlob(ctx, cx, cy, r * 0.8, r * 0.9, m.amberLight, m.amberDark);
  characterBlob(
    ctx,
    cx + r * 0.3,
    cy + r * 0.55,
    r * 0.55,
    r * 0.4,
    m.amberLight,
    m.amberDark
  );
  characterBlob(
    ctx,
    cx + r * 0.45,
    cy + r * 0.55,
    r * 0.07,
    r * 0.06,
    m.amberDark,
    m.amberDark
  );
  characterEyes(ctx, cx + r * 0.15, cy - r * 0.2, r * 0.25, size * 0.04);
}

function drawCricket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  motion: StoryCharacterMotion
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.3;
  // Thân xanh, đùi sau to, râu dài; tay trước gõ xuống theo `arm` (0 = nâng, 1 = chạm)
  ctx.strokeStyle = m.emerald;
  ctx.lineWidth = 2;
  characterLine(ctx, cx + r * 0.7, cy - r * 0.9, cx + r * 1.5, cy - r * 1.7);
  characterLine(ctx, cx + r * 0.9, cy - r * 0.8, cx + r * 1.9, cy - r * 1.2);
  characterBlob(
    ctx,
    cx - r * 0.2,
    cy + r * 0.1,
    r * 1.05,
    r * 0.65,
    m.emeraldBright,
    m.emerald,
    -0.15
  );
  characterBlob(
    ctx,
    cx - r * 0.6,
    cy + r * 0.35,
    r * 0.7,
    r * 0.3,
    m.emerald,
    m.emerald,
    0.5
  );
  characterBlob(
    ctx,
    cx + r * 0.85,
    cy - r * 0.35,
    r * 0.5,
    r * 0.5,
    m.emeraldBright,
    m.emerald
  );
  characterEyes(ctx, cx + r * 0.95, cy - r * 0.45, r * 0.15, size * 0.03);
  const arm = motion.arm ?? 0;
  characterLine(
    ctx,
    cx + r * 0.6,
    cy + r * 0.3,
    cx + r * 1.4,
    cy + r * (0.2 + arm * 0.7)
  );
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  motion: StoryCharacterMotion
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  const glow = Math.max(0, Math.min(1, motion.glow ?? 0));
  // Kiểu Bee-Bot: thân tròn dẹt, đèn trên đỉnh nháy theo `glow`
  characterLine(ctx, cx, cy - r * 0.75, cx, cy - r * 1.15);
  ctx.fillStyle = glow > 0.5 ? m.amber : m.coralLight;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 1.2, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.indigoLight;
  ctx.beginPath();
  ctx.roundRect(cx - r, cy - r * 0.75, r * 2, r * 1.5, r * 0.4);
  ctx.fill();
  ctx.stroke();
  characterEyes(ctx, cx, cy - r * 0.15, r * 0.4, size * 0.05);
  ctx.strokeStyle = m.indigo;
  characterLine(ctx, cx - r * 0.35, cy + r * 0.3, cx + r * 0.35, cy + r * 0.3);
  // Hai bánh nhỏ dưới thân
  for (const dir of [-1, 1]) {
    characterBlob(
      ctx,
      cx + dir * r * 0.55,
      cy + r * 0.8,
      r * 0.22,
      r * 0.14,
      m.woodBorder,
      m.amberDark
    );
  }
}

function drawNightingale(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size * 0.36;
  // Đuôi, thân nâu nhạt, cánh, đầu tròn, mỏ vàng, chỏm lông
  characterBlob(
    ctx,
    cx - r * 0.9,
    cy + r * 0.45,
    r * 0.55,
    r * 0.2,
    m.woodBorder,
    m.amberDark,
    -0.5
  );
  characterBlob(
    ctx,
    cx - r * 0.1,
    cy + r * 0.2,
    r * 0.9,
    r * 0.7,
    m.woodBevel,
    m.woodBorder
  );
  characterBlob(
    ctx,
    cx - r * 0.3,
    cy + r * 0.25,
    r * 0.5,
    r * 0.3,
    m.woodBorder,
    m.amberDark,
    -0.3
  );
  characterBlob(
    ctx,
    cx + r * 0.55,
    cy - r * 0.4,
    r * 0.45,
    r * 0.45,
    m.woodBevel,
    m.woodBorder
  );
  ctx.fillStyle = m.amber;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.95, cy - r * 0.5);
  ctx.lineTo(cx + r * 1.4, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.95, cy - r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  characterEyes(ctx, cx + r * 0.65, cy - r * 0.5, 0, size * 0.035);
}

/**
 * Chuyển động nhỏ của nhân vật, mọi trường tuỳ chọn (thiếu = tư thế đứng yên).
 * `bob` dịch dọc (px, dương xuống), `lean` nghiêng quanh tâm (radian), `glow`
 * độ sáng đèn (0..1, robot), `step` pha bước chân (0..1, kiến), `arm` độ hạ
 * tay trước (0..1, dế mèn).
 */
export interface StoryCharacterMotion {
  readonly arm?: number;
  readonly bob?: number;
  readonly glow?: number;
  readonly lean?: number;
  readonly step?: number;
}

const STORY_CHARACTER_DRAWERS: Readonly<
  Record<
    StoryCharacterKind,
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      motion: StoryCharacterMotion
    ) => void
  >
> = {
  squirrel: drawSquirrel,
  monkey: drawMonkey,
  elephant: drawElephant,
  weasel: drawWeasel,
  hen: drawHen,
  butterfly: drawButterfly,
  mouse: drawMouse,
  hippo: drawHippo,
  giraffe: drawGiraffe,
  beaver: drawBeaver,
  bat: drawBat,
  fairy: drawFairy,
  duck: drawDuck,
  woodpecker: drawWoodpecker,
  ant: drawAnt,
  fox: drawFox,
  caterpillar: drawCaterpillar,
  pony: drawPony,
  cricket: drawCricket,
  robot: drawRobot,
  nightingale: drawNightingale,
};

/**
 * Vẽ một nhân vật kể chuyện bằng vài ellipse/đường (tâm `(cx, cy)`, cạnh
 * `size`). Chỉ dùng màu token; chỉ là hình trang trí đặt ngoài vùng chạm.
 */
export function drawStoryCharacter(
  ctx: CanvasRenderingContext2D,
  kind: StoryCharacterKind,
  cx: number,
  cy: number,
  size: number,
  motion: StoryCharacterMotion = {}
): void {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  if (motion.bob !== undefined || motion.lean !== undefined) {
    ctx.translate(cx, cy + (motion.bob ?? 0));
    ctx.rotate(motion.lean ?? 0);
    ctx.translate(-cx, -cy);
  }
  STORY_CHARACTER_DRAWERS[kind](ctx, cx, cy, size, motion);
  ctx.restore();
}

// ── Rèm sân khấu cho bước recall (GT-000, `BR-E000-16`) ──────────────

/** Rèm kéo từ giữa ra hai bên trong ngần này ms khi vào bước `recall`. */
export const CURTAIN_OPEN_MS = 700;
const CURTAIN_PAD_PX = 10;
const CURTAIN_STRIP_PX = 22;
const CURTAIN_FOLDS = 4;

export interface CurtainGeometry {
  /** Tấm rèm trái; `null` khi rộng dưới 1 px. */
  readonly left: CharacterRect | null;
  /** Tấm rèm phải; `null` khi rộng dưới 1 px. */
  readonly right: CharacterRect | null;
  /** Ô sân khấu rèm che (bao các vùng chạm cộng lề). */
  readonly window: CharacterRect;
}

/**
 * Độ mở của rèm ở `elapsedMs` kể từ lúc vào bước: 0 là khép kín, 1 là mở hẳn,
 * theo đường cong êm. `reduced_motion` luôn 1 (trạng thái tĩnh cuối).
 */
export function curtainOpenness(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs >= CURTAIN_OPEN_MS) {
    return 1;
  }
  const p = Math.max(0, elapsedMs / CURTAIN_OPEN_MS);
  return p * p * (3 - 2 * p);
}

/**
 * Hình học hai tấm rèm quanh hàng vật `hitRects` trong bề ngang logic `boundsW`.
 * Khép kín (`openness = 0`) rèm phủ kín ô sân khấu; mở hẳn (`1`) mỗi tấm chỉ còn
 * một dải ngoài mép ô, không chạm vùng chạm nào. Rèm luôn nằm trong `[0, boundsW]`.
 * `null` khi không có vật nào.
 */
export function curtainGeometry(
  hitRects: readonly CharacterRect[],
  boundsW: number,
  openness: number
): CurtainGeometry | null {
  if (hitRects.length === 0) {
    return null;
  }
  const minX = Math.min(...hitRects.map((r) => r.x)) - CURTAIN_PAD_PX;
  const maxX = Math.max(...hitRects.map((r) => r.x + r.w)) + CURTAIN_PAD_PX;
  const minY = Math.min(...hitRects.map((r) => r.y)) - CURTAIN_PAD_PX;
  const maxY = Math.max(...hitRects.map((r) => r.y + r.h)) + CURTAIN_PAD_PX;
  const win = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  const o = Math.min(1, Math.max(0, openness));
  const mid = (minX + maxX) / 2;
  const leftEdge = Math.max(0, minX - CURTAIN_STRIP_PX);
  const rightEdge = Math.min(boundsW, maxX + CURTAIN_STRIP_PX);
  const innerLeft = mid + (minX - mid) * o;
  const innerRight = mid + (maxX - mid) * o;
  const left =
    innerLeft - leftEdge >= 1
      ? { x: leftEdge, y: minY, w: innerLeft - leftEdge, h: win.h }
      : null;
  const right =
    rightEdge - innerRight >= 1
      ? { x: innerRight, y: minY, w: rightEdge - innerRight, h: win.h }
      : null;
  return { left, right, window: win };
}

/** Hai tấm rèm đỏ có nếp gấp và thanh treo gỗ phía trên. */
export function drawCurtains(
  ctx: CanvasRenderingContext2D,
  geometry: CurtainGeometry
): void {
  const m = designTokens.colors.montessori;
  ctx.save();
  ctx.lineWidth = 2;
  for (const drape of [geometry.left, geometry.right]) {
    if (!drape) {
      continue;
    }
    ctx.fillStyle = m.coral;
    ctx.strokeStyle = m.amberDark;
    ctx.fillRect(drape.x, drape.y, drape.w, drape.h);
    ctx.strokeRect(drape.x, drape.y, drape.w, drape.h);
    ctx.strokeStyle = m.coralLight;
    ctx.beginPath();
    for (let i = 1; i < CURTAIN_FOLDS; i++) {
      const fx = drape.x + (drape.w * i) / CURTAIN_FOLDS;
      ctx.moveTo(fx, drape.y);
      ctx.lineTo(fx, drape.y + drape.h);
    }
    ctx.stroke();
  }
  const win = geometry.window;
  const rodL = geometry.left?.x ?? win.x;
  const rodR = geometry.right
    ? geometry.right.x + geometry.right.w
    : win.x + win.w;
  ctx.fillStyle = m.woodBorder;
  ctx.fillRect(rodL, win.y - 6, Math.max(0, rodR - rodL), 6);
  ctx.restore();
}

/** Cạnh nhân vật kể chuyện, px logic (nhỏ, chỉ là điểm nhấn ngoài vùng chạm). */
export const STORY_CHARACTER_SIZE_PX = 52;

/**
 * Chỗ nhân vật kể chuyện trong sân khấu `stage`, tránh mọi vùng chạm của `slots`
 * (ô chạm thật `hitW × hitH`, rộng hơn ô vẽ). `null` khi chưa có sân khấu hoặc
 * không còn góc trống — khi đó không vẽ nhân vật.
 */
export function placeStoryCharacter(
  stage: CharacterRect | undefined,
  slots: readonly Slot[],
  size: number = STORY_CHARACTER_SIZE_PX
): { readonly cx: number; readonly cy: number } | null {
  if (!stage) {
    return null;
  }
  return pickCharacterSpot(
    stage,
    slots.map((s) => ({
      x: s.x - Math.max(s.hitW, s.w) / 2,
      y: s.y - Math.max(s.hitH, s.h) / 2,
      w: Math.max(s.hitW, s.w),
      h: Math.max(s.hitH, s.h),
    })),
    size
  );
}

/** Vẽ nhân vật kể chuyện ở góc trống của sân khấu, nếu có chỗ (`placeStoryCharacter`). */
export function drawStoryCharacterInStage(
  ctx: CanvasRenderingContext2D,
  kind: StoryCharacterKind,
  stage: CharacterRect | undefined,
  slots: readonly Slot[],
  motion: StoryCharacterMotion = {}
): void {
  const spot = placeStoryCharacter(stage, slots);
  if (spot) {
    drawStoryCharacter(
      ctx,
      kind,
      spot.cx,
      spot.cy,
      STORY_CHARACTER_SIZE_PX,
      motion
    );
  }
}

// ── Dây phơi nối rồi "tách" khi cặp chưa đúng (GT-005, `BR-E005-05`) ──

/** Dây nối hai vật tách đôi và co về hai đầu trong ngần này ms. */
export const LINE_SPLIT_MS = 450;

export interface LineSegment {
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

/**
 * Hai nửa của sợi dây từ `from` tới `to` sau `elapsedMs` kể từ lúc thử nối:
 * nửa đầu co về `from`, nửa sau co về `to`, chừa khe giữa ngày một rộng. Trả
 * `null` khi hết nhịp, trước lúc bắt đầu hoặc bật `reduced_motion` (trạng
 * thái tĩnh cuối là không còn dây).
 */
export function splitLineSegments(
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number },
  elapsedMs: number,
  reducedMotion: boolean
): readonly [LineSegment, LineSegment] | null {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= LINE_SPLIT_MS) {
    return null;
  }
  const p = elapsedMs / LINE_SPLIT_MS;
  const reach = 0.5 * (1 - p);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return [
    {
      x1: from.x,
      y1: from.y,
      x2: from.x + dx * reach,
      y2: from.y + dy * reach,
    },
    { x1: to.x, y1: to.y, x2: to.x - dx * reach, y2: to.y - dy * reach },
  ];
}

/** Vẽ hai nửa dây đã tách, mờ dần theo nhịp (`progress` 0..1). */
export function drawSplitLine(
  ctx: CanvasRenderingContext2D,
  segments: readonly [LineSegment, LineSegment],
  progress: number
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const s of segments) {
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Cuộn phim tự chạy và cây lớn dần khi xếp đúng (GT-006, `BR-E006-06`) ──

/** Mỗi thẻ sáng lần lượt cách nhau ngần này ms khi cuộn phim chạy. */
export const FILM_STEP_MS = 450;

export interface FilmPlayback {
  /** Số thẻ đã sáng (0..count), theo thứ tự đã xếp. */
  readonly lit: number;
  /** Thẻ đang "chiếu" (ô đang sáng đậm) hoặc `null` khi đã chiếu xong. */
  readonly playhead: number | null;
}

/**
 * Tiến độ cuộn phim `elapsedMs` sau lúc xếp đúng: thẻ 0 sáng ngay, rồi mỗi
 * `FILM_STEP_MS` sáng thêm một thẻ. `reduced_motion` về trạng thái tĩnh cuối
 * (mọi thẻ đã sáng, không còn đầu chiếu).
 */
export function filmPlayback(
  count: number,
  elapsedMs: number,
  reducedMotion: boolean
): FilmPlayback {
  if (count <= 0) {
    return { lit: 0, playhead: null };
  }
  if (reducedMotion) {
    return { lit: count, playhead: null };
  }
  if (elapsedMs < 0) {
    return { lit: 0, playhead: null };
  }
  const lit = Math.min(count, Math.floor(elapsedMs / FILM_STEP_MS) + 1);
  const finished = elapsedMs >= count * FILM_STEP_MS;
  return { lit, playhead: finished ? null : lit - 1 };
}

/** Tỉ lệ lớn của cây: mỗi thẻ sáng thêm một nấc, 0 (hạt) tới 1 (cây trọn). */
export function treeGrowth(lit: number, count: number): number {
  return count <= 0 ? 0 : Math.min(1, Math.max(0, lit / count));
}

/**
 * Viền khung phim quanh ô `slot` (to hơn ô vẽ 4 px mỗi bên, không đổi vùng
 * chạm). `isPlayhead` vẽ đậm hơn cho thẻ đang chiếu.
 */
export function drawFilmFrameGlow(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isPlayhead: boolean
): void {
  const m = designTokens.colors.montessori;
  const pad = 4;
  ctx.save();
  ctx.strokeStyle = isPlayhead ? m.amberDeep : m.amber;
  ctx.lineWidth = isPlayhead ? 5 : 3;
  ctx.beginPath();
  ctx.roundRect(
    slot.x - slot.w / 2 - pad,
    slot.y - slot.h / 2 - pad,
    slot.w + pad * 2,
    slot.h + pad * 2,
    8
  );
  ctx.stroke();
  ctx.restore();
}

/**
 * Cây lớn dần trong ô vuông cạnh `size` tâm `(cx, cy)`: `growth` 0 là mầm nhỏ,
 * 1 là thân cao với tán tròn và hai quả. Gốc cây cố định ở đáy ô.
 */
export function drawGrowingTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  growth: number
): void {
  const m = designTokens.colors.montessori;
  const g = Math.min(1, Math.max(0, growth));
  const base = cy + size / 2;
  const trunkH = size * (0.12 + 0.4 * g);
  const trunkW = size * (0.06 + 0.06 * g);
  const crown = size * (0.1 + 0.3 * g);
  ctx.save();
  ctx.lineWidth = 2;
  ctx.fillStyle = m.woodBorder;
  ctx.strokeStyle = m.amberDark;
  ctx.fillRect(cx - trunkW / 2, base - trunkH, trunkW, trunkH);
  ctx.fillStyle = m.emeraldBright;
  ctx.strokeStyle = m.emerald;
  ctx.beginPath();
  ctx.arc(cx, base - trunkH - crown * 0.6, crown, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (g >= 1) {
    ctx.fillStyle = m.coral;
    for (const dx of [-0.45, 0.4]) {
      ctx.beginPath();
      ctx.arc(
        cx + crown * dx,
        base - trunkH - crown * 0.5,
        size * 0.04,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

// ── Chuồng "thở" khi trẻ đã cầm vật (GT-008, `BR-E008-07`) ───────────

/** Một nhịp thở của chuồng, ms. */
export const STABLE_BREATH_MS = 1200;
const STABLE_BREATH_AMPLITUDE = 0.06;

/**
 * Độ phồng của chuồng ở đồng hồ khung `timeMs`: quanh 1, nở tới
 * `1 + STABLE_BREATH_AMPLITUDE` rồi xẹp lại. Chỉ thở khi `active` (trẻ đã cầm
 * một vật); `reduced_motion` luôn 1. Mọi chuồng dùng chung một giá trị này.
 */
export function stableBreathScale(
  timeMs: number,
  active: boolean,
  reducedMotion: boolean
): number {
  if (!active || reducedMotion) {
    return 1;
  }
  const phase = (timeMs / STABLE_BREATH_MS) * Math.PI * 2;
  return 1 + STABLE_BREATH_AMPLITUDE * (0.5 + 0.5 * Math.sin(phase));
}

/**
 * Chuồng vẽ vector quanh ô đích `slot`: mái dốc, hai cột và nền, màu gỗ trung
 * tính như nhau cho mọi chuồng nên không lộ ô nào hợp với vật nào. `scale`
 * phồng quanh tâm ô; vùng chạm của ô không đổi.
 */
export function drawStable(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  scale: number
): void {
  const m = designTokens.colors.montessori;
  const w = slot.w * scale;
  const h = slot.h * scale;
  const left = slot.x - w / 2;
  const top = slot.y - h / 2;
  const roofH = h * 0.2;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeStyle = m.woodBorder;
  ctx.fillStyle = m.woodBevel;
  ctx.beginPath();
  ctx.moveTo(left, top + roofH);
  ctx.lineTo(slot.x, top);
  ctx.lineTo(left + w, top + roofH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, top + roofH);
  ctx.lineTo(left, top + h);
  ctx.moveTo(left + w, top + roofH);
  ctx.lineTo(left + w, top + h);
  ctx.moveTo(left, top + h);
  ctx.lineTo(left + w, top + h);
  ctx.stroke();
  ctx.restore();
}

// ── Kính lúp soi ứng viên đang chọn (GT-009, `BR-E009-08`) ───────────

/** Một vòng lắc của kính lúp, ms. */
export const MAGNIFIER_SWAY_MS = 1600;
const MAGNIFIER_SWAY_SHARE = 0.06;

export interface MagnifierPose {
  /** Bán kính vành kính. */
  readonly r: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Tư thế kính lúp soi ô `slot` ở đồng hồ khung `timeMs`: vành bao quanh ô, lắc
 * nhẹ quanh tâm ô theo sóng sin. `reduced_motion` đứng yên ở tâm ô.
 */
export function magnifierPose(
  slot: Slot,
  timeMs: number,
  reducedMotion: boolean
): MagnifierPose {
  const r = Math.min(slot.w, slot.h) * 0.5;
  const swing = reducedMotion ? 0 : r * MAGNIFIER_SWAY_SHARE;
  const phase = (timeMs / MAGNIFIER_SWAY_MS) * Math.PI * 2;
  return {
    x: slot.x + swing * Math.sin(phase),
    y: slot.y + swing * Math.cos(phase),
    r,
  };
}

/**
 * Kính lúp vẽ vector: vành gỗ rỗng (không che vật bên trong) kèm tay cầm chéo
 * xuống dưới-phải và một vệt sáng trên mặt kính.
 */
export function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  pose: MagnifierPose
): void {
  const m = designTokens.colors.montessori;
  const handleLen = pose.r * 0.9;
  const dx = Math.SQRT1_2;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = Math.max(4, pose.r * 0.16);
  ctx.beginPath();
  ctx.moveTo(pose.x + pose.r * dx, pose.y + pose.r * dx);
  ctx.lineTo(
    pose.x + (pose.r + handleLen) * dx,
    pose.y + (pose.r + handleLen) * dx
  );
  ctx.stroke();
  ctx.strokeStyle = m.amberDeep;
  ctx.lineWidth = Math.max(3, pose.r * 0.1);
  ctx.beginPath();
  ctx.arc(pose.x, pose.y, pose.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = m.amberGlow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(pose.x, pose.y, pose.r * 0.7, 1.15 * Math.PI, 1.45 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

// ── Bảng giá có xu thật (GT-010, `BR-E010-07`) ───────────────────────

/** Số xu tối đa vẽ trên một thẻ giá; giá lớn hơn thì thẻ chỉ có chữ số, không xu. */
export const PRICE_COINS_MAX = 10;

export interface PriceCoin {
  readonly r: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Vị trí các xu trên dải đáy của thẻ giá `slot`: đúng `value` xu xếp đều một
 * hàng, tâm nằm trong ô và xu không chồng nhau. Giá không dương hoặc lớn hơn
 * `PRICE_COINS_MAX` thì không có xu — số xu luôn bằng đúng giá, không cắt bớt
 * (cắt ở 10 xu cho giá 11 là dạy trẻ đếm sai).
 */
export function priceCoinLayout(
  slot: Slot,
  value: number
): readonly PriceCoin[] {
  const count = Math.max(0, Math.floor(value));
  if (count === 0 || count > PRICE_COINS_MAX) {
    return [];
  }
  const r = Math.min(slot.h * 0.09, (slot.w * 0.8) / (count * 2.4));
  const pitch = r * 2.4;
  const rowW = pitch * (count - 1);
  const y = slot.y + slot.h / 2 - r - 4;
  return Array.from({ length: count }, (_, i) => ({
    x: slot.x - rowW / 2 + i * pitch,
    y,
    r,
  }));
}

/**
 * Thẻ giá gỗ vẽ vector trong ô `slot` (có lỗ xỏ dây bên trái) cùng hàng xu thật
 * theo `value`: trẻ đếm được giá thay vì chỉ đọc con số.
 */
export function drawPriceTag(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  value: number
): void {
  const m = designTokens.colors.montessori;
  const inset = 3;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.fillStyle = m.plateLight;
  ctx.strokeStyle = m.woodBorder;
  ctx.beginPath();
  ctx.roundRect(
    slot.x - slot.w / 2 + inset,
    slot.y - slot.h / 2 + inset,
    slot.w - inset * 2,
    slot.h - inset * 2,
    8
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.woodBevel;
  ctx.beginPath();
  ctx.arc(slot.x - slot.w / 2 + inset + 9, slot.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.amber;
  ctx.strokeStyle = m.amberDark;
  ctx.lineWidth = 1.5;
  for (const coin of priceCoinLayout(slot, value)) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ── Hàng/cột sáng khi phương án thử khớp (GT-011, `BR-E011-06`) ───────

/** Một nhịp sáng của hàng/cột khớp, ms. */
export const MATCH_GLOW_MS = 1400;
const MATCH_GLOW_MIN_ALPHA = 0.12;
const MATCH_GLOW_MAX_ALPHA = 0.32;

/**
 * Độ đậm của lớp sáng phủ hàng/cột khớp ở đồng hồ khung `timeMs`: sóng sin giữa
 * mức tối thiểu và tối đa. `reduced_motion` đứng ở mức giữa (trạng thái tĩnh).
 */
export function matchGlowAlpha(timeMs: number, reducedMotion: boolean): number {
  const mid = (MATCH_GLOW_MIN_ALPHA + MATCH_GLOW_MAX_ALPHA) / 2;
  if (reducedMotion) {
    return mid;
  }
  const amp = (MATCH_GLOW_MAX_ALPHA - MATCH_GLOW_MIN_ALPHA) / 2;
  return mid + amp * Math.sin((timeMs / MATCH_GLOW_MS) * Math.PI * 2);
}

/** Lớp sáng hổ phách bo góc phủ một hàng hoặc cột khớp, trong `box`. */
export function drawMatchGlow(
  ctx: CanvasRenderingContext2D,
  box: {
    readonly h: number;
    readonly w: number;
    readonly x: number;
    readonly y: number;
  },
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.restore();
}

// ── Hàng/cột sáng khi đủ và không trùng (GT-015, `BR-E015-09`) ────────

/** Hàng và cột (chỉ số) đã điền **đủ** ô và **không** hai ô nào cùng ký hiệu. */
export interface CompleteLines {
  readonly cols: readonly number[];
  readonly rows: readonly number[];
}

function isCompleteDistinct(values: readonly (string | null)[]): boolean {
  if (values.length === 0 || values.some((v) => v === null)) {
    return false;
  }
  return new Set(values).size === values.length;
}

/**
 * Hàng/cột đủ không trùng của lưới `size × size`. `valueAt(row, col)` là ký hiệu
 * đang ở ô (hoặc `null` khi trống). Chỉ đọc trạng thái hiện tại của lưới — một
 * luật như nhau cho mọi ô, không đọc lời giải.
 */
export function completeDistinctLines(
  size: number,
  valueAt: (row: number, col: number) => string | null
): CompleteLines {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i < size; i++) {
    const rowVals: (string | null)[] = [];
    const colVals: (string | null)[] = [];
    for (let j = 0; j < size; j++) {
      rowVals.push(valueAt(i, j));
      colVals.push(valueAt(j, i));
    }
    if (isCompleteDistinct(rowVals)) {
      rows.push(i);
    }
    if (isCompleteDistinct(colVals)) {
      cols.push(i);
    }
  }
  return { rows, cols };
}

// ── Chùm sáng đèn pin và bóng đổ trên tường (GT-019, `BR-E019-08`) ────

/** Chùm sáng và bóng hiện dần trong ngần này ms sau khi mảnh vào ô đích. */
export const BEAM_FADE_MS = 450;

/** Độ hiện 0..1 của chùm sáng/bóng sau `elapsedMs`; `reduced_motion` hiện đủ ngay. */
export function beamFadeIn(elapsedMs: number, reducedMotion: boolean): number {
  if (reducedMotion) {
    return 1;
  }
  return Math.min(1, Math.max(0, elapsedMs / BEAM_FADE_MS));
}

interface BeamTarget {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

/** Hình thang chùm sáng từ `from` tới ô `target` (tâm `x, y`): hai mép mở rộng thành bề ngang ô. */
export function flashlightBeamPolygon(
  from: { readonly x: number; readonly y: number },
  target: BeamTarget
): { readonly x: number; readonly y: number }[] {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    return [];
  }
  const px = -dy / len;
  const py = dx / len;
  const half = (Math.max(target.w, target.h) / 2) * 1.15;
  const narrow = 3;
  return [
    { x: from.x + px * narrow, y: from.y + py * narrow },
    { x: target.x + px * half, y: target.y + py * half },
    { x: target.x - px * half, y: target.y - py * half },
    { x: from.x - px * narrow, y: from.y - py * narrow },
  ];
}

/** Chùm sáng hổ phách từ đèn pin tới ô đích đã đặt mảnh, `strength` 0..1. */
export function drawFlashlightBeam(
  ctx: CanvasRenderingContext2D,
  from: { readonly x: number; readonly y: number },
  target: BeamTarget,
  strength: number
): void {
  const poly = flashlightBeamPolygon(from, target);
  const first = poly[0];
  if (!first || strength <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.28 * Math.min(1, strength);
  ctx.fillStyle = designTokens.colors.montessori.amberGlow;
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const pt of poly.slice(1)) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Bóng đổ mềm lệch xuống-phải của mảnh đã đặt trên tường, `strength` 0..1. */
export function drawWallShadow(
  ctx: CanvasRenderingContext2D,
  slot: BeamTarget,
  strength: number
): void {
  if (strength <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.22 * Math.min(1, strength);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  const w = slot.w * 0.9;
  const h = slot.h * 0.9;
  ctx.beginPath();
  ctx.roundRect(
    slot.x - w / 2 + slot.w * 0.08,
    slot.y - h / 2 + slot.h * 0.1,
    w,
    h,
    12
  );
  ctx.fill();
  ctx.restore();
}

// ── Mặt gương loé sáng, ảnh phản chiếu hiện dần (GT-021, `BR-E021-08`) ─

/** Ảnh phản chiếu của vật vừa đặt hiện dần trong ngần này ms. */
export const MIRROR_REVEAL_MS = 450;
/** Trục gương loé sáng trong ngần này ms sau lần đặt đúng. */
export const MIRROR_FLASH_MS = 600;

/** Độ hiện 0..1 của ảnh phản chiếu sau `elapsedMs`; `reduced_motion` hiện đủ ngay. */
export function mirrorRevealAlpha(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return 1;
  }
  return Math.min(1, Math.max(0, elapsedMs / MIRROR_REVEAL_MS));
}

/**
 * Cường độ loé 0..1 của trục gương `elapsedMs` sau lần đặt đúng: tắt dần tuyến
 * tính. Hết `MIRROR_FLASH_MS` hoặc `reduced_motion` (trạng thái tĩnh cuối) là 0.
 */
export function mirrorFlashStrength(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= MIRROR_FLASH_MS) {
    return 0;
  }
  return 1 - elapsedMs / MIRROR_FLASH_MS;
}

/** Quầng sáng phủ trục gương trong `area` (cùng hộp với `drawMirrorAxis`). */
export function drawMirrorFlash(
  ctx: CanvasRenderingContext2D,
  axis: "vertical" | "horizontal",
  area: {
    readonly h: number;
    readonly w: number;
    readonly x: number;
    readonly y: number;
  },
  strength: number
): void {
  if (strength <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.55 * Math.min(1, strength);
  ctx.strokeStyle = designTokens.colors.montessori.amberGlow;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (axis === "vertical") {
    ctx.moveTo(area.x + area.w / 2, area.y);
    ctx.lineTo(area.x + area.w / 2, area.y + area.h);
  } else {
    ctx.moveTo(area.x, area.y + area.h / 2);
    ctx.lineTo(area.x + area.w, area.y + area.h / 2);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Mảnh gỗ rung nhẹ khi khớp neo (GT-023, `BR-E023-10`) ──────────────

/** Mảnh vừa khớp neo rung tắt dần trong ngần này ms. */
export const SNAP_WOBBLE_MS = 400;
/** Biên độ rung ngang lớn nhất, px logic. */
export const SNAP_WOBBLE_AMPLITUDE_PX = 3;
const SNAP_WOBBLE_CYCLES = 3;

/**
 * Độ lệch ngang (px) của mảnh vừa khớp `elapsedMs` sau lúc khớp: sóng sin tắt
 * dần về 0 sau `SNAP_WOBBLE_MS`. `reduced_motion` là 0 (trạng thái tĩnh cuối).
 */
export function snapWobbleOffset(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= SNAP_WOBBLE_MS) {
    return 0;
  }
  const t = elapsedMs / SNAP_WOBBLE_MS;
  return (
    SNAP_WOBBLE_AMPLITUDE_PX *
    (1 - t) *
    Math.sin(t * SNAP_WOBBLE_CYCLES * Math.PI * 2)
  );
}

// ── Kiến bò dọc nét đã vẽ, tổ kiến ở điểm cuối (GT-024, `BR-E024-06`) ──

export interface CrawlPoint {
  readonly x: number;
  readonly y: number;
}

/** Kiến bò với tốc độ này (px logic / ms) dọc nét đã vẽ. */
export const ANT_CRAWL_SPEED_PX_PER_MS = 0.3;
/** Một lần bò dài tối thiểu / tối đa (ms), để đoạn rất ngắn hay rất dài vẫn đọc được. */
export const ANT_CRAWL_MIN_MS = 300;
export const ANT_CRAWL_MAX_MS = 1600;
/** Số chu kỳ chân kiến co duỗi trong một giây khi bò. */
const ANT_STEPS_PER_SECOND = 4;

export interface AntCrawl {
  /** Hướng bò (radian), 0 = sang phải. */
  readonly heading: number;
  readonly moving: boolean;
  /** Pha bước chân 0..1; 0 khi đứng yên. */
  readonly step: number;
  readonly x: number;
  readonly y: number;
}

function polylineLength(path: readonly CrawlPoint[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (a && b) {
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  return len;
}

/** Thời gian (ms) kiến bò hết `path`. */
export function antCrawlDurationMs(path: readonly CrawlPoint[]): number {
  return Math.min(
    ANT_CRAWL_MAX_MS,
    Math.max(ANT_CRAWL_MIN_MS, polylineLength(path) / ANT_CRAWL_SPEED_PX_PER_MS)
  );
}

/**
 * Chỗ kiến sau `elapsedMs` kể từ lúc bắt đầu bò dọc `path` (điểm đầu là chỗ cũ
 * của kiến, các điểm sau là chính những điểm nối đã đồ xong). Kiến chỉ đi trên
 * đoạn nét đã vẽ, không bao giờ đi tới điểm chưa nối. Hết nhịp hoặc bật
 * `reduced_motion`: đứng ở điểm cuối (trạng thái tĩnh cuối).
 */
export function antCrawl(
  path: readonly CrawlPoint[],
  elapsedMs: number,
  reducedMotion: boolean
): AntCrawl | null {
  const last = path.at(-1);
  if (!last) {
    return null;
  }
  const prev = path.at(-2) ?? last;
  const endHeading = Math.atan2(last.y - prev.y, last.x - prev.x);
  const duration = antCrawlDurationMs(path);
  if (reducedMotion || elapsedMs >= duration || path.length < 2) {
    return {
      x: last.x,
      y: last.y,
      heading: endHeading,
      moving: false,
      step: 0,
    };
  }
  let remaining = (Math.max(0, elapsedMs) / duration) * polylineLength(path);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (!(a && b)) {
      continue;
    }
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= seg && seg > 0) {
      const t = remaining / seg;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        heading: Math.atan2(b.y - a.y, b.x - a.x),
        moving: true,
        step: ((elapsedMs / 1000) * ANT_STEPS_PER_SECOND) % 1,
      };
    }
    remaining -= seg;
  }
  return { x: last.x, y: last.y, heading: endHeading, moving: false, step: 0 };
}

const ANT_SIZE_PX = 30;
const ANT_NEST_RX_PX = 30;
const ANT_NEST_RY_PX = 20;
/** Kiến đậu cách điểm đầu ngần này (px) khi chưa nối điểm nào. */
export const ANT_PERCH_PX = 40;

/** Nửa cạnh hộp bao của kiến (px logic), để giữ kiến trọn trong sân khấu. */
export const ANT_HALF_PX = 18;

/** Hộp chữ nhật (tâm + nửa cạnh) mà kiến hay tổ không được đè lên. */
export interface AvoidBox {
  readonly halfH: number;
  readonly halfW: number;
  readonly x: number;
  readonly y: number;
}

/** Hộp bao của tổ kiến so với điểm neo: tâm lệch xuống 6 px, nửa cạnh 30 x 20 (cộng nét viền). */
const ANT_NEST_BOX_DY_PX = 6;
const ANT_NEST_BOX_HALF_W_PX = ANT_NEST_RX_PX + 1;
const ANT_NEST_BOX_HALF_H_PX = ANT_NEST_RY_PX + 1;
/** Các khoảng lùi thử lần lượt khi chỗ gần nhất bị chiếm (px). */
const SPOT_DISTANCES_PX = [0, 50, 70, 90, 115, 140, 170, 200] as const;

function boxInsideStage(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  stage: CharacterRect | undefined
): boolean {
  return (
    stage === undefined ||
    (x - halfW >= stage.x &&
      y - halfH >= stage.y &&
      x + halfW <= stage.x + stage.w &&
      y + halfH <= stage.y + stage.h)
  );
}

function boxClearOf(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  avoid: readonly AvoidBox[]
): boolean {
  return avoid.every(
    (b) =>
      Math.abs(x - b.x) >= halfW + b.halfW ||
      Math.abs(y - b.y) >= halfH + b.halfH
  );
}

/** Tám hướng đơn vị, bắt đầu từ `primary`, xoay dần ±45°, ±90°, ±135°, 180°. */
function directionsFrom(primary: {
  readonly x: number;
  readonly y: number;
}): { x: number; y: number }[] {
  const base = Math.atan2(primary.y, primary.x);
  return [0, 1, -1, 2, -2, 3, -3, 4].map((k) => ({
    x: Math.cos(base + (k * Math.PI) / 4),
    y: Math.sin(base + (k * Math.PI) / 4),
  }));
}

/**
 * Chỗ kiến đậu trước khi nối điểm nào: lùi khỏi điểm đầu `ANT_PERCH_PX` theo hướng
 * ngược đoạn đầu, nên không đè điểm trẻ phải chạm đầu tiên. Hướng đó (rồi hai
 * hướng vuông góc, rồi hướng xuôi đoạn đầu) mà làm kiến ra ngoài `stage` thì thử
 * hướng kế; không hướng nào trọn trong sân khấu thì `null` (không vẽ kiến cho tới
 * khi điểm đầu được nối).
 *
 * `avoid` (hộp chạm của mọi điểm mốc, hộp tổ): kiến không được đè hộp nào. Khi đó
 * thử thêm bốn hướng chéo và các khoảng lùi xa dần (`BR-E024-08`).
 */
export function antPerchPoint(
  first: CrawlPoint,
  second: CrawlPoint | undefined,
  stage?: CharacterRect,
  avoid: readonly AvoidBox[] = []
): CrawlPoint | null {
  const hasPath =
    second !== undefined && (second.x !== first.x || second.y !== first.y);
  const len = hasPath ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
  const ux = hasPath ? (second.x - first.x) / len : 0;
  const uy = hasPath ? (second.y - first.y) / len : 1;
  const compass = directionsFrom({ x: -ux, y: -uy });
  // Bốn hướng gốc giữ nguyên thứ tự cũ; bốn hướng chéo (±45°, ±135°) xếp sau.
  const directions = [
    { x: -ux, y: -uy },
    { x: -uy, y: ux },
    { x: uy, y: -ux },
    { x: ux, y: uy },
    ...[1, 2, 5, 6].map((i) => compass[i] ?? { x: 0, y: 1 }),
  ];
  const distances =
    avoid.length === 0
      ? [ANT_PERCH_PX]
      : [ANT_PERCH_PX, ...SPOT_DISTANCES_PX.filter((d) => d > ANT_PERCH_PX)];
  for (const dist of distances) {
    for (const d of directions) {
      const point = { x: first.x + d.x * dist, y: first.y + d.y * dist };
      if (
        boxInsideStage(point.x, point.y, ANT_HALF_PX, ANT_HALF_PX, stage) &&
        boxClearOf(point.x, point.y, ANT_HALF_PX, ANT_HALF_PX, avoid)
      ) {
        return point;
      }
    }
  }
  return null;
}

/**
 * Chỗ đặt tổ kiến cạnh điểm cuối `last`: không đè hộp nào trong `avoid` (hộp chạm
 * của mọi điểm mốc, kể cả chính điểm cuối), trọn trong `stage`. Ưu tiên nửa phía
 * ngoài (từ `toward`, tâm hình, ra xa) ở mọi khoảng trước, rồi mới tới phía trong;
 * không có chỗ thì `null` (không vẽ tổ). `BR-E024-08`.
 */
export function antNestPoint(
  last: CrawlPoint,
  stage: CharacterRect | undefined,
  avoid: readonly AvoidBox[],
  toward?: CrawlPoint
): CrawlPoint | null {
  const dx = toward ? last.x - toward.x : 0;
  const dy = toward ? last.y - toward.y : 1;
  const norm = Math.hypot(dx, dy);
  const primary = norm > 0 ? { x: dx / norm, y: dy / norm } : { x: 0, y: 1 };
  const directions = directionsFrom(primary);
  // Năm hướng đầu (ra xa tâm, ±45°, ±90°) thử hết mọi khoảng trước; ba hướng vào
  // trong hình chỉ dùng khi phía ngoài không còn chỗ, kẻo tổ nằm giữa hình.
  const passes = [directions.slice(0, 5), directions.slice(5)];
  for (const pass of passes) {
    const point = firstNestSpot(last, stage, avoid, pass);
    if (point) {
      return point;
    }
  }
  return null;
}

function firstNestSpot(
  last: CrawlPoint,
  stage: CharacterRect | undefined,
  avoid: readonly AvoidBox[],
  directions: readonly { readonly x: number; readonly y: number }[]
): CrawlPoint | null {
  for (const dist of SPOT_DISTANCES_PX) {
    for (const d of directions) {
      const point = { x: last.x + d.x * dist, y: last.y + d.y * dist };
      const cy = point.y + ANT_NEST_BOX_DY_PX;
      if (
        boxInsideStage(
          point.x,
          cy,
          ANT_NEST_BOX_HALF_W_PX,
          ANT_NEST_BOX_HALF_H_PX,
          stage
        ) &&
        boxClearOf(
          point.x,
          cy,
          ANT_NEST_BOX_HALF_W_PX,
          ANT_NEST_BOX_HALF_H_PX,
          avoid
        )
      ) {
        return point;
      }
    }
  }
  return null;
}

/** Hộp bao của tổ kiến đặt tại `point`, để kiến tránh. */
export function antNestBox(point: CrawlPoint): AvoidBox {
  return {
    x: point.x,
    y: point.y + ANT_NEST_BOX_DY_PX,
    halfW: ANT_NEST_BOX_HALF_W_PX,
    halfH: ANT_NEST_BOX_HALF_H_PX,
  };
}

/** Tổ kiến: gò đất nâu với cửa tối, vẽ dưới điểm cuối của nét. */
export function drawAntNest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  const m = designTokens.colors.montessori;
  ctx.save();
  ctx.lineWidth = 2;
  characterBlob(
    ctx,
    x,
    y + 6,
    ANT_NEST_RX_PX,
    ANT_NEST_RY_PX,
    m.woodBevel,
    m.woodBorder
  );
  characterBlob(
    ctx,
    x,
    y + 12,
    ANT_NEST_RX_PX * 0.35,
    ANT_NEST_RY_PX * 0.3,
    designTokens.colors.surface[900],
    m.woodBorder
  );
  ctx.restore();
}

/** Kiến vẽ tại `(x, y)` quay theo `heading`, chân co duỗi theo `step`. */
export function drawCrawlingAnt(
  ctx: CanvasRenderingContext2D,
  crawl: AntCrawl
): void {
  drawStoryCharacter(ctx, "ant", crawl.x, crawl.y, ANT_SIZE_PX, {
    lean: crawl.heading,
    step: crawl.step,
  });
}

// ── Nước dâng trong cốc, Ngựa Con uống (GT-032, `BR-E032-14`) ────────

/** Mực nước dâng êm sang vạch mới trong ngần này ms sau mỗi nấc rót. */
export const WATER_RISE_MS = 350;
/** Ngựa Con cúi xuống uống rồi ngẩng lên trong ngần này ms sau mỗi nấc rót. */
export const PONY_DRINK_MS = 800;
const PONY_DRINK_LEAN_RAD = 0.35;
const PONY_DRINK_BOB_PX = 4;

/**
 * Mực nước hiển thị (đơn vị vạch, có thể lẻ) sau `elapsedMs` kể từ lúc đổi từ
 * `from` sang `to`: dâng/hạ êm rồi đứng ở `to`. `reduced_motion` hay hết nhịp là
 * `to` (trạng thái tĩnh cuối). Chỉ phụ thuộc thao tác rót của trẻ, không đọc đáp án.
 */
export function waterRiseLevel(
  from: number,
  to: number,
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs >= WATER_RISE_MS) {
    return to;
  }
  const t = Math.min(1, Math.max(0, elapsedMs / WATER_RISE_MS));
  return from + (to - from) * (1 - (1 - t) ** 3);
}

/**
 * Chuyển động của Ngựa Con sau một nấc rót: cúi dần rồi ngẩng, một nhịp
 * `PONY_DRINK_MS`. Ngoài nhịp hoặc `reduced_motion` là đứng yên (`{}`).
 */
export function ponyDrinkMotion(
  elapsedMs: number,
  reducedMotion: boolean
): StoryCharacterMotion {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= PONY_DRINK_MS) {
    return {};
  }
  const bow = Math.sin((Math.PI * elapsedMs) / PONY_DRINK_MS);
  return { lean: bow * PONY_DRINK_LEAN_RAD, bob: bow * PONY_DRINK_BOB_PX };
}

// ── Khung hoa văn thổ cẩm quanh lưới dệt (GT-033, `BR-E033-06`) ──────

/** Bề dày dải thổ cẩm quanh lưới (px logic), tối đa; co lại khi sân khấu chật. */
export const BROCADE_BAND_PX = 14;
/** Dưới ngần này thì không vẽ dải (quá mỏng để thấy hoa văn). */
export const BROCADE_MIN_BAND_PX = 6;

export interface BrocadeFrame {
  readonly band: number;
  /** Hộp lưới bên trong dải. */
  readonly inner: CharacterRect;
}

/**
 * Dải thổ cẩm bao quanh `grid`: dày `BROCADE_BAND_PX`, co lại để nằm trọn trong
 * `stage` (nếu có). Dải luôn ở **ngoài** hộp lưới nên không che ô nào; còn chỗ
 * dưới `BROCADE_MIN_BAND_PX` thì `null` (không vẽ).
 */
export function brocadeFrame(
  grid: CharacterRect,
  stage: CharacterRect | undefined
): BrocadeFrame | null {
  const room = stage
    ? Math.min(
        grid.x - stage.x,
        grid.y - stage.y,
        stage.x + stage.w - (grid.x + grid.w),
        stage.y + stage.h - (grid.y + grid.h)
      )
    : BROCADE_BAND_PX;
  const band = Math.min(BROCADE_BAND_PX, room);
  return band < BROCADE_MIN_BAND_PX ? null : { band, inner: grid };
}

/**
 * Vẽ dải thổ cẩm quanh lưới: nền gỗ nhạt, hàng hình thoi và viền răng cưa màu
 * gỗ — hoa văn trung tính, không dùng màu sợi nên không lẫn với màu trẻ phải chọn.
 */
export function drawBrocadeFrame(
  ctx: CanvasRenderingContext2D,
  frame: BrocadeFrame
): void {
  const m = designTokens.colors.montessori;
  const { band, inner } = frame;
  const x = inner.x - band;
  const y = inner.y - band;
  const w = inner.w + band * 2;
  const h = inner.h + band * 2;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.fillStyle = m.woodBevel;
  ctx.strokeStyle = m.woodBorder;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, band * 0.6);
  ctx.roundRect(inner.x, inner.y, inner.w, inner.h, 2);
  ctx.fill("evenodd");
  ctx.stroke();
  // Hàng hình thoi dọc bốn cạnh, cách nhau hai lần bề dày dải
  const step = band * 2;
  const r = band * 0.3;
  ctx.fillStyle = m.woodBorder;
  const diamond = (cx: number, cy: number): void => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
  };
  for (let px = x + band; px < x + w - band * 0.5; px += step) {
    diamond(px, y + band / 2);
    diamond(px, y + h - band / 2);
  }
  for (let py = y + band * 2; py < y + h - band * 1.5; py += step) {
    diamond(x + band / 2, py);
    diamond(x + w - band / 2, py);
  }
  ctx.restore();
}

/**
 * Cuộn len vẽ vector, tô bằng chính màu của sợi (không dùng emoji 🧶 một màu):
 * thân tròn, các vòng len quấn chéo sáng hơn, đuôi sợi thòng xuống, kèm dấu hình
 * theo màu cho trẻ mù màu (`BR-A11-03`).
 */
export function drawYarnBall(
  ctx: CanvasRenderingContext2D,
  colorId: string,
  cx: number,
  cy: number,
  radius: number
): void {
  const fill = getColorForYarn(colorId);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = designTokens.colors.surface[800];
  ctx.lineWidth = Math.max(2, radius * 0.08);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Vòng len quấn chéo, cắt trong thân cuộn
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.45);
  ctx.lineWidth = Math.max(2, radius * 0.07);
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + k * radius,
      radius * 1.1,
      radius * 0.45,
      -0.5,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();
  // Đuôi sợi
  ctx.save();
  ctx.strokeStyle = fill;
  ctx.lineWidth = Math.max(2, radius * 0.1);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.7, cy + radius * 0.7);
  ctx.quadraticCurveTo(
    cx + radius * 1.1,
    cy + radius * 0.95,
    cx + radius * 0.85,
    cy + radius * 1.1
  );
  ctx.stroke();
  ctx.restore();
  drawYarnMark(ctx, colorId, cx, cy, radius * 0.7);
}

// ── Sợi chỉ kéo dài theo ngón tay (GT-033, `BR-E033-07`) ──────────────

export interface YarnPoint {
  readonly x: number;
  readonly y: number;
}

/** Hình chữ nhật vùng được vẽ (sân khấu hoặc khay). */
export interface YarnRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Một sợi đang kéo: từ tâm cuộn tới ngón tay; `straight` là `reduced_motion`.
 * `clip` là các vùng engine được vẽ (`BR-PSZ-01`): nét sợi bị cắt theo hợp của
 * chúng, nên đoạn đi qua khe giữa khay và sân khấu không vẽ. Rỗng thì không cắt.
 */
export interface YarnThread {
  readonly from: YarnPoint;
  readonly to: YarnPoint;
  readonly colorId: string;
  readonly straight: boolean;
  readonly clip: readonly YarnRect[];
}

/** Võng của sợi so với độ dài (tỉ lệ) khi không `reduced_motion`. */
const YARN_SAG_RATIO = 0.12;
/** Nét sợi: viền sáng ngoài và lõi màu. */
const YARN_THREAD_OUTER_PX = 9;
const YARN_THREAD_CORE_PX = 5;
/** Nút đầu sợi dưới ngón tay. */
const YARN_TIP_RADIUS_PX = 7;
const YARN_TIP_STROKE_PX = 2;
/** Đầu sợi lùi vào trong sân khấu đủ để nút đầu sợi kể cả viền nằm trọn bên trong. */
export const YARN_TIP_INSET_PX = YARN_TIP_RADIUS_PX + YARN_TIP_STROKE_PX / 2;

/** Kẹp đầu sợi trong sân khấu, chừa `YARN_TIP_INSET_PX`; không có sân khấu thì giữ nguyên. */
export function clampYarnThreadTip(
  point: YarnPoint,
  stage: CharacterRect | undefined
): YarnPoint {
  if (!stage) {
    return { x: point.x, y: point.y };
  }
  const inset = Math.min(YARN_TIP_INSET_PX, stage.w / 2, stage.h / 2);
  return {
    x: Math.min(stage.x + stage.w - inset, Math.max(stage.x + inset, point.x)),
    y: Math.min(stage.y + stage.h - inset, Math.max(stage.y + inset, point.y)),
  };
}

/**
 * Vẽ sợi chỉ: viền sáng rồi lõi màu cuộn, võng nhẹ xuống dưới; `straight` vẽ
 * thẳng. Màu chỉ phụ thuộc cuộn trẻ kéo nên không gợi ý ô đúng.
 */
export function drawYarnThread(
  ctx: CanvasRenderingContext2D,
  thread: YarnThread
): void {
  const { from, to, colorId, straight, clip } = thread;
  const sag = straight
    ? 0
    : Math.hypot(to.x - from.x, to.y - from.y) * YARN_SAG_RATIO;
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2 + sag,
      to.x,
      to.y
    );
  };
  ctx.save();
  if (clip.length > 0) {
    ctx.beginPath();
    for (const r of clip) {
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.clip();
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = YARN_THREAD_OUTER_PX;
  path();
  ctx.stroke();
  ctx.strokeStyle = getColorForYarn(colorId);
  ctx.lineWidth = YARN_THREAD_CORE_PX;
  path();
  ctx.stroke();
  ctx.fillStyle = getColorForYarn(colorId);
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = YARN_TIP_STROKE_PX;
  ctx.beginPath();
  ctx.arc(to.x, to.y, YARN_TIP_RADIUS_PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── Nhạc cụ vẽ riêng và Dế Mèn gõ tay theo phách (GT-034, `BR-E034-13`) ──

export type InstrumentGlyphKind = "drum" | "clappers" | "woodfish";

const INSTRUMENT_GLYPH_BY_ID: Readonly<Record<string, InstrumentGlyphKind>> = {
  drum: "drum",
  trong: "drum",
  trong_com: "drum",
  clap: "clappers",
  clappers: "clappers",
  phach: "clappers",
  wood: "woodfish",
  woodblock: "woodfish",
  mo: "woodfish",
};

/** Hình vẽ riêng của nhạc cụ theo `instrument_id` đã biết (trống cơm / phách / mõ); lạ thì `null` (dùng asset). */
export function instrumentGlyphKind(
  instrumentId: string
): InstrumentGlyphKind | null {
  return INSTRUMENT_GLYPH_BY_ID[instrumentId.toLowerCase()] ?? null;
}

/** Vẽ nhạc cụ bằng vài hình token: trống cơm (thân thùng, hai mặt, dây), phách (hai thanh gỗ), mõ (khối gỗ tròn có khe). */
export function drawInstrumentGlyph(
  ctx: CanvasRenderingContext2D,
  kind: InstrumentGlyphKind,
  cx: number,
  cy: number,
  size: number
): void {
  const m = designTokens.colors.montessori;
  const r = size / 2;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = m.amberDark;
  if (kind === "drum") {
    // Thân thùng phình giữa, hai mặt da, dây căng chéo
    characterBlob(ctx, cx, cy, r * 0.75, r * 0.9, m.amberDeep, m.amberDark);
    characterBlob(
      ctx,
      cx,
      cy - r * 0.75,
      r * 0.7,
      r * 0.22,
      m.paper,
      m.amberDark
    );
    characterBlob(
      ctx,
      cx,
      cy + r * 0.75,
      r * 0.7,
      r * 0.22,
      m.paper,
      m.amberDark
    );
    ctx.strokeStyle = m.woodBevel;
    characterLine(ctx, cx - r * 0.6, cy - r * 0.7, cx - r * 0.2, cy + r * 0.7);
    characterLine(ctx, cx - r * 0.2, cy - r * 0.7, cx + r * 0.2, cy + r * 0.7);
    characterLine(ctx, cx + r * 0.2, cy - r * 0.7, cx + r * 0.6, cy + r * 0.7);
  } else if (kind === "clappers") {
    // Hai thanh phách gỗ bắt chéo
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(dir * 0.5);
      ctx.fillStyle = dir < 0 ? m.amberLight : m.amber;
      ctx.beginPath();
      ctx.roundRect(-r * 0.2, -r * 0.9, r * 0.4, r * 1.8, r * 0.18);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Mõ: khối gỗ tròn, khe ngang, núm cầm
    characterBlob(ctx, cx, cy, r * 0.85, r * 0.75, m.amberDeep, m.amberDark);
    characterBlob(
      ctx,
      cx,
      cy + r * 0.1,
      r * 0.55,
      r * 0.1,
      m.amberDark,
      m.amberDark
    );
    characterBlob(
      ctx,
      cx,
      cy - r * 0.85,
      r * 0.2,
      r * 0.2,
      m.amberLight,
      m.amberDark
    );
  }
  ctx.restore();
}

/** Phách (0..1) mà Dế Mèn hạ tay hết cỡ ở đầu phách rồi nhấc lại trong ngần này phần của phách. */
export const CRICKET_HIT_PHASE = 0.4;

/**
 * Độ hạ tay trước của Dế Mèn theo pha trong phách: hạ hết cỡ (1) ở đầu phách
 * — lúc nhạc cụ vang — rồi nhấc lên (0) trước giữa phách.
 */
export function cricketArm(phase: number): number {
  return Math.max(0, Math.min(1, 1 - phase / CRICKET_HIT_PHASE));
}

// ── Dấu vết đường đi của robot (GT-035, `BR-E035-16`) ───────────────

/** Dấu chân robot để lại trên ô nó đã đi qua: hai chấm nhỏ cạnh nhau. */
export function drawRobotTrail(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  const r = Math.max(2, Math.min(slot.w, slot.h) * 0.06);
  ctx.save();
  ctx.fillStyle = alpha(designTokens.colors.montessori.emeraldBright, 0.7);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(slot.x + dir * r * 1.8, slot.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Họa Mi nhún theo nhịp nhóm lặp, dây xâu hạt (GT-036, `BR-E036-14`) ──

const NIGHTINGALE_BOB_PX = 4;
const NIGHTINGALE_LEAN_RAD = 0.12;

/**
 * Họa Mi nhún theo từng bước sáng của mô-típ: mỗi bước nhún lên một nhịp rồi
 * hạ, nghiêng đổi bên theo bước. `steps` bước, mỗi bước `stepMs`; hết dãy,
 * trước lúc bắt đầu hoặc `reduced_motion` là đứng yên (`{}`).
 */
export function nightingaleSway(
  elapsedMs: number,
  stepMs: number,
  steps: number,
  reducedMotion: boolean
): StoryCharacterMotion {
  if (
    reducedMotion ||
    stepMs <= 0 ||
    elapsedMs < 0 ||
    elapsedMs >= stepMs * steps
  ) {
    return {};
  }
  const step = Math.floor(elapsedMs / stepMs);
  const phase = (elapsedMs % stepMs) / stepMs;
  const hop = Math.sin(Math.PI * phase);
  return {
    bob: -hop * NIGHTINGALE_BOB_PX,
    lean: (step % 2 === 0 ? 1 : -1) * hop * NIGHTINGALE_LEAN_RAD,
  };
}

export interface BeadStringSegment {
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

/**
 * Các đoạn dây nối tâm hai ô liền nhau **cùng hàng** (lệch dọc dưới nửa cạnh
 * ngắn). Ô xuống dòng thì dây ngắt, không vắt chéo qua các ô khác.
 */
export function beadStringSegments(
  slots: readonly Slot[]
): readonly BeadStringSegment[] {
  const segments: BeadStringSegment[] = [];
  for (let i = 1; i < slots.length; i++) {
    const a = slots[i - 1];
    const b = slots[i];
    if (a && b && Math.abs(a.y - b.y) < Math.min(a.h, b.h) / 2) {
      segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }
  return segments;
}

/** Dây xâu hạt vẽ dưới các ô hạt: sợi dây gỗ nối các ô cùng hàng. */
export function drawBeadString(
  ctx: CanvasRenderingContext2D,
  segments: readonly BeadStringSegment[]
): void {
  if (segments.length === 0) {
    return;
  }
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  for (const seg of segments) {
    characterLine(ctx, seg.x1, seg.y1, seg.x2, seg.y2);
  }
  ctx.restore();
}

/**
 * Lá cờ trung tính tâm `(cx, cy)`, bán kính `r` (cột cờ gỗ cùng cờ đuôi nheo màu
 * `indigo`, màu từ `designTokens`). Dùng chung cho đích mê cung (`BR-E013-10`) và
 * đích tia số GT-028 (`BR-E028-12`): hình không mang số hay vật cụ thể.
 */
export function drawGoalFlag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  const mo = designTokens.colors.montessori;
  const poleX = cx - r * 0.45;
  const top = cy - r;
  ctx.save();
  ctx.strokeStyle = mo.woodBorder;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(poleX, cy + r);
  ctx.lineTo(poleX, top);
  ctx.stroke();
  ctx.fillStyle = mo.indigo;
  ctx.strokeStyle = mo.indigo;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(poleX, top);
  ctx.lineTo(poleX + r * 1.3, top + r * 0.35);
  ctx.lineTo(poleX, top + r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
