import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { applyCanvasFontAtSize } from "./type-scale.js";

export interface GT037BoardFrameParams {
  readonly boardBox: ZoneRect;
  readonly stageClip?: ZoneRect;
  readonly shadowsOff?: boolean;
}

export interface GT037HintRegionParams {
  readonly regionBox: ZoneRect;
  readonly stageClip?: ZoneRect;
  readonly hintLevel: 1 | 2;
  readonly timeMs: number;
}

export type GT037TokenState = "idle" | "hovered" | "found" | "wrong" | "reveal";

export interface GT037SymbolTokenParams {
  readonly slot: Slot;
  readonly stageClip?: ZoneRect;
  readonly state: GT037TokenState;
  readonly shadowsOff?: boolean;
}

export interface GT037FoundHaloParams {
  readonly slot: Slot;
  readonly stageClip?: ZoneRect;
  readonly timeMs: number;
  readonly isReveal?: boolean;
  readonly pulseIntensity?: number;
}

export interface GT037TargetSlotHintParams {
  readonly slot: Slot;
  readonly stageClip?: ZoneRect;
  readonly timeMs: number;
}

export interface GT037BrokenPlaceholderParams {
  readonly slot: Slot;
  readonly stageClip?: ZoneRect;
}

const TAU = Math.PI * 2;

function saveWithClip(ctx: CanvasRenderingContext2D, clip?: ZoneRect): void {
  ctx.save();
  if (
    clip &&
    typeof ctx.rect === "function" &&
    typeof ctx.clip === "function"
  ) {
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
  }
}

function clampRectToClip(box: ZoneRect, clip?: ZoneRect): ZoneRect {
  if (!clip) {
    return box;
  }
  const x = Math.max(clip.x, box.x);
  const y = Math.max(clip.y, box.y);
  const r = Math.min(clip.x + clip.w, box.x + box.w);
  const b = Math.min(clip.y + clip.h, box.y + box.h);
  return { x, y, w: Math.max(0, r - x), h: Math.max(0, b - y) };
}

function drawRoundBox(
  ctx: CanvasRenderingContext2D,
  box: ZoneRect,
  r: number,
  fill: string,
  stroke: string,
  lw: number
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, r);
  ctx.fill();
  ctx.stroke();
}

export function drawGT037BoardFrame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  params: GT037BoardFrameParams
): void {
  const outer = clampRectToClip(params.boardBox, params.stageClip);
  if (outer.w <= 8 || outer.h <= 8) {
    return;
  }
  const c = designTokens.colors;
  saveWithClip(ctx, params.stageClip);
  if (!params.shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(c.montessori.woodBorder, 0.22);
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }
  drawRoundBox(
    ctx,
    outer,
    18,
    c.montessori.woodBevel,
    c.montessori.woodBorder,
    3
  );
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const inBox = {
    x: outer.x + 6,
    y: outer.y + 6,
    w: Math.max(0, outer.w - 12),
    h: Math.max(0, outer.h - 12),
  };
  if (inBox.w > 4 && inBox.h > 4) {
    // Bề mặt bên trong bảng quét phẳng, một màu êm không hoạ tiết (Spec §12).
    const rim = alpha(c.montessori.woodBorder, 0.25);
    drawRoundBox(ctx, inBox, 13, c.surface[50], rim, 1.5);
  }
  ctx.restore();
}

export function drawGT037HintRegion(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  params: GT037HintRegionParams
): void {
  const box = clampRectToClip(params.regionBox, params.stageClip);
  if (box.w <= 4 || box.h <= 4) {
    return;
  }
  const c = designTokens.colors;
  const p = rs.reducedMotion
    ? 0.85
    : 0.6 + 0.3 * Math.sin(params.timeMs * 0.005);
  const isL1 = params.hintLevel === 1;
  const fill = alpha(
    isL1 ? c.ctaLight : c.montessori.amberLight,
    (isL1 ? 0.28 : 0.34) * p
  );
  const stroke = alpha(
    isL1 ? c.cta[400] : c.montessori.amberDark,
    (isL1 ? 0.72 : 0.85) * p
  );
  saveWithClip(ctx, params.stageClip);
  ctx.setLineDash(isL1 ? [7, 5] : [5, 3]);
  drawRoundBox(ctx, box, 14, fill, stroke, isL1 ? 2.5 : 3);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | null,
  stroke: string | null,
  lw = 2
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
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

export function drawGT037SymbolToken(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  params: GT037SymbolTokenParams
): void {
  const { slot, stageClip, state, shadowsOff } = params;
  const c = designTokens.colors;
  const r = Math.max(12, Math.min(slot.w, slot.h) * 0.44);
  const cy = state === "hovered" ? slot.y - 1.5 : slot.y;
  const styleMap: Record<GT037TokenState, readonly [string, string, number]> = {
    idle: [c.surface[0], c.surface[300], 2],
    hovered: [c.surface[50], c.brand[400], 2.6],
    wrong: [c.retry[100], c.retry[600], 2.8],
    found: [c.semantic.success[50], c.semantic.success[500], 2.6],
    reveal: [c.ctaLight, c.semantic.warning[500], 2.8],
  };
  const [fill, stroke, lw] = styleMap[state];
  saveWithClip(ctx, stageClip);
  if (!shadowsOff && rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(c.montessori.woodBorder, 0.16);
    ctx.shadowBlur = state === "hovered" ? 7 : 4;
    ctx.shadowOffsetY = 2;
  }
  drawArc(ctx, slot.x, cy + 2, r, stroke, null);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawArc(ctx, slot.x, cy, r, fill, stroke, lw);
  ctx.strokeStyle = alpha(c.surface[0], 0.75);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(slot.x, cy, Math.max(4, r - 2.5), Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();
  ctx.restore();
}

export function drawGT037FoundHalo(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  params: GT037FoundHaloParams
): void {
  const { slot, stageClip, isReveal, pulseIntensity = 0 } = params;
  const c = designTokens.colors;
  const minEdge = Math.min(slot.w, slot.h);
  const baseR = Math.max(12, minEdge * 0.43);
  const waveR = Math.min(minEdge * 0.48, baseR + 3);
  const outerR = Math.min(minEdge * 0.47, baseR + 1.5);
  const ring = isReveal ? c.semantic.warning[500] : c.semantic.success[500];
  let glow: string = c.semantic.success[100];
  if (isReveal) {
    glow = c.ctaLight;
  } else if (pulseIntensity > 0) {
    glow = c.montessori.amberGlow;
  }
  saveWithClip(ctx, stageClip);
  if (pulseIntensity > 0) {
    const waveC = alpha(
      c.montessori.amberDark,
      (rs.reducedMotion ? 0.4 : pulseIntensity) * 0.45
    );
    drawArc(ctx, slot.x, slot.y, waveR, null, waveC, 5);
  }
  drawArc(ctx, slot.x, slot.y, outerR, null, alpha(glow, 0.85), 4);
  drawArc(ctx, slot.x, slot.y, baseR, null, ring, 3);
  if (!isReveal) {
    const bx = slot.x + baseR * 0.6;
    const by = slot.y - baseR * 0.6;
    const br = Math.min(8, Math.max(5, baseR * 0.22));
    drawArc(ctx, bx, by, br, c.semantic.success[500], c.surface[0], 1.6);
    ctx.strokeStyle = c.surface[0];
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(bx - br * 0.42, by);
    ctx.lineTo(bx - br * 0.1, by + br * 0.34);
    ctx.lineTo(bx + br * 0.45, by - br * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGT037TargetSlotHint(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  params: GT037TargetSlotHintParams
): void {
  const { slot, stageClip, timeMs } = params;
  const c = designTokens.colors;
  const p = rs.reducedMotion ? 0.9 : 0.55 + 0.35 * Math.sin(timeMs * 0.003_14);
  const r = Math.max(13, Math.min(slot.w, slot.h) * 0.48);
  const fill = alpha(c.montessori.amberLight, 0.24 * p);
  const stroke = alpha(c.montessori.amberDark, 0.9 * p);
  saveWithClip(ctx, stageClip);
  drawArc(ctx, slot.x, slot.y, r, fill, stroke, 3.5);
  ctx.restore();
}

export function drawGT037BrokenPlaceholder(
  ctx: CanvasRenderingContext2D,
  _rs: RenderSystem,
  params: GT037BrokenPlaceholderParams
): void {
  const { slot, stageClip } = params;
  saveWithClip(ctx, stageClip);
  applyCanvasFontAtSize(
    ctx,
    Math.max(16, Math.round(slot.h * 0.38)),
    "body",
    "bold"
  );
  ctx.fillStyle = designTokens.colors.surface[400];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", slot.x, slot.y);
  ctx.restore();
}
