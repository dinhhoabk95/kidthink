import type { HintLevel } from "#src/game-session";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT001StageLayout } from "#src/templates/GT-001/layout";
import type { GT001Showcase } from "#src/templates/GT-001/template";
import { alpha } from "./color-utils.js";
import {
  drawPlaceholderBox,
  drawQuantityRepresentation,
} from "./numeracy-primitives.js";
import { drawAssetInSlot, drawCheckMark } from "./shared-render.js";
import type { RenderAsset, RenderItem } from "./types.js";
import { drawDoPaperFiberMarks } from "./vn-folk-motifs.js";

type CanvasCtx = CanvasRenderingContext2D;

const COLORS = designTokens.colors;
const SURFACE = COLORS.surface;
const BRAND = COLORS.brand;
const SUCCESS = COLORS.semantic.success;
const RETRY = COLORS.retry;
const MONTESSORI = COLORS.montessori;
const VN = COLORS.vnMaterials;

const BOOK_SLAB_DEPTH_PX = 4;
export const BOOK_OPEN_DURATION_MS = 450;
export const COIN_FLIGHT_DURATION_MS = 320;

export interface GT001StorybookRenderState {
  readonly timeMs: number;
  readonly isWon: boolean;
  readonly isRevealedOnClose: boolean;
  readonly winElapsedMs: number;
  readonly wrongCueActive: boolean;
  readonly hintLevel: 0 | HintLevel;
  readonly solvedItem?: RenderItem | null;
}

function drawCircle(
  ctx: CanvasCtx,
  cx: number,
  cy: number,
  radius: number,
  fill = "",
  stroke = "",
  lineWidth = 2
): void {
  if (radius <= 0) {
    return;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawBookCoverAndPages(
  ctx: CanvasCtx,
  rs: RenderSystem,
  bookRect: ZoneRect,
  isSpread: boolean,
  state: GT001StorybookRenderState
): ZoneRect {
  const bodyH = Math.max(24, bookRect.h - BOOK_SLAB_DEPTH_PX);
  const cornerR = Math.min(20, Math.floor(Math.min(bookRect.w, bodyH) * 0.2));
  const coverRect: ZoneRect = {
    x: bookRect.x,
    y: bookRect.y,
    w: bookRect.w,
    h: bodyH,
  };

  ctx.save();
  if (rs.softShadowsEnabled) {
    ctx.shadowColor = alpha(VN.woodGrain.bark, 0.18);
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillStyle = VN.woodGrain.bark;
  ctx.beginPath();
  ctx.roundRect(
    coverRect.x,
    coverRect.y + BOOK_SLAB_DEPTH_PX,
    coverRect.w,
    coverRect.h,
    cornerR
  );
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = VN.bamboo.deep;
  ctx.strokeStyle = MONTESSORI.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(coverRect.x, coverRect.y, coverRect.w, coverRect.h, cornerR);
  ctx.fill();
  ctx.stroke();

  const inset = Math.max(4, Math.min(7, Math.round(bodyH * 0.06)));
  const pageRect: ZoneRect = {
    x: coverRect.x + inset,
    y: coverRect.y + inset,
    w: Math.max(16, coverRect.w - inset * 2),
    h: Math.max(16, coverRect.h - inset * 2),
  };
  const pageR = Math.max(8, cornerR - 4);

  ctx.fillStyle = state.isWon ? MONTESSORI.amberGlow : VN.doPaper.sheet;
  ctx.strokeStyle =
    state.hintLevel >= 1 && !state.isWon ? MONTESSORI.amber : VN.bamboo.stalk;
  ctx.lineWidth = state.hintLevel >= 1 && !state.isWon ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(pageRect.x, pageRect.y, pageRect.w, pageRect.h, pageR);
  ctx.fill();
  ctx.stroke();

  drawDoPaperFiberMarks(ctx, pageRect.x, pageRect.y, pageRect.w, pageRect.h);

  if (isSpread) {
    drawBookSpineAndRibbon(ctx, pageRect, state.isWon);
  }
  ctx.restore();
  return pageRect;
}

function drawBookSpineAndRibbon(
  ctx: CanvasCtx,
  pageRect: ZoneRect,
  isWon: boolean
): void {
  const spineX = Math.round(pageRect.x + pageRect.w / 2);
  ctx.save();
  ctx.strokeStyle = alpha(VN.bamboo.joint, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(spineX, pageRect.y + 4);
  ctx.lineTo(spineX, pageRect.y + pageRect.h - 4);
  ctx.stroke();

  for (const ratio of [0.26, 0.5, 0.74] as const) {
    const ky = Math.round(pageRect.y + pageRect.h * ratio);
    ctx.strokeStyle = VN.terracotta.clay;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(spineX - 4, ky);
    ctx.lineTo(spineX + 4, ky);
    ctx.stroke();
  }

  if (pageRect.w >= 140 && pageRect.h >= 56) {
    const dotR = 3.5;
    const baseRight = pageRect.x + pageRect.w - 12;
    const dotY = pageRect.y + 10;
    for (let idx = 0; idx < 3; idx++) {
      const cx = baseRight - (2 - idx) * 10;
      const fill = isWon || idx === 0 ? SUCCESS[400] : VN.bamboo.stalk;
      drawCircle(ctx, cx, dotY, dotR, fill, VN.bamboo.deep, 1);
    }
  }
  ctx.restore();
}

function drawPageTurnOverlay(
  ctx: CanvasCtx,
  pageRect: ZoneRect,
  progress: number
): void {
  if (progress >= 1 || pageRect.w < 80) {
    return;
  }
  const halfW = pageRect.w / 2;
  const spineX = pageRect.x + halfW;
  const leafWidth = Math.max(4, Math.round(halfW * (1 - progress)));
  ctx.save();
  ctx.fillStyle = alpha(VN.doPaper.warm, 0.88 * (1 - progress * 0.5));
  ctx.strokeStyle = VN.bamboo.joint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(
    spineX,
    pageRect.y + 3,
    leafWidth,
    Math.max(8, pageRect.h - 6),
    6
  );
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSafeShowcaseAsset(
  ctx: CanvasCtx,
  asset: RenderAsset | undefined,
  slot: Slot,
  scale = 1
): void {
  if (!asset) {
    drawPlaceholderBox(ctx, slot);
    return;
  }
  if (!drawAssetInSlot(ctx, asset, slot, scale)) {
    drawPlaceholderBox(ctx, slot);
  }
}

function drawSequenceGapPreview(
  ctx: CanvasCtx,
  slot: Slot,
  items: readonly RenderAsset[]
): void {
  const count = items.length;
  const gap = 4;
  const cellW = Math.max(
    14,
    Math.floor((slot.hitW - gap * (count - 1)) / count)
  );
  const cellSize = Math.min(cellW, Math.max(16, Math.round(slot.h * 0.72)));
  const totalW = count * cellSize + (count - 1) * gap;
  const startX = slot.x - totalW / 2;

  for (let i = 0; i < count; i++) {
    const asset = items[i];
    const cx = Math.round(startX + i * (cellSize + gap) + cellSize / 2);
    const subSlot: Slot = {
      ...slot,
      x: cx,
      w: cellSize,
      h: cellSize,
      hitW: cellSize,
      hitH: cellSize,
    };
    drawCircle(
      ctx,
      cx,
      slot.y,
      cellSize * 0.46,
      SURFACE[0],
      VN.bamboo.joint,
      1.5
    );
    drawSafeShowcaseAsset(ctx, asset, subSlot, 0.82);
  }
}

function drawSilhouetteInset(
  ctx: CanvasCtx,
  slot: Slot,
  asset: RenderAsset | undefined,
  highlightCue: boolean
): void {
  const r = Math.max(12, Math.min(slot.w, slot.h) * 0.46);
  drawCircle(
    ctx,
    slot.x,
    slot.y,
    r,
    MONTESSORI.slotRecess,
    highlightCue ? MONTESSORI.amber : VN.woodGrain.groove,
    highlightCue ? 3 : 2
  );
  ctx.save();
  ctx.globalAlpha = highlightCue ? 0.82 : 0.58;
  drawSafeShowcaseAsset(ctx, asset, slot, 0.84);
  ctx.restore();
}

function drawComparisonAnchor(
  ctx: CanvasCtx,
  slot: Slot,
  asset: RenderAsset | undefined,
  wrongCueActive: boolean
): void {
  const half = Math.min(slot.w, slot.h) * 0.44;
  const baseLineY = Math.round(slot.y + half * 0.82);
  ctx.save();
  ctx.strokeStyle = wrongCueActive ? RETRY[500] : VN.bamboo.joint;
  ctx.lineWidth = wrongCueActive ? 2.5 : 2;
  ctx.beginPath();
  ctx.moveTo(slot.x - half, baseLineY);
  ctx.lineTo(slot.x + half, baseLineY);
  ctx.moveTo(slot.x - half, baseLineY - half * 1.4);
  ctx.lineTo(slot.x - half, baseLineY);
  ctx.stroke();
  ctx.restore();

  const innerSlot: Slot = {
    ...slot,
    w: Math.max(16, Math.round(slot.w * 0.78)),
    h: Math.max(16, Math.round(slot.h * 0.78)),
  };
  drawSafeShowcaseAsset(ctx, asset, innerSlot, 0.85);
}

function drawLeftShowcasePage(
  ctx: CanvasCtx,
  rs: RenderSystem,
  slot: Slot,
  showcase: GT001Showcase,
  state: GT001StorybookRenderState
): void {
  const highlight = state.wrongCueActive || state.hintLevel >= 1;
  if (highlight) {
    const auraR = Math.max(14, Math.min(slot.w, slot.h) * 0.48);
    drawCircle(
      ctx,
      slot.x,
      slot.y,
      auraR,
      alpha(MONTESSORI.amberLight, 0.45),
      state.wrongCueActive ? RETRY[500] : MONTESSORI.amber,
      2
    );
  }

  if (showcase.mode === "cpa_bridge" && showcase.representation) {
    const repConfig = {
      kind: showcase.representation.kind,
      count: showcase.representation.count,
      max: showcase.representation.max,
      min: showcase.representation.min,
    };
    if (drawQuantityRepresentation(ctx, rs, slot, repConfig)) {
      return;
    }
  }

  if (
    showcase.mode === "sequence_gap" &&
    showcase.sequence_preview &&
    showcase.sequence_preview.length >= 2
  ) {
    drawSequenceGapPreview(ctx, slot, showcase.sequence_preview);
    return;
  }

  if (showcase.mode === "comparison_anchor") {
    drawComparisonAnchor(ctx, slot, showcase.cue_asset, state.wrongCueActive);
    return;
  }

  if (showcase.mode === "silhouette_clue") {
    drawSilhouetteInset(ctx, slot, showcase.cue_asset, highlight);
    return;
  }

  const frameR = Math.max(12, Math.min(slot.w, slot.h) * 0.45);
  drawCircle(ctx, slot.x, slot.y, frameR, SURFACE[0], VN.bamboo.stalk, 2);
  drawSafeShowcaseAsset(ctx, showcase.cue_asset, slot, 0.84);
}

function drawQuestionMarkVector(
  ctx: CanvasCtx,
  cx: number,
  cy: number,
  radius: number,
  strokeColor: string
): void {
  const r = Math.max(5, radius * 0.34);
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.45, r * 0.72, Math.PI * 0.9, Math.PI * 2.15);
  ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.1, cx, cy + r * 0.35);
  ctx.lineTo(cx, cy + r * 0.58);
  ctx.stroke();
  drawCircle(ctx, cx, cy + r * 1.05, Math.max(1.8, radius * 0.08), strokeColor);
  ctx.restore();
}

function drawRightPopupSocket(
  ctx: CanvasCtx,
  rs: RenderSystem,
  slot: Slot,
  state: GT001StorybookRenderState,
  coinLanded: boolean
): void {
  const socketR = Math.max(12, Math.min(slot.w, slot.h) * 0.44);
  const showSolved =
    (state.isWon && coinLanded) ||
    (state.isRevealedOnClose && Boolean(state.solvedItem));

  if (showSolved && state.solvedItem) {
    drawCircle(ctx, slot.x, slot.y, socketR, SUCCESS[100], SUCCESS[500], 3);
    const contentSlot: Slot = {
      ...slot,
      w: Math.round(socketR * 1.8),
      h: Math.round(socketR * 1.8),
    };
    const rep = state.solvedItem.representation;
    if (!(rep && drawQuantityRepresentation(ctx, rs, contentSlot, rep))) {
      drawSafeShowcaseAsset(
        ctx,
        state.solvedItem.asset ?? undefined,
        contentSlot,
        0.86
      );
    }
    drawCheckMark(ctx, contentSlot);
    return;
  }

  ctx.save();
  ctx.setLineDash([5, 4]);
  drawCircle(
    ctx,
    slot.x,
    slot.y,
    socketR,
    MONTESSORI.slotRecess,
    state.wrongCueActive ? RETRY[500] : VN.bamboo.joint,
    2
  );
  ctx.setLineDash([]);

  if (state.hintLevel >= 3 && state.solvedItem?.asset) {
    ctx.globalAlpha = 0.42;
    drawSafeShowcaseAsset(ctx, state.solvedItem.asset, slot, 0.78);
  } else {
    drawQuestionMarkVector(
      ctx,
      slot.x,
      slot.y,
      socketR,
      state.wrongCueActive ? RETRY[600] : MONTESSORI.amberDeep
    );
  }
  ctx.restore();
}

function drawCpaBridgeConnector(
  ctx: CanvasCtx,
  leftSlot: Slot,
  rightSlot: Slot,
  showcase: GT001Showcase,
  isCrystallized: boolean,
  wrongCueActive: boolean
): void {
  if (leftSlot.x === rightSlot.x) {
    return;
  }
  const midX = Math.round((leftSlot.x + rightSlot.x) / 2);
  const midY = leftSlot.y;
  const badgeR = Math.max(8, Math.min(13, Math.round(leftSlot.h * 0.16)));

  ctx.save();
  if (isCrystallized) {
    ctx.strokeStyle = SUCCESS[500];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftSlot.x + leftSlot.w * 0.36, midY);
    ctx.lineTo(rightSlot.x - rightSlot.w * 0.36, midY);
    ctx.stroke();

    drawCircle(ctx, midX, midY, badgeR, SUCCESS[500], SURFACE[0], 2);
    const barW = badgeR * 0.48;
    ctx.strokeStyle = SURFACE[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - barW, midY - 2.5);
    ctx.lineTo(midX + barW, midY - 2.5);
    ctx.moveTo(midX - barW, midY + 2.5);
    ctx.lineTo(midX + barW, midY + 2.5);
    ctx.stroke();
  } else if (wrongCueActive || showcase.mode === "sequence_gap") {
    ctx.strokeStyle = wrongCueActive ? RETRY[500] : BRAND[400];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - 5, midY);
    ctx.lineTo(midX + 5, midY);
    ctx.lineTo(midX + 1, midY - 4);
    ctx.moveTo(midX + 5, midY);
    ctx.lineTo(midX + 1, midY + 4);
    ctx.stroke();
  }
  ctx.restore();
}

export function computeCoinFlightProgress(
  isWon: boolean,
  winElapsedMs: number,
  reducedMotion: boolean
): number {
  if (!isWon) {
    return 0;
  }
  if (reducedMotion || winElapsedMs >= COIN_FLIGHT_DURATION_MS) {
    return 1;
  }
  return Math.max(0, Math.min(1, winElapsedMs / COIN_FLIGHT_DURATION_MS));
}

export function drawGT001StorybookStage(
  ctx: CanvasCtx,
  rs: RenderSystem,
  layout: GT001StageLayout,
  showcase: GT001Showcase,
  state: GT001StorybookRenderState
): void {
  const pageRect = drawBookCoverAndPages(
    ctx,
    rs,
    layout.bookRect,
    layout.isSpread,
    state
  );
  const flightProgress = computeCoinFlightProgress(
    state.isWon,
    state.winElapsedMs,
    rs.reducedMotion
  );
  const coinLanded = state.isWon && flightProgress >= 1;

  drawLeftShowcasePage(ctx, rs, layout.leftPageSlot, showcase, state);
  if (layout.isSpread) {
    drawRightPopupSocket(ctx, rs, layout.rightPageSlot, state, coinLanded);
    drawCpaBridgeConnector(
      ctx,
      layout.leftPageSlot,
      layout.rightPageSlot,
      showcase,
      coinLanded || state.isRevealedOnClose,
      state.wrongCueActive
    );
    const openProgress = rs.reducedMotion
      ? 1
      : Math.min(1, Math.max(0, state.timeMs / BOOK_OPEN_DURATION_MS));
    drawPageTurnOverlay(ctx, pageRect, openProgress);
  }
}

export function drawGT001FlyingCoin(
  ctx: CanvasCtx,
  rs: RenderSystem,
  fromSlot: Slot,
  toSlot: Slot,
  bookTopY: number,
  item: RenderItem,
  progress: number
): void {
  if (progress <= 0 || progress >= 1 || rs.reducedMotion) {
    return;
  }
  const eased = 1 - (1 - progress) * (1 - progress);
  const cx = fromSlot.x + (toSlot.x - fromSlot.x) * eased;
  const linearY = fromSlot.y + (toSlot.y - fromSlot.y) * eased;
  const rawRadius = Math.max(14, Math.min(fromSlot.w, fromSlot.h) * 0.42);
  const scale = 1 + 0.1 * Math.sin(progress * Math.PI);
  const radius = rawRadius * scale;
  const maxArcLift = Math.max(0, linearY - (bookTopY + radius + 2));
  const lift = Math.min(26, maxArcLift) * Math.sin(progress * Math.PI);
  const cy = linearY - lift;

  ctx.save();
  drawCircle(ctx, cx, cy + 3, radius, SUCCESS[600]);
  drawCircle(ctx, cx, cy, radius, SUCCESS[100], SUCCESS[500], 3.5);
  const coinSlot: Slot = {
    ...fromSlot,
    x: Math.round(cx),
    y: Math.round(cy),
    w: Math.round(radius * 1.85),
    h: Math.round(radius * 1.85),
  };
  const rep = item.representation;
  if (!(rep && drawQuantityRepresentation(ctx, rs, coinSlot, rep))) {
    drawSafeShowcaseAsset(ctx, item.asset ?? undefined, coinSlot, 0.85);
  }
  ctx.restore();
}
