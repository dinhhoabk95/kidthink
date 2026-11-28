import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawFlashlightBeam,
  drawStoryCharacterInStage,
  drawWallShadow,
  placeStoryCharacter,
} from "#src/render/craft-shapes";
import { drawCheckMark, drawEmptyTargetSlot } from "#src/render/slot-decor";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { drawAssetInSlot, getColorsForState } from "./shared-render.js";
import type {
  GT019FlipButtonParams,
  GT019LitTarget,
  GT019TargetSlotParams,
  GT019TrayPieceParams,
  RenderAsset,
} from "./types.js";

const cl = designTokens.colors;
const m = cl.montessori;
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type TP = GT019TargetSlotParams;
type PP = GT019TrayPieceParams;
type FP = GT019FlipButtonParams;
type TransformVec = readonly [number, number, number, number, number];

function disc(ctx: Ctx, x: number, y: number, r: number, col: string): void {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function seg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
function star(ctx: Ctx, x: number, y: number, r: number, col: string): void {
  ctx.strokeStyle = col;
  seg(ctx, x - r, y, x + r, y);
  seg(ctx, x, y - r, x, y + r);
}
function cwArcArrow(ctx: Ctx, x: number, y: number, r: number): void {
  const [tx, ty, w] = [x + 0.66 * r, y + 0.75 * r, Math.min(6, r * 0.22)];
  ctx.beginPath();
  ctx.arc(x, y, r, -2.1, 0.85);
  ctx.moveTo(tx + w * 0.98, ty - w * 0.12);
  ctx.lineTo(tx, ty);
  ctx.lineTo(tx + w * 0.24, ty - w * 0.97);
  ctx.stroke();
}

export function drawGT019FlashlightHolder(
  ctx: Ctx,
  stageRect: ZoneRect | undefined,
  slots: readonly Slot[]
): { readonly x: number; readonly y: number } | null {
  const spot = placeStoryCharacter(stageRect, slots);
  drawStoryCharacterInStage(ctx, "bat", stageRect, slots);
  if (spot) {
    return { x: spot.cx, y: spot.cy };
  }
  return stageRect
    ? { x: stageRect.x + stageRect.w * 0.5, y: stageRect.y }
    : null;
}

export function drawGT019LightsPass(
  ctx: Ctx,
  beamOrigin: { readonly x: number; readonly y: number } | null,
  litTargets: readonly GT019LitTarget[]
): void {
  for (const t of litTargets) {
    drawWallShadow(ctx, t.slot, t.strength);
    if (beamOrigin) {
      drawFlashlightBeam(ctx, beamOrigin, t.slot, t.strength);
    }
  }
}

function drawOrientationKey(
  ctx: Ctx,
  r: number,
  ghost: boolean,
  matched: boolean
): void {
  let pinCol: string = cl.brand[500];
  if (matched) {
    pinCol = m.emeraldBright;
  } else if (ghost) {
    pinCol = m.amber;
  }
  disc(ctx, 0, -r * 0.72, Math.max(3, r * 0.1), pinCol);
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = matched ? m.emeraldLight : m.amberLight;
  ctx.beginPath();
  ctx.moveTo(r * 0.3, -r * 0.64);
  ctx.lineTo(r * 0.52, -r * 0.52);
  ctx.lineTo(r * 0.34, -r * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTransformedPiece(
  ctx: Ctx,
  slot: Slot,
  asset: RenderAsset,
  v: TransformVec,
  ghost: boolean,
  matched: boolean
): void {
  const [rotDeg, sx, sy, r, a] = v;
  if (a <= 0.01) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(slot.x, slot.y);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(sx, sy);
  ctx.translate(-slot.x, -slot.y);
  drawAssetInSlot(ctx, asset, slot);
  ctx.translate(slot.x, slot.y);
  drawOrientationKey(ctx, r, ghost, matched);
  ctx.restore();
}

function drawTargetFrame(ctx: Ctx, slot: Slot, r: number, col: string): void {
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    slot.x - r + 2,
    slot.y - r + 2,
    (r - 2) * 2,
    (r - 2) * 2,
    Math.max(10, r * 0.22)
  );
  ctx.stroke();
}

function drawBurstStars(ctx: Ctx, slot: Slot, r: number, p: TP): void {
  if (!(p.showParticles && (p.burstProgress > 0 || p.isWon))) {
    return;
  }
  const active = p.burstProgress > 0;
  const d = (active ? 0.66 - 0.18 * p.burstProgress : 0.6) * r;
  ctx.globalAlpha = active ? p.burstProgress : 0.75;
  ctx.lineWidth = 1.8;
  star(ctx, slot.x - d, slot.y - d * 0.96, 3.8, m.amber);
  star(ctx, slot.x + d * 0.96, slot.y + d * 0.94, 3.5, m.emeraldBright);
  star(ctx, slot.x - d * 0.94, slot.y + d * 0.9, 3.3, m.amber);
}

export function drawGT019TargetSlot(ctx: Ctx, rs: RS, slot: Slot, p: TP): void {
  drawEmptyTargetSlot(ctx, slot);
  const r = Math.min(slot.w, slot.h) * 0.5;
  const pr = r * 0.88;
  ctx.save();
  if (p.mode === "empty") {
    disc(ctx, slot.x, slot.y, pr, alpha(m.woodBorder, 0.16));
    const v: TransformVec = [
      p.rotDeg,
      p.flipScaleX,
      p.flipScaleY,
      pr,
      p.hintLevel >= 2 ? 0.78 : 0.55,
    ];
    drawTransformedPiece(ctx, slot, p.asset, v, true, false);
    if (p.hintLevel >= 1) {
      drawTargetFrame(ctx, slot, r, cl.retry[400]);
    }
    if (p.wrongProgress > 0) {
      rs.drawRetryRing(ctx, slot.x, slot.y, r * 0.86, 1 - p.wrongProgress);
    }
  } else if (p.mode === "auto_resolved") {
    drawTargetFrame(ctx, slot, r, m.amber);
    const v: TransformVec = [
      p.rotDeg,
      p.flipScaleX,
      p.flipScaleY,
      pr,
      0.72 * p.autoResolveProgress,
    ];
    drawTransformedPiece(ctx, slot, p.asset, v, false, false);
  } else {
    drawTargetFrame(ctx, slot, r, p.isWon ? m.emeraldBright : m.emerald);
    const v: TransformVec = [p.rotDeg, p.flipScaleX, p.flipScaleY, pr, 1];
    drawTransformedPiece(ctx, slot, p.asset, v, false, true);
    drawCheckMark(ctx, slot);
    drawBurstStars(ctx, slot, r, p);
  }
  ctx.restore();
}

function resolveTrayScale(rs: RS, p: PP): number {
  if (p.state === "selected") {
    return 0.96;
  }
  if (p.state === "touching") {
    return 0.93;
  }
  const b =
    !rs.reducedMotion && p.state === "idle"
      ? Math.sin(p.timeMs * 0.004) * 0.014
      : 0;
  return 0.88 + b;
}

export function drawGT019TrayPiece(ctx: Ctx, rs: RS, slot: Slot, p: PP): void {
  const baseR = Math.min(slot.w, slot.h) * 0.5;
  const r = baseR * resolveTrayScale(rs, p);
  const maxShk = Math.max(0, baseR - r - 1);
  const shk =
    p.state === "wrong" && !rs.reducedMotion
      ? Math.sin((1 - p.wrongProgress) * 12.56) *
        Math.min(2.4, maxShk) *
        p.wrongProgress
      : 0;
  const cx = slot.x + shk;
  const { fill, border } = getColorsForState(p.state);
  rs.drawClayBody(ctx, cx, slot.y, r, fill, border, "circle");
  ctx.save();
  ctx.strokeStyle = alpha(m.woodBorder, 0.32);
  ctx.lineWidth = 1.5;
  for (const a of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
    const [dx0, dy0] = [Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82];
    seg(ctx, cx + dx0, slot.y + dy0, cx + dx0 * 1.14, slot.y + dy0 * 1.14);
  }
  if (p.state === "selected" || p.isHinted) {
    ctx.strokeStyle = cl.brand[500];
    ctx.lineWidth = 2.2;
    cwArcArrow(ctx, cx, slot.y, r * 0.84);
  }
  if (p.state === "wrong") {
    rs.drawRetryRing(ctx, cx, slot.y, r * 0.9, 1 - p.wrongProgress);
    ctx.strokeStyle = cl.retry[500];
    ctx.lineWidth = 2;
    cwArcArrow(ctx, cx, slot.y, r * 0.78);
  }
  ctx.restore();
  const v: TransformVec = [p.visualRotDeg, p.flipScaleX, p.flipScaleY, r, 1];
  const s = shk === 0 ? slot : { ...slot, x: cx };
  drawTransformedPiece(ctx, s, p.asset, v, false, false);
}

export function drawGT019FlipButton(ctx: Ctx, rs: RS, slot: Slot, p: FP): void {
  const baseR = Math.min(slot.w, slot.h) * 0.5;
  const pop =
    !rs.reducedMotion && p.pulseProgress > 0
      ? Math.sin(p.pulseProgress * Math.PI) * 0.04
      : 0;
  const r = Math.min(
    baseR,
    baseR * ((p.isHovered || p.isHinted ? 0.94 : 0.89) + pop)
  );
  let state: "selected" | "touching" | "idle" = "idle";
  if (p.isFlipped) {
    state = "selected";
  } else if (p.isHovered) {
    state = "touching";
  }
  const { fill, border } = getColorsForState(state);
  rs.drawClayBody(ctx, slot.x, slot.y, r, fill, border, "circle");
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = m.woodBorder;
  ctx.lineWidth = 1.8;
  seg(ctx, slot.x, slot.y - r * 0.56, slot.x, slot.y + r * 0.56);
  ctx.setLineDash([]);
  for (const dir of [-1, 1]) {
    ctx.fillStyle = dir > 0 && p.isFlipped ? cl.brand[500] : m.amberLight;
    ctx.beginPath();
    ctx.moveTo(slot.x + dir * r * 0.14, slot.y - r * 0.34);
    ctx.lineTo(slot.x + dir * r * 0.52, slot.y + r * 0.18);
    ctx.lineTo(slot.x + dir * r * 0.14, slot.y + r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = p.isHinted || p.isFlipped ? cl.brand[500] : m.amberDark;
  ctx.lineWidth = 2;
  const [ay, ax] = [slot.y + r * 0.42, r * 0.36];
  seg(ctx, slot.x - ax, ay, slot.x + ax, ay);
  for (const s of [-1, 1]) {
    seg(ctx, slot.x - ax, ay, slot.x - r * 0.2, ay + s * 3);
    seg(ctx, slot.x + ax, ay, slot.x + r * 0.2, ay + s * 3);
  }
  ctx.restore();
}
