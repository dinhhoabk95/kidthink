import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  computeGT003SocketWells,
  type GT003BasketOptions,
  type GT003RenderItem,
  type GT003SocketWell,
  type GT003SourceTokenOptions,
  type GT003TokenPalette,
  type GT003TokenPose,
  resolveGT003BasketTheme,
  resolveGT003SourcePalette,
  resolveGT003SourcePose,
} from "#src/templates/GT-003/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { basketShakeOffset, type ContainerBox } from "./container-shapes.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import { drawAssetInSlot, drawTextInSlot } from "./shared-render.js";
import {
  detectSlotVisualComparisonCue,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";

function traceCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

function drawBasketAura(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  cacheKey: number,
  auraCore: string
): void {
  const r = Math.max(16, Math.min(box.w, box.h) * 0.48);
  const gen = getContextGeneration(ctx);
  const kind = PRIMITIVE_GRADIENTS.CONTAINER_AURA;
  let grad = getCachedGradient(ctx, gen, kind, cacheKey);
  if (!grad) {
    grad = ctx.createRadialGradient(box.x, box.y, r * 0.25, box.x, box.y, r);
    grad.addColorStop(0, auraCore);
    grad.addColorStop(1, alpha(designTokens.colors.montessori.amberLight, 0));
    setCachedGradient(ctx, gen, kind, cacheKey, grad);
  }
  ctx.save();
  ctx.fillStyle = grad;
  traceCircle(ctx, box.x, box.y, r);
  ctx.fill();
  ctx.restore();
}

function drawTokenContent(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  item: GT003RenderItem
): void {
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

function drawSingleSocketWell(
  ctx: CanvasRenderingContext2D,
  well: GT003SocketWell,
  placedItem: GT003RenderItem | undefined
): void {
  ctx.save();
  if (placedItem) {
    ctx.fillStyle = designTokens.colors.surface[0];
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 2.5;
    traceCircle(ctx, well.cx, well.cy, well.r);
    ctx.fill();
    ctx.stroke();
    drawTokenContent(ctx, well.slot, placedItem);
  } else {
    const wood = designTokens.colors.montessori.woodBorder;
    const recess = designTokens.colors.montessori.slotRecess;
    ctx.fillStyle = alpha(recess, 0.85);
    ctx.strokeStyle = alpha(wood, 0.48);
    ctx.lineWidth = 2;
    traceCircle(ctx, well.cx, well.cy, well.r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = alpha(wood, 0.34);
    traceCircle(ctx, well.cx, well.cy, Math.max(3, well.r * 0.2));
    ctx.fill();
  }
  ctx.restore();
}

function drawBasketBadge(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  label: string,
  placedCount: number,
  targetCount: number
): void {
  const fontPx = legibleFontPx(14);
  const pillW = Math.min(box.w * 0.92, Math.max(128, label.length * 10 + 54));
  const pillH = fontPx + 12;
  const pillY = box.y + box.h / 2 - pillH - 4;
  const done = placedCount >= targetCount;
  const colors = designTokens.colors;

  ctx.save();
  ctx.fillStyle = done ? colors.semantic.success[500] : colors.surface[0];
  ctx.strokeStyle = done
    ? colors.semantic.success[600]
    : colors.montessori.woodBevel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(box.x - pillW / 2, pillY, pillW, pillH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = done ? colors.surface[0] : colors.surface[800];
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = `${label} (${placedCount}/${targetCount})`;
  ctx.fillText(text, box.x, pillY + pillH / 2, pillW - 14);
  ctx.restore();
}

/** Vẽ rổ đích Montessori 3D kèm hàng ổ đếm trực quan `targetCount` ô (GT-003). */
export function drawGT003BasketTarget(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: ContainerBox,
  options: GT003BasketOptions
): void {
  const shakeX =
    options.shakeElapsedMs === null
      ? 0
      : basketShakeOffset(options.shakeElapsedMs, rs.reducedMotion);
  const theme = resolveGT003BasketTheme(box, options.isHovered, options.isWon);

  ctx.save();
  ctx.translate(shakeX, 0);
  drawBasketAura(ctx, box, theme.cacheKey, theme.auraCore);
  const { x, y, w, h } = box;
  rs.drawClayContainer(ctx, x, y, w, h, theme.trayFill, theme.trayRim);
  for (const well of computeGT003SocketWells(box, options.targetCount)) {
    drawSingleSocketWell(ctx, well, options.placedItems[well.index]);
  }
  const count = options.placedItems.length;
  drawBasketBadge(ctx, box, options.label, count, options.targetCount);
  ctx.restore();
}

function drawActiveTokenBody(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  cx: number,
  cy: number,
  r: number,
  palette: GT003TokenPalette,
  pose: GT003TokenPose,
  isSelected: boolean
): void {
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(designTokens.colors.surface[900], 0.16);
    ctx.shadowBlur = pose.shadowBlur;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillStyle = palette.base;
  traceCircle(ctx, cx, cy + pose.baseLift, r);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = palette.lineWidth;
  traceCircle(ctx, cx, cy, r);
  ctx.fill();
  ctx.stroke();

  if (palette.innerRing) {
    ctx.strokeStyle = palette.innerRing;
    ctx.lineWidth = 2;
    traceCircle(ctx, cx, cy, Math.max(8, r - 6));
    ctx.stroke();
  }
  if (isSelected) {
    ctx.fillStyle = designTokens.colors.brand[500];
    const badgeR = Math.max(5, Math.round(r * 0.18));
    traceCircle(ctx, cx + r * 0.54, cy - r * 0.54, badgeR);
    ctx.fill();
  }
}

/** Vẽ token nguồn 3D đủ 5 trạng thái (`idle`, `touching`, `selected`, `wrong`, `locked`). */
export function drawGT003SourceToken(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: GT003RenderItem,
  options: GT003SourceTokenOptions
): void {
  const palette = resolveGT003SourcePalette(options.state);
  const pose = resolveGT003SourcePose({
    state: options.state,
    slotIndex: slot.index,
    timeMs: options.timeMs,
    stagedAtMs: options.stagedAtMs,
    wrongProgress: options.wrongProgress,
    reducedMotion: rs.reducedMotion,
  });
  const maxHalf = Math.min(
    Math.min(slot.w, slot.h) / 2 - 4,
    Math.min(slot.hitW, slot.hitH) / 2 - 5
  );
  ctx.save();
  if (options.state === "locked") {
    ctx.fillStyle = palette.fill;
    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = palette.lineWidth;
    traceCircle(ctx, slot.x, slot.y, maxHalf);
    ctx.fill();
    ctx.stroke();
    const tickR = Math.max(8, Math.round(maxHalf * 0.28));
    ctx.strokeStyle = designTokens.colors.semantic.success[500];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(slot.x - tickR * 0.5, slot.y);
    ctx.lineTo(slot.x - tickR * 0.1, slot.y + tickR * 0.42);
    ctx.lineTo(slot.x + tickR * 0.55, slot.y - tickR * 0.38);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const r = Math.max(14, (maxHalf - pose.baseLift) / pose.scale);
  const cx = slot.x + pose.offsetX;
  const cy = slot.y + pose.offsetY;
  if (pose.scale !== 1) {
    ctx.translate(cx, cy);
    ctx.scale(pose.scale, pose.scale);
    ctx.translate(-cx, -cy);
  }
  const isSel = options.state === "selected";
  drawActiveTokenBody(ctx, rs, cx, cy, r, palette, pose, isSel);
  const side = r * 1.65;
  drawTokenContent(ctx, { ...slot, x: cx, y: cy, w: side, h: side }, item);
  if (options.state === "wrong") {
    const prog = rs.reducedMotion ? 0.25 : (options.wrongProgress ?? 0.25);
    rs.drawRetryRing(ctx, cx, cy, Math.max(10, r - 2), prog);
  }
  ctx.restore();
}
