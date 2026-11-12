import type { ZoneRect } from "#src/layout/stage-zones.js";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type GT002TokenAnimState,
  resolveGT002PlatePalette,
  resolveGT002TokenPose,
} from "#src/templates/GT-002/layout.js";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import {
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "./numeracy-primitives.js";
import {
  drawAssetInSlot,
  drawSlotLabel,
  drawTextInSlot,
} from "./shared-render.js";
import {
  detectSlotVisualComparisonCue,
  drawSlotVisualComparisonCue,
} from "./slot-decor.js";
import type { ItemVisualState, RenderItem } from "./types.js";

const BOARD_SLAB_DEPTH_PX = 4;
const { montessori, surface } = designTokens.colors;

export function drawGT002BoardFrame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  boardRect: ZoneRect | null
): void {
  if (!boardRect || boardRect.w < 24 || boardRect.h < 24) {
    return;
  }
  const { x, y, w, h } = boardRect;
  const bodyH = Math.max(12, h - BOARD_SLAB_DEPTH_PX);
  const cornerR = Math.min(24, Math.floor(bodyH / 2));

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.16);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = montessori.woodTray;
    ctx.beginPath();
    ctx.roundRect(x, y, w, bodyH, cornerR);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, BOARD_SLAB_DEPTH_PX);
  ctx.fillStyle = montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(x, y, w, bodyH, cornerR);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = montessori.woodTray;
  ctx.strokeStyle = montessori.woodBevel;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, bodyH, cornerR);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = alpha(surface[0], 0.82);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + cornerR, y + 4);
  ctx.lineTo(x + w - cornerR, y + 4);
  ctx.stroke();
  ctx.restore();
}

function resolvePlateGradients(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  baseR: number,
  innerR: number
): { readonly rimGrad: CanvasGradient; readonly innerGrad: CanvasGradient } {
  const gen = getContextGeneration(ctx);
  const rimId = PRIMITIVE_GRADIENTS.PLATE_RIM;
  const innerId = PRIMITIVE_GRADIENTS.PLATE_INNER;
  const { x, y, index: idx } = slot;

  let rimGrad = getCachedGradient(ctx, gen, rimId, idx);
  if (!rimGrad) {
    const gx = x - baseR * 0.3;
    const gy = y - baseR * 0.3;
    rimGrad = ctx.createRadialGradient(gx, gy, baseR * 0.1, x, y, baseR);
    rimGrad.addColorStop(0, montessori.plateLight);
    rimGrad.addColorStop(0.7, montessori.plateMid);
    rimGrad.addColorStop(1, montessori.plateEdge);
    setCachedGradient(ctx, gen, rimId, idx, rimGrad);
  }

  let innerGrad = getCachedGradient(ctx, gen, innerId, idx);
  if (!innerGrad) {
    innerGrad = ctx.createRadialGradient(x, y, innerR * 0.2, x, y, innerR);
    innerGrad.addColorStop(0, montessori.plateInner);
    innerGrad.addColorStop(1, montessori.plateInnerEdge);
    setCachedGradient(ctx, gen, innerId, idx, innerGrad);
  }
  return { rimGrad, innerGrad };
}

function drawPlateBody(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  item: RenderItem
): void {
  const hasRep = Boolean(
    item.representation &&
      drawQuantityRepresentation(ctx, rs, slot, item.representation)
  );
  if (hasRep) {
    return;
  }
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

function drawTickBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  plateR: number,
  fillColor: string,
  borderColor: string
): void {
  const badgeR = Math.max(8, Math.min(13, plateR * 0.28));
  const offset = Math.max(0, (plateR - badgeR - 1) * 0.7);
  const bx = centerX + offset;
  const by = centerY - offset;
  const arm = badgeR * 0.52;

  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = surface[0];
  ctx.lineWidth = Math.max(2.2, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(bx - arm * 0.7, by);
  ctx.lineTo(bx - arm * 0.1, by + arm * 0.6);
  ctx.lineTo(bx + arm * 0.7, by - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

export function drawGT002ChoicePlate(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  item: RenderItem,
  anim: GT002TokenAnimState
): void {
  const state: ItemVisualState = item.state ?? "idle";
  const palette = resolveGT002PlatePalette(state);
  const pose = resolveGT002TokenPose(state, slotIndex, rs.reducedMotion, anim);

  const hitR = Math.min(slot.hitW, slot.hitH) / 2;
  const baseR = Math.max(12, Math.min(slot.w, slot.h) / 2 - 2);
  const plateR = Math.min(hitR - 5, baseR * pose.scale);
  const innerR = plateR * 0.78;
  const cx = slot.x + pose.dx;
  const cy = slot.y + pose.dy;

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.save();
    ctx.shadowColor = alpha(montessori.woodBorder, 0.22);
    ctx.shadowBlur = state === "selected" || state === "correct" ? 14 : 9;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = palette.tokenSlab;
    ctx.beginPath();
    ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = palette.tokenSlab;
  ctx.beginPath();
  ctx.arc(cx, cy + pose.slabDepth, plateR, 0, Math.PI * 2);
  ctx.fill();

  const { rimGrad, innerGrad } = resolvePlateGradients(
    ctx,
    slot,
    baseR,
    innerR
  );
  ctx.fillStyle = rimGrad;
  ctx.strokeStyle = palette.rimBorder;
  ctx.lineWidth = palette.rimBorderWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = state === "idle" ? innerGrad : palette.tokenFill;
  ctx.strokeStyle = palette.tokenBorder;
  ctx.lineWidth = palette.tokenBorderWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (palette.innerRing) {
    ctx.strokeStyle = palette.innerRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(6, innerR - 4), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = alpha(surface[0], 0.8);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, plateR * 0.88, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  const innerSize = innerR * 1.82;
  const contentSlot: Slot = {
    ...slot,
    x: cx,
    y: cy,
    w: innerSize,
    h: innerSize,
  };
  drawPlateBody(ctx, rs, contentSlot, item);
  if (item.label) {
    drawSlotLabel(ctx, item.label, contentSlot, rs);
  }
  if (palette.badgeFill && palette.badgeBorder) {
    drawTickBadge(ctx, cx, cy, plateR, palette.badgeFill, palette.badgeBorder);
  }
  ctx.restore();
}

export function drawGT002WrongRing(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  slotIndex: number,
  anim: GT002TokenAnimState
): void {
  const pose = resolveGT002TokenPose(
    "wrong",
    slotIndex,
    rs.reducedMotion,
    anim
  );
  const hitR = Math.min(slot.hitW, slot.hitH) / 2;
  const baseR = Math.max(12, Math.min(slot.w, slot.h) / 2 - 2);
  const ringR = Math.min(hitR - 4.5, baseR + 1);
  const prog =
    !anim.isActiveWrong || rs.reducedMotion ? 0.25 : anim.wrongProgress;
  rs.drawRetryRing(ctx, slot.x + pose.dx, slot.y + pose.dy, ringR, prog);
}
