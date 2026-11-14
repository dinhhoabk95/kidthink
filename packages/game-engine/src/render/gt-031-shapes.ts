/** Primitive vẽ chuyên biệt cho GT-031 (Gộp tiền xu / Mua sắm). */
import type { LogicSpace } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import { designTokens } from "#src/systems/designTokens";
import { alpha } from "./color-utils.js";
import { applyCanvasFontAtSize, canvasFontPx } from "./type-scale.js";

export interface GT031TotalMeterParams {
  rect: ZoneRect;
  space: LogicSpace;
  scale?: number;
  displayedTotal: number;
  dots: readonly { cx: number; cy: number; r: number; active: boolean }[];
  isHintL1: boolean;
  wrongIntensity: number;
  isClosedWrong: boolean;
  isWin: boolean;
  softShadowsEnabled: boolean;
  reducedMotion: boolean;
  timeMs: number;
}
export interface GT031TargetDecorParams {
  box: ZoneRect;
  dots: readonly { x: number; y: number }[];
  isHintL1: boolean;
  timeMs: number;
}
export interface GT031DepositedStackParams {
  plate: ZoneRect | null;
  items: readonly {
    cx: number;
    cy: number;
    r: number;
    ry: number;
    value: number;
    rank: number;
  }[];
  space: LogicSpace;
  scale?: number;
}
export interface GT031SolutionGhostParams {
  pills: readonly { rect: ZoneRect; value: number; rank: number }[];
  space: LogicSpace;
  scale?: number;
}
export interface GT031CoinTrayDecorParams {
  box: ZoneRect;
  isDeposited: boolean;
  isHovered: boolean;
  isHintL2: boolean;
  timeMs: number;
}

const M = designTokens.colors.montessori;
const S = designTokens.colors.surface;
const RETRY = designTokens.colors.retry;
const OK = designTokens.colors.semantic.success;
const PALETTE = [
  { fill: M.amber, rim: M.amberDark },
  { fill: M.emeraldLight, rim: M.emerald },
  { fill: M.coralLight, rim: M.coral },
  { fill: M.indigoLight, rim: M.indigo },
];

const coinColors = (rank: number): { fill: string; rim: string } =>
  PALETTE[Math.max(0, rank) % PALETTE.length] ?? {
    fill: M.amber,
    rim: M.amberDark,
  };

function box(
  ctx: CanvasRenderingContext2D,
  r: ZoneRect,
  rad: number,
  fill?: string,
  stroke?: string,
  lw = 2
): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, rad);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function dot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function textStyle(
  ctx: CanvasRenderingContext2D,
  space: LogicSpace,
  variant: "hud" | "badge",
  scale: number | undefined,
  color: string
): void {
  applyCanvasFontAtSize(
    ctx,
    canvasFontPx(space, variant, scale),
    "display",
    700
  );
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

function meterColors(p: GT031TotalMeterParams): {
  bg: string;
  bar: string;
  border: string;
  text: string;
} {
  if (p.isWin) {
    return { bg: OK[100], bar: OK[600], border: OK[600], text: OK[800] };
  }
  if (p.wrongIntensity > 0.02 || p.isClosedWrong) {
    return {
      bg: RETRY[100],
      bar: RETRY[600],
      border: RETRY[600],
      text: RETRY[800],
    };
  }
  const pulse = 0.6 + 0.4 * (0.55 + 0.45 * Math.sin(p.timeMs * 0.008));
  return {
    bg: S[100],
    bar: M.amber,
    border: p.isHintL1 ? alpha(M.amber, pulse) : M.woodBevel,
    text: S[800],
  };
}

export function drawGT031TotalMeter(
  ctx: CanvasRenderingContext2D,
  p: GT031TotalMeterParams
): void {
  const shakeX =
    !p.reducedMotion && p.wrongIntensity > 0.02
      ? Math.sin(p.wrongIntensity * Math.PI * 4) * 3
      : 0;
  const r: ZoneRect = { ...p.rect, x: p.rect.x + shakeX };
  const col = meterColors(p);
  ctx.save();
  if (p.softShadowsEnabled) {
    ctx.shadowColor = alpha(S[900], 0.1);
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }
  box(
    ctx,
    r,
    Math.min(14, r.h * 0.32),
    col.bg,
    col.border,
    p.isHintL1 || p.wrongIntensity > 0.02 ? 3 : 2
  );
  ctx.restore();
  ctx.save();
  textStyle(ctx, p.space, "hud", p.scale, col.text);
  ctx.fillText(
    String(Math.round(p.displayedTotal)),
    r.x + Math.min(28, r.w * 0.2),
    r.y + r.h / 2 + 1
  );
  for (const d of p.dots) {
    dot(ctx, d.cx, d.cy, d.r, d.active ? col.bar : alpha(M.woodBevel, 0.55));
  }
  if (p.isWin) {
    const cx = r.x + r.w - 14;
    const cy = r.y + r.h / 2;
    ctx.strokeStyle = OK[600];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx - 1, cy + 4);
    ctx.lineTo(cx + 6, cy - 4);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGT031TargetDecor(
  ctx: CanvasRenderingContext2D,
  p: GT031TargetDecorParams
): void {
  ctx.save();
  if (p.isHintL1) {
    const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p.timeMs * 0.008));
    box(ctx, p.box, 14, alpha(M.amberLight, 0.16), alpha(M.amber, pulse), 3);
  }
  for (const pt of p.dots) {
    dot(ctx, pt.x, pt.y, 2.8, M.amberDark);
  }
  ctx.restore();
}

export function drawGT031DepositedStack(
  ctx: CanvasRenderingContext2D,
  p: GT031DepositedStackParams
): void {
  if (p.items.length === 0) {
    return;
  }
  ctx.save();
  if (p.plate) {
    box(
      ctx,
      p.plate,
      p.plate.h / 2,
      alpha(M.plateLight, 0.85),
      M.plateEdge,
      1.5
    );
  }
  textStyle(ctx, p.space, "badge", p.scale, S[900]);
  for (const item of p.items) {
    const pal = coinColors(item.rank);
    ctx.fillStyle = pal.fill;
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(item.cx, item.cy, item.r, item.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = S[900];
    ctx.fillText(String(item.value), item.cx, item.cy + 1);
  }
  ctx.restore();
}

export function drawGT031SolutionGhost(
  ctx: CanvasRenderingContext2D,
  p: GT031SolutionGhostParams
): void {
  if (p.pills.length === 0) {
    return;
  }
  ctx.save();
  textStyle(ctx, p.space, "badge", p.scale, S[800]);
  for (const pill of p.pills) {
    const pal = coinColors(pill.rank);
    box(ctx, pill.rect, pill.rect.h / 2, alpha(pal.fill, 0.25), pal.rim, 2);
    ctx.fillStyle = S[800];
    ctx.fillText(
      String(pill.value),
      pill.rect.x + pill.rect.w / 2,
      pill.rect.y + pill.rect.h / 2 + 1
    );
  }
  ctx.restore();
}

export function drawGT031CoinTrayDecor(
  ctx: CanvasRenderingContext2D,
  p: GT031CoinTrayDecorParams
): void {
  let fill = alpha(S[100], 0.55);
  if (p.isDeposited) {
    fill = alpha(M.woodBevel, 0.24);
  } else if (p.isHovered) {
    fill = alpha(M.amberLight, 0.35);
  }
  let stroke: string | undefined;
  if (p.isHintL2) {
    stroke = alpha(
      M.amber,
      0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p.timeMs * 0.009))
    );
  } else if (p.isHovered) {
    stroke = alpha(M.indigo, 0.55);
  }
  ctx.save();
  box(
    ctx,
    p.box,
    Math.min(14, p.box.w * 0.2, p.box.h * 0.2),
    fill,
    stroke,
    p.isHintL2 ? 3 : 2
  );
  ctx.restore();
}
