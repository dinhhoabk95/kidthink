import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import {
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "./numeracy-primitives.js";
import {
  detectSlotVisualComparisonCue,
  drawAssetInSlot,
  drawCheckMark,
  drawSlotLabel,
  drawSlotVisualComparisonCue,
  drawTextInSlot,
} from "./shared-render.js";
import type { ItemVisualState, RenderAsset, RenderItem } from "./types.js";

type CanvasCtx = CanvasRenderingContext2D;
type WoodSurfaceVariant = "dock" | "card" | "card_won";
const COLORS = designTokens.colors;
const SURFACE = COLORS.surface;
const BRAND = COLORS.brand;
const RETRY = COLORS.retry;
const SUCCESS = COLORS.semantic.success;
const MONTESSORI = COLORS.montessori;
const WOOD_BORDER = MONTESSORI.woodBorder;
const WOOD_SLAB_DEPTH_PX = 4;
const TOKEN_SLAB_IDLE_PX = 3.5;
const TOKEN_SLAB_PRESSED_PX = 1.5;
const WIN_SPRING_DURATION_MS = 450;
const STATIC_RETRY_PROGRESS = 0.25;
const SPECULAR_START_RAD = Math.PI * 1.15;
const SPECULAR_END_RAD = Math.PI * 1.85;
export interface GT001TargetAnim {
  readonly timeMs: number;
  readonly isWon: boolean;
  readonly winElapsedMs: number;
}
export interface GT001TokenAnim {
  readonly timeMs: number;
  readonly winElapsedMs: number;
  readonly wrongProgress: number;
  readonly isActiveWrong: boolean;
}
interface TokenPalette {
  readonly fill: string;
  readonly border: string;
  readonly slab: string;
  readonly lineWidth: number;
}
interface TokenPose {
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
  readonly slabDepth: number;
}
function toPalette(
  fill: string,
  border: string,
  slab: string,
  lw = 4
): TokenPalette {
  return { fill, border, slab, lineWidth: lw };
}
const TOKEN_PALETTES: Record<ItemVisualState, TokenPalette> = {
  idle: toPalette(SURFACE[0], COLORS.cta[200], WOOD_BORDER, 2.5),
  touching: toPalette(BRAND[50], BRAND[400], BRAND[600], 3.5),
  selected: toPalette(BRAND[50], BRAND[500], BRAND[600], 4),
  correct: toPalette(SUCCESS[100], SUCCESS[500], SUCCESS[600], 4),
  wrong: toPalette(RETRY[100], RETRY[600], RETRY[600], 3.5),
  locked: toPalette(SURFACE[100], SURFACE[400], WOOD_BORDER, 2.5),
};
const WOOD_FILL_BY_VARIANT: Record<WoodSurfaceVariant, string> = {
  dock: SURFACE[50],
  card: SURFACE[0],
  card_won: MONTESSORI.amberGlow,
};
function drawCircle(
  ctx: CanvasCtx,
  centerX: number,
  centerY: number,
  radius: number,
  fillColor = "",
  strokeColor = "",
  lineWidth = 2
): void {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}
function drawWoodenSurface(
  ctx: CanvasCtx,
  rs: RenderSystem,
  bodyRect: ZoneRect,
  variant: WoodSurfaceVariant,
  slabTop = bodyRect.y + WOOD_SLAB_DEPTH_PX
): void {
  const minSide = Math.min(bodyRect.w, bodyRect.h);
  const cardRadius = Math.min(24, Math.floor(minSide * 0.22));
  const cornerRadius =
    variant === "dock" ? Math.min(28, Math.floor(bodyRect.h / 2)) : cardRadius;
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(WOOD_BORDER, 0.17);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillStyle = WOOD_BORDER;
  ctx.beginPath();
  ctx.roundRect(bodyRect.x, slabTop, bodyRect.w, bodyRect.h, cornerRadius);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = WOOD_FILL_BY_VARIANT[variant];
  ctx.strokeStyle =
    variant === "card_won" ? MONTESSORI.amber : MONTESSORI.woodBevel;
  ctx.lineWidth = variant === "dock" ? 3 : 3.5;
  ctx.beginPath();
  ctx.roundRect(bodyRect.x, bodyRect.y, bodyRect.w, bodyRect.h, cornerRadius);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = alpha(SURFACE[0], 0.86);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyRect.x + cornerRadius, bodyRect.y + 4);
  ctx.lineTo(bodyRect.x + bodyRect.w - cornerRadius, bodyRect.y + 4);
  ctx.stroke();
  ctx.restore();
}
export function drawGT001TargetShowcase(
  ctx: CanvasCtx,
  rs: RenderSystem,
  slot: Slot,
  asset: RenderAsset | null | undefined,
  anim: GT001TargetAnim
): void {
  const left = slot.x - slot.w / 2;
  const top = slot.y - slot.h / 2;
  const bodyHeight = Math.max(24, slot.h - WOOD_SLAB_DEPTH_PX);
  const canAnimate = !rs.reducedMotion;
  const rawDy = Math.round(Math.sin(anim.timeMs * 0.006) * 1.5);
  const bounceY = anim.isWon && canAnimate ? rawDy : 0;
  const bodyTop = Math.max(top, Math.min(top + 4, top + bounceY));
  const cardRect: ZoneRect = { x: left, y: bodyTop, w: slot.w, h: bodyHeight };
  const variant: WoodSurfaceVariant = anim.isWon ? "card_won" : "card";
  drawWoodenSurface(ctx, rs, cardRect, variant, top + WOOD_SLAB_DEPTH_PX);
  if (asset) {
    const glyphScale =
      !canAnimate || anim.isWon ? 1 : 1 + 0.02 * Math.sin(anim.timeMs * 0.0022);
    const innerY = Math.round(bodyTop + bodyHeight / 2);
    const innerSlot: Slot = { ...slot, y: innerY, h: bodyHeight };
    if (!drawAssetInSlot(ctx, asset, innerSlot, glyphScale)) {
      drawPlaceholderBox(ctx, innerSlot);
    }
  }
}
export function drawGT001WoodenDock(
  ctx: CanvasCtx,
  rs: RenderSystem,
  dockRect: ZoneRect,
  slots: readonly Slot[]
): void {
  const bodyHeight = Math.max(12, dockRect.h - WOOD_SLAB_DEPTH_PX);
  drawWoodenSurface(ctx, rs, { ...dockRect, h: bodyHeight }, "dock");
  const wellFill = alpha(SURFACE[200], 0.45);
  const wellStroke = alpha(WOOD_BORDER, 0.22);
  ctx.save();
  for (const slot of slots) {
    const wellRadius = Math.max(16, Math.min(slot.w, slot.h) / 2 - 4);
    drawCircle(ctx, slot.x, slot.y, wellRadius, wellFill, wellStroke, 1.5);
  }
  ctx.restore();
}
function resolveTokenPose(
  state: ItemVisualState,
  slotIndex: number,
  reducedMotion: boolean,
  anim: GT001TokenAnim
): TokenPose {
  const slabDepth = TOKEN_SLAB_IDLE_PX;
  if (state === "touching") {
    const scale = reducedMotion ? 1 : 0.95;
    return { dx: 0, dy: 2, scale, slabDepth: TOKEN_SLAB_PRESSED_PX };
  }
  if (reducedMotion) {
    return { dx: 0, dy: 0, scale: 1, slabDepth };
  }
  if (state === "wrong" && anim.isActiveWrong) {
    const progress = anim.wrongProgress;
    const dx = Math.sin(progress * Math.PI * 4) * (1 - progress) * 4;
    return { dx, dy: 0, scale: 1, slabDepth };
  }
  if (state === "correct") {
    const rawP = anim.winElapsedMs / WIN_SPRING_DURATION_MS;
    const p = Math.min(1, Math.max(0, rawP));
    const scale = p < 1 ? 1 + 0.06 * Math.sin(p * Math.PI) * (1 - p * 0.4) : 1;
    const dy = p < 1 ? 0 : Math.sin(anim.timeMs * 0.006) * 1.5;
    return { dx: 0, dy, scale, slabDepth };
  }
  const idleWave = Math.sin(anim.timeMs * 0.0026 + slotIndex * 0.9) * 1.4;
  const dy = state === "idle" ? idleWave : 0;
  return { dx: 0, dy, scale: 1, slabDepth };
}
function drawTokenGlyph(ctx: CanvasCtx, slot: Slot, item: RenderItem): void {
  if (item.text !== undefined) {
    drawTextInSlot(ctx, item.text, slot);
    return;
  }
  const emojiRef = item.asset?.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(item.label, item.id, emojiRef);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, item.asset, slot, cue?.glyphScale ?? 1)) {
    drawPlaceholderBox(ctx, slot);
  }
}
export function drawGT001OptionToken(
  ctx: CanvasCtx,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  item: RenderItem,
  anim: GT001TokenAnim
): void {
  const state = item.state ?? "idle";
  const { fill, border, slab, lineWidth } = TOKEN_PALETTES[state];
  const pose = resolveTokenPose(state, slotIndex, rs.reducedMotion, anim);
  const maxHitRadius = Math.min(slot.hitW, slot.hitH) / 2 - 6;
  const radius = Math.min(
    maxHitRadius,
    (Math.min(slot.w, slot.h) / 2 - 4) * pose.scale
  );
  const centerX = slot.x + pose.dx;
  const centerY = slot.y + pose.dy;
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(WOOD_BORDER, 0.18);
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
  }
  drawCircle(ctx, centerX, centerY + pose.slabDepth, radius, slab);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawCircle(ctx, centerX, centerY, radius, fill, border, lineWidth);
  if (state === "touching" || state === "selected" || state === "correct") {
    const innerRadius = Math.max(8, radius - 5);
    const innerColor = alpha(
      state === "correct" ? SUCCESS[300] : BRAND[300],
      0.75
    );
    drawCircle(ctx, centerX, centerY, innerRadius, "", innerColor);
  }
  ctx.strokeStyle = alpha(SURFACE[0], 0.78);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const specRadius = radius * 0.64;
  ctx.arc(centerX, centerY, specRadius, SPECULAR_START_RAD, SPECULAR_END_RAD);
  ctx.stroke();
  const [x, y, w] = [centerX, centerY, Math.round(radius * 2)];
  const contentSlot: Slot = { ...slot, x, y, w, h: w };
  const rep = item.representation;
  if (!(rep && drawQuantityRepresentation(ctx, rs, contentSlot, rep))) {
    drawTokenGlyph(ctx, contentSlot, item);
  }
  if (item.label) {
    drawSlotLabel(ctx, item.label, contentSlot, rs);
  }
  if (state === "correct") {
    drawCheckMark(ctx, contentSlot);
  } else if (state === "selected") {
    const badgeX = centerX + radius * 0.55;
    const badgeY = centerY - radius * 0.55;
    const badgeRadius = Math.max(8, radius * 0.24);
    drawCircle(ctx, badgeX, badgeY, badgeRadius, BRAND[500], SURFACE[0]);
  } else if (state === "wrong") {
    const ringRadius = Math.min(slot.hitW / 2 - 6, radius + 2);
    const ringProgress =
      !anim.isActiveWrong || rs.reducedMotion
        ? STATIC_RETRY_PROGRESS
        : anim.wrongProgress;
    rs.drawRetryRing(ctx, centerX, centerY, ringRadius, ringProgress);
  }
  ctx.restore();
}
