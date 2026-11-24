import type { LogicSpace } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import type { ItemVisualState } from "./types.js";

export const GT000_CARD_BOUNCE_DURATION_MS = 220;
export const GT000_EXPLORE_BOUNCE_MS = 260;
export const GT000_ECHO_WAVE_ACTIVE_MS = 2200;
export const GT000_SPOTLIGHT_DURATION_MS = 1600;
export const GT000_NUDGE_DURATION_MS = 200;

export interface GT000FlashcardRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly left: number;
  readonly top: number;
}

/**
 * Nguồn hình học duy nhất cho Flashcard của GT-000 (`present` / `echo`).
 * Khi `slot` đã được tính theo trang Sách Giấy Dó (`w >= 96`, `h >= 96`),
 * tôn trọng biên hộp `bounds` để sóng âm / viền không tràn khỏi `zones.stage`.
 */
export function resolveGT000FlashcardRect(
  logic: LogicSpace,
  slot: Pick<Slot, "x" | "y" | "w" | "h">,
  bounds?: ZoneRect
): GT000FlashcardRect {
  if (bounds) {
    const maxW = Math.max(64, bounds.w - 24);
    const maxH = Math.max(64, bounds.h - 24);
    const w = Math.round(Math.min(maxW, Math.max(64, slot.w)));
    const h = Math.round(Math.min(maxH, Math.max(64, slot.h)));
    const cx = Math.min(
      bounds.x + bounds.w - w / 2 - 4,
      Math.max(bounds.x + w / 2 + 4, slot.x)
    );
    const cy = Math.min(
      bounds.y + bounds.h - h / 2 - 4,
      Math.max(bounds.y + h / 2 + 4, slot.y)
    );
    return {
      x: Math.round(cx),
      y: Math.round(cy),
      w,
      h,
      left: Math.round(cx - w / 2),
      top: Math.round(cy - h / 2),
    };
  }
  if (slot.w >= 140 && slot.h >= 100) {
    const w = Math.round(slot.w);
    const h = Math.round(slot.h);
    return {
      x: Math.round(slot.x),
      y: Math.round(slot.y),
      w,
      h,
      left: Math.round(slot.x - w / 2),
      top: Math.round(slot.y - h / 2),
    };
  }
  const w = Math.min(350, logic.w - 40);
  const h = Math.min(280, logic.h - 240);
  return {
    x: slot.x,
    y: slot.y,
    w,
    h,
    left: slot.x - w / 2,
    top: slot.y - h / 2,
  };
}

export interface GT000SegmentProgressInfo {
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly isLastReview?: boolean;
}

function resolveDotStyle(
  idx: number,
  cur: number,
  isRev: boolean
): readonly [string, string, number] {
  const c = designTokens.colors;
  if (idx < cur) {
    return [c.semantic.success[400], c.semantic.success[600], 1.5];
  }
  if (idx === cur) {
    return [c.cta[400], c.brand[500], 2.2];
  }
  return isRev
    ? [c.montessori.amberLight, c.montessori.amber, 1.5]
    : [c.surface[200], c.surface[300], 1.5];
}

function drawSegmentDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  idx: number,
  cur: number,
  isRev: boolean
): void {
  const r = idx === cur ? 7 : 5.5;
  const [fill, stroke, w] = resolveDotStyle(idx, cur, isRev);
  if (isRev) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w;
    ctx.beginPath();
    const oR = r + 1.5;
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 === 0 ? oR : oR * 0.48;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    drawFilledDot(ctx, cx, cy, r, fill, stroke, w);
  }
  if (idx <= cur) {
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.75);
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.28, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Dải mốc tiến độ phân đoạn bằng hạt tròn Claymorphism ở chân sân khấu (`rs.LOGIC_HEIGHT - 20`). */
export function drawGT000SegmentProgress(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  info: GT000SegmentProgressInfo
): void {
  const count = Math.min(12, Math.max(0, info.totalCount));
  if (count < 2) {
    return;
  }
  const startX = rs.LOGIC_WIDTH / 2 - ((count - 1) * 18) / 2;
  const cy = Math.round(rs.LOGIC_HEIGHT - 20);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const isRev = Boolean(info.isLastReview && i === count - 1);
    drawSegmentDot(ctx, startX + i * 18, cy, i, info.currentIndex, isRev);
  }
  ctx.restore();
}

function clampExpand(
  r: GT000FlashcardRect,
  ex: number,
  bounds?: ZoneRect
): number {
  if (!bounds) {
    return ex;
  }
  const availLeft = r.left - bounds.x - 2;
  const availRight = bounds.x + bounds.w - (r.left + r.w) - 2;
  const availTop = r.top - bounds.y - 2;
  const availBot = bounds.y + bounds.h - (r.top + r.h) - 2;
  return Math.max(0, Math.min(ex, availLeft, availRight, availTop, availBot));
}

function drawExpandedCardRect(
  ctx: CanvasRenderingContext2D,
  r: GT000FlashcardRect,
  ex: number,
  rad: number,
  col: string,
  w = 3
): void {
  if (ex <= 0) {
    return;
  }
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.roundRect(r.left - ex, r.top - ex, r.w + ex * 2, r.h + ex * 2, rad);
  ctx.stroke();
}

/** Sóng âm đồng tâm quanh Flashcard ở bước `echo` khi `speakAlong === "tap"`. */
export function drawGT000EchoWaves(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect: GT000FlashcardRect,
  stepElapsedMs: number,
  bounds?: ZoneRect
): void {
  const c = designTokens.colors;
  ctx.save();
  if (rs.reducedMotion || stepElapsedMs >= GT000_ECHO_WAVE_ACTIVE_MS) {
    drawExpandedCardRect(
      ctx,
      rect,
      clampExpand(rect, 10, bounds),
      34,
      alpha(c.cta[400], 0.36)
    );
    ctx.restore();
    return;
  }
  for (let ring = 0; ring < 3; ring++) {
    const phase = ((stepElapsedMs + ring * 360) % 1100) / 1100;
    const ex = clampExpand(rect, 8 + phase * 26, bounds);
    const base = ring % 2 === 0 ? c.brand[400] : c.cta[400];
    const col = alpha(base, Math.max(0.05, (1 - phase) * 0.42));
    drawExpandedCardRect(ctx, rect, ex, 32 + ex * 0.4, col, 3 - phase * 1.4);
  }
  ctx.restore();
}

/** Vòng gợn sáng xúc giác khi trẻ chạm Flashcard để nghe lại (`replay`). */
export function drawGT000ReplayRipple(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  rect: GT000FlashcardRect,
  cardBounceMs: number,
  bounds?: ZoneRect
): void {
  if (cardBounceMs <= 0) {
    return;
  }
  const p =
    1 - Math.max(0, Math.min(1, cardBounceMs / GT000_CARD_BOUNCE_DURATION_MS));
  const a = rs.reducedMotion ? 0.35 : (1 - p) * 0.5;
  ctx.save();
  const rawEx = rs.reducedMotion ? 8 : 6 + p * 20;
  const ex = clampExpand(rect, rawEx, bounds);
  drawExpandedCardRect(
    ctx,
    rect,
    ex,
    34,
    alpha(designTokens.colors.cta[400], a)
  );
  ctx.restore();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  pt: { readonly x: number; readonly y: number },
  r: number,
  col: string,
  w: number
): void {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFilledDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke: string,
  w: number
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function maxSafeRadius(
  pt: { readonly x: number; readonly y: number },
  bounds?: ZoneRect
): number {
  if (!bounds) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(
    8,
    Math.min(
      pt.x - bounds.x - 2,
      bounds.x + bounds.w - pt.x - 2,
      pt.y - bounds.y - 2,
      bounds.y + bounds.h - pt.y - 2
    )
  );
}

/** Bổ sung kênh thị giác phi-màu cho `touching` / `selected` và gợn ấm khi chạm nhầm trên Grid. */
export function drawGT000GridItemAccent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  state: ItemVisualState | undefined,
  nudgeMs = 0,
  bounds?: ZoneRect
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const maxR = maxSafeRadius(slot, bounds);
  const c = designTokens.colors;
  ctx.save();
  if (state === "touching") {
    const col = alpha(c.brand[400], 0.72);
    drawRing(ctx, slot, Math.min(maxR, r + 4), col, 2.5);
    drawRing(ctx, slot, Math.min(maxR, Math.max(12, r - 6)), col, 2.5);
  } else if (state === "selected") {
    drawRing(ctx, slot, Math.min(maxR, r + 6), c.brand[400], 3);
    const rawDotY = slot.y - r - 5;
    const minDotY = bounds ? bounds.y + 8 : rawDotY;
    drawFilledDot(
      ctx,
      slot.x,
      Math.max(minDotY, rawDotY),
      5.5,
      c.brand[500],
      c.surface[0],
      2
    );
  }
  if (nudgeMs > 0) {
    const p = 1 - Math.max(0, Math.min(1, nudgeMs / GT000_NUDGE_DURATION_MS));
    const a = rs.reducedMotion ? 0.45 : (1 - p) * 0.65;
    const dr = rs.reducedMotion ? 5 : 3 + p * 12;
    drawRing(
      ctx,
      slot,
      Math.min(maxR, r + dr),
      alpha(c.montessori.amber, a),
      2.5
    );
  }
  ctx.restore();
}

/** Vòng hào quang hổ phách quanh thẻ mục tiêu khi Cô Cú nhắc bài (`BR-E000-14`). */
export function drawGT000RePresentSpotlight(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  timerMs: number,
  bounds?: ZoneRect
): void {
  if (timerMs <= 0) {
    return;
  }
  const baseR = Math.max(slot.w, slot.h) / 2;
  const maxR = maxSafeRadius(slot, bounds);
  const pulse = rs.reducedMotion
    ? 0
    : Math.sin((timerMs / 240) * Math.PI * 2) * 4;
  const c = designTokens.colors;
  ctx.save();
  ctx.fillStyle = alpha(c.montessori.amberLight, 0.28);
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, Math.min(maxR, baseR + 14 + pulse), 0, Math.PI * 2);
  ctx.fill();
  const r1 = Math.min(maxR, baseR + 8 + pulse * 0.6);
  drawRing(ctx, slot, r1, alpha(c.semantic.warning[400], 0.78), 3.5);
  drawRing(
    ctx,
    slot,
    Math.min(maxR, baseR + 16 + pulse),
    alpha(c.cta[400], 0.52),
    2.5
  );
  const rawDotY = slot.y - baseR - 20 - pulse * 0.5;
  const minDotY = bounds ? bounds.y + 7 : rawDotY;
  ctx.fillStyle = c.cta[500];
  ctx.beginPath();
  ctx.arc(slot.x, Math.max(minDotY, rawDotY), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Dây nối cong mượt giữa 2 thẻ hoặc từ thẻ nguồn tới ngón tay ở bước `link`. */
export function drawGT000LinkConnector(
  ctx: CanvasRenderingContext2D,
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number }
): void {
  const c = designTokens.colors;
  ctx.save();
  ctx.strokeStyle = c.brand[400];
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 28;
  ctx.quadraticCurveTo(midX, midY, to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const pt of [from, to]) {
    drawFilledDot(ctx, pt.x, pt.y, 7, c.cta[400], c.surface[0], 2.5);
  }
  ctx.restore();
}
