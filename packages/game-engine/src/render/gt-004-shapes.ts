import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  computeGT004PlacedChips,
  type GT004GroupTheme,
  type GT004RenderItem,
  type GT004SourceTokenOptions,
  type GT004TrayOptions,
  resolveGT004GroupTheme,
  resolveGT004SourcePalette,
  trayPopScale,
  trayShakeOffset,
} from "#src/templates/GT-004/layout";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha, readableTextOn } from "./color-utils.js";
import { sortTrayGeometry, type TrayRect } from "./container-shapes.js";
import { drawGT003SourceToken } from "./gt-003-shapes.js";
import { drawPlaceholderBox } from "./numeracy-primitives.js";
import {
  drawAssetInSlot,
  drawGlyphInSlot,
  drawTextInSlot,
} from "./shared-render.js";
import {
  detectSlotVisualComparisonCue,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";
import { applyCanvasFontAtSize, legibleFontPx } from "./type-scale.js";

function fillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string | CanvasGradient
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function fillRect(
  ctx: CanvasRenderingContext2D,
  rect: TrayRect,
  shakeX: number,
  radius: number,
  fill: string
): void {
  ctx.beginPath();
  ctx.roundRect(rect.x + shakeX, rect.y, rect.w, rect.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeCurrent(
  ctx: CanvasRenderingContext2D,
  stroke: string,
  lineWidth: number
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawTrayAura(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  theme: GT004GroupTheme,
  isComplete: boolean,
  shakeX: number
): void {
  const cx = slot.x + shakeX;
  const r = Math.max(14, Math.min(slot.w, slot.h) * 0.45 - Math.abs(shakeX));
  const key =
    Math.round(cx) * 100_000 +
    Math.round(slot.y) * 100 +
    theme.index * 10 +
    (isComplete ? 2 : 1);
  const gen = getContextGeneration(ctx);
  const kind = PRIMITIVE_GRADIENTS.CONTAINER_AURA;
  let grad = getCachedGradient(ctx, gen, kind, key);
  if (!grad) {
    const core = isComplete
      ? alpha(designTokens.colors.semantic.success[300], 0.4)
      : theme.auraCore;
    grad = ctx.createRadialGradient(cx, slot.y, r * 0.2, cx, slot.y, r);
    grad.addColorStop(0, core);
    grad.addColorStop(1, alpha(designTokens.colors.montessori.amberLight, 0));
    setCachedGradient(ctx, gen, kind, key, grad);
  }
  ctx.save();
  fillCircle(ctx, cx, slot.y, r, grad);
  ctx.restore();
}

function drawTokenContent(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  item: GT004RenderItem
): void {
  const emojiRef = item.asset?.kind === "emoji" ? item.asset.ref : undefined;
  const cue = detectSlotVisualComparisonCue(item.label, item.id, emojiRef);
  if (cue) {
    drawSlotVisualComparisonCue(ctx, slot, cue);
  }
  if (!drawAssetInSlot(ctx, item.asset, slot, cue?.glyphScale ?? 1)) {
    if (item.label && item.label.trim().length > 0) {
      drawTextInSlot(ctx, item.label, slot);
    } else {
      drawPlaceholderBox(ctx, slot);
    }
  }
}

function resolveTrayBodyRim(
  options: GT004TrayOptions,
  theme: GT004GroupTheme
): string {
  if (options.isWrong) {
    return designTokens.colors.retry[500];
  }
  return options.isComplete
    ? designTokens.colors.semantic.success[500]
    : theme.rim;
}

const RIBBON_DOT_START = 8;
const RIBBON_DOT_STEP = 5.5;
const RIBBON_DOT_GAP = 5;

/**
 * Vùng chữ của ruy-băng nhãn khay: nằm bên phải dải chấm theme để chấm không
 * bao giờ đè lên chữ đầu của nhãn.
 * `centerX` tính từ mép trái ruy-băng.
 */
export function gt004RibbonTextBox(
  ribbonW: number,
  dotCount: number
): { readonly centerX: number; readonly maxWidth: number } {
  const dotsEnd =
    dotCount > 0
      ? RIBBON_DOT_START + (dotCount - 1) * RIBBON_DOT_STEP + 2 + RIBBON_DOT_GAP
      : 0;
  const width = Math.max(0, ribbonW - dotsEnd);
  return { centerX: dotsEnd + width / 2, maxWidth: width * 0.94 };
}

function drawTrayFrontAndCard(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  options: GT004TrayOptions,
  theme: GT004GroupTheme,
  shakeX: number
): void {
  const { body, card, front, handle, label: ribbon } = sortTrayGeometry(slot);
  const wood = designTokens.colors.montessori;
  const frontFill = options.isComplete
    ? designTokens.colors.semantic.success[50]
    : theme.frontTint;
  fillRect(ctx, front, shakeX, 10, frontFill);
  strokeCurrent(ctx, wood.woodBevel, 2);

  ctx.beginPath();
  ctx.roundRect(body.x + shakeX, body.y, body.w, body.h, 14);
  const rimW = options.isHovered ? 5.5 : 4;
  strokeCurrent(ctx, resolveTrayBodyRim(options, theme), rimW);

  fillRect(ctx, card, shakeX, 6, wood.paper);
  strokeCurrent(ctx, theme.rim, 1.5);

  const cardSlot: Slot = {
    ...slot,
    x: card.x + shakeX + card.w / 2,
    y: card.y + card.h / 2,
    w: card.w,
    h: card.h,
  };
  if (options.labelEmoji.trim().length > 0) {
    drawGlyphInSlot(ctx, options.labelEmoji, cardSlot);
  } else {
    const initial = options.label.trim().charAt(0).toUpperCase() || "•";
    drawTextInSlot(ctx, initial, cardSlot, theme.rim);
  }
  fillRect(ctx, handle, shakeX, handle.h / 2, wood.woodBorder);
  fillRect(ctx, ribbon, shakeX, ribbon.h / 2, theme.rim);

  const fg = readableTextOn(
    theme.rim,
    designTokens.colors.surface[0],
    designTokens.colors.surface[900]
  );
  const dotCy = ribbon.y + ribbon.h / 2;
  const rx = ribbon.x + shakeX;
  for (let d = 0; d < theme.dotCount; d++) {
    fillCircle(ctx, rx + RIBBON_DOT_START + d * RIBBON_DOT_STEP, dotCy, 2, fg);
  }
  ctx.fillStyle = fg;
  applyCanvasFontAtSize(ctx, legibleFontPx(15), "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textBox = gt004RibbonTextBox(ribbon.w, theme.dotCount);
  ctx.fillText(options.label, rx + textBox.centerX, dotCy, textBox.maxWidth);
}

/** Vẽ khay phân loại Montessori 3D có phân màu nhóm, thẻ kiểm tra và ngăn chứa vật đã xếp (GT-004). */
export function drawGT004SortTray(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  options: GT004TrayOptions
): void {
  const geom = sortTrayGeometry(slot);
  const { body } = geom;
  const shakeX = trayShakeOffset(options.shakeElapsedMs, rs.reducedMotion);
  const popScale = trayPopScale(options.popElapsedMs, rs.reducedMotion);
  const theme = resolveGT004GroupTheme(options.groupIndex);
  const wood = designTokens.colors.montessori;

  ctx.save();
  if (options.isHovered || options.isComplete) {
    drawTrayAura(ctx, slot, theme, options.isComplete, shakeX);
  }
  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(wood.woodBorder, 0.18);
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }
  const bodyFill = options.isHovered ? wood.woodTrayHigh : wood.woodTray;
  fillRect(ctx, body, shakeX, 14, bodyFill);
  ctx.restore();

  const chips = computeGT004PlacedChips(
    slot,
    geom,
    options.placedItems.length,
    shakeX
  );
  const chipRim = options.isComplete
    ? designTokens.colors.semantic.success[500]
    : theme.rim;
  for (let i = 0; i < chips.length; i++) {
    const chip = chips[i];
    const pItem = options.placedItems[i];
    if (chip && pItem) {
      const r = Math.max(8, Math.min(chip.r, chip.r * popScale));
      fillCircle(ctx, chip.cx, chip.cy, r, designTokens.colors.surface[0]);
      strokeCurrent(ctx, chipRim, 2.2);
      drawTokenContent(ctx, chip.slot, pItem);
    }
  }

  drawTrayFrontAndCard(ctx, slot, options, theme, shakeX);
  if (options.isComplete) {
    const bx = body.x + shakeX + body.w - 11;
    const by = body.y + 11;
    fillCircle(ctx, bx, by, 8.5, designTokens.colors.semantic.success[500]);
    strokeCurrent(ctx, designTokens.colors.surface[0], 1.8);
    ctx.beginPath();
    ctx.moveTo(bx - 3.5, by + 0.2);
    ctx.lineTo(bx - 0.8, by + 3);
    ctx.lineTo(bx + 4, by - 2.6);
    ctx.stroke();
  }
  if (options.isWrong) {
    const r = Math.max(12, Math.min(body.w, body.h) * 0.42 - Math.abs(shakeX));
    const prog = rs.reducedMotion ? 0.25 : (options.wrongProgress ?? 0.25);
    rs.drawRetryRing(ctx, slot.x + shakeX, slot.y, r, prog);
  }
  ctx.restore();
}

/** Vẽ token nguồn 3D đủ 5 trạng thái (`idle`, `touching`, `selected`, `wrong`, `locked`). */
export function drawGT004SourceToken(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: GT004RenderItem,
  options: GT004SourceTokenOptions
): void {
  if (options.state !== "touching") {
    const text =
      !item.asset && item.label && item.label.trim().length > 0
        ? item.label
        : undefined;
    drawGT003SourceToken(ctx, rs, slot, { ...item, text }, options);
    return;
  }
  const maxHalf = Math.min(
    Math.min(slot.w, slot.h) / 2 - 4,
    Math.min(slot.hitW, slot.hitH) / 2 - 5
  );
  const palette = resolveGT004SourcePalette("touching");
  const r = Math.max(14, maxHalf - 1.5);
  const cy = slot.y + (rs.reducedMotion ? 0 : 1.5);
  ctx.save();
  if (!rs.reducedMotion) {
    ctx.translate(slot.x, cy);
    ctx.scale(0.95, 0.95);
    ctx.translate(-slot.x, -cy);
  }
  fillCircle(ctx, slot.x, cy + 1.5, r, palette.base);
  fillCircle(ctx, slot.x, cy, r, palette.fill);
  strokeCurrent(ctx, palette.rim, palette.lineWidth);
  if (palette.innerRing) {
    ctx.beginPath();
    ctx.arc(slot.x, cy, Math.max(8, r - 6), 0, Math.PI * 2);
    strokeCurrent(ctx, palette.innerRing, 2);
  }
  const side = r * 1.65;
  drawTokenContent(ctx, { ...slot, x: slot.x, y: cy, w: side, h: side }, item);
  ctx.restore();
}
