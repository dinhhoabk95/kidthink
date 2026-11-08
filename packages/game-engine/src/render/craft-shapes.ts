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
    const startH = r.h * cupWaterLevel(c.shape, ratio);
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
    ctx.roundRect(x - w / 2, baseY - h, w, h, [4, 4, 8, 8]);
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

function getColorForYarn(colorId: string): string {
  switch (colorId.toLowerCase()) {
    case "red":
    case "berry":
      return designTokens.colors.montessori.coral;
    case "blue":
    case "sky":
      return designTokens.colors.brand[500];
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
  bounds: StallRect
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
  const counterH = Math.min(slot.h * 0.12, bounds.y + bounds.h - bottom);
  const counter: StallRect | null =
    counterH >= 6
      ? { x: slot.x - counterW / 2, y: bottom, w: counterW, h: counterH }
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
      ctx.fillStyle = i % 2 === 0 ? m.coral : m.paper;
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

/** Sáu nhân vật còn thiếu hình: một con thú mỗi khung chuyện. */
export const STORY_CHARACTER_KINDS = [
  "squirrel",
  "monkey",
  "elephant",
  "weasel",
  "hen",
  "butterfly",
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

const STORY_CHARACTER_DRAWERS: Readonly<
  Record<
    StoryCharacterKind,
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number
    ) => void
  >
> = {
  squirrel: drawSquirrel,
  monkey: drawMonkey,
  elephant: drawElephant,
  weasel: drawWeasel,
  hen: drawHen,
  butterfly: drawButterfly,
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
  size: number
): void {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  STORY_CHARACTER_DRAWERS[kind](ctx, cx, cy, size);
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
  slots: readonly Slot[]
): void {
  const spot = placeStoryCharacter(stage, slots);
  if (spot) {
    drawStoryCharacter(ctx, kind, spot.cx, spot.cy, STORY_CHARACTER_SIZE_PX);
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
