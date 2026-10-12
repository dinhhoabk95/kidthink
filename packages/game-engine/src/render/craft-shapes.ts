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
}

export function drawLiquidCup(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  slot: Slot,
  params: LiquidCupParams
): void {
  const baseW = slot.w * 0.8;
  const baseH = slot.h * 0.85;

  let wFactor = 1.0;
  let hFactor = 1.0;

  if (params.shape === "narrow_tall") {
    wFactor = 0.7;
    hFactor = 1.25;
  } else if (params.shape === "wide_short") {
    wFactor = 1.35;
    hFactor = 0.75;
  } else if (params.shape === "fluted") {
    wFactor = 1.1;
    hFactor = 1.0;
  }

  const cupW = baseW * wFactor;
  const cupH = baseH * hFactor;
  const x = slot.x - cupW / 2;
  const y = slot.y - cupH / 2 + (baseH - cupH) / 2;

  ctx.save();

  // Glass Background
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.5);
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(x, y, cupW, cupH, [6, 6, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Liquid fill calculation (BR-E032-03)
  const fillRatio =
    params.capacityUnits > 0
      ? Math.min(1, Math.max(0, params.fillUnits / params.capacityUnits))
      : 0;

  const liquidH = cupH * fillRatio;
  const liquidY = y + cupH - liquidH;

  if (liquidH > 0) {
    ctx.save();
    // Clip inside cup
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cupW - 4, cupH - 4, [4, 4, 14, 14]);
    ctx.clip();

    // Draw liquid
    ctx.fillStyle = designTokens.colors.brand[500];
    if (params.color === "mint") {
      ctx.fillStyle = designTokens.colors.semantic.success[500];
    } else if (params.color === "berry") {
      ctx.fillStyle = designTokens.colors.semantic.danger[400];
    } else if (params.color === "amber") {
      ctx.fillStyle = designTokens.colors.retry[500];
    }

    ctx.fillRect(x, liquidY, cupW, liquidH);

    // Meniscus / surface highlight
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.4);
    ctx.fillRect(x, liquidY, cupW, Math.min(6, liquidH));
    ctx.restore();
  }

  // Hint Marks (tick marks)
  if (params.showHintMarks) {
    ctx.strokeStyle = alpha(designTokens.colors.surface[500], 0.6);
    ctx.lineWidth = 2;
    for (let step = 1; step < params.capacityUnits; step++) {
      const stepY = y + cupH - (cupH * step) / params.capacityUnits;
      ctx.beginPath();
      ctx.moveTo(x + 4, stepY);
      ctx.lineTo(x + 14, stepY);
      ctx.stroke();
    }
  }

  // Selected highlight
  if (params.isSelected) {
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, cupW + 8, cupH + 8, [10, 10, 20, 20]);
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
      return designTokens.colors.semantic.danger[400];
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
