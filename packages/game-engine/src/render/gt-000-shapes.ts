import type { LogicSpace } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import type { ItemVisualState } from "./types.js";

export const GT000_CARD_BOUNCE_DURATION_MS = 220;
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

/** Nguồn hình học duy nhất cho Flashcard của GT-000 (`present` / `echo`). */
export function resolveGT000FlashcardRect(
  logic: LogicSpace,
  slot: Pick<Slot, "x" | "y" | "w" | "h">
): GT000FlashcardRect {
  const w = Math.round(
    Math.max(280, Math.min(Math.max(slot.w, 350), logic.w * 0.42))
  );
  const h = Math.round(
    Math.max(260, Math.min(Math.max(slot.h, 304), logic.h * 0.56))
  );
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

function drawExpandedCardRect(
  ctx: CanvasRenderingContext2D,
  r: GT000FlashcardRect,
  ex: number,
  rad: number,
  col: string,
  w = 3
): void {
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
  stepElapsedMs: number
): void {
  const c = designTokens.colors;
  ctx.save();
  if (rs.reducedMotion || stepElapsedMs >= GT000_ECHO_WAVE_ACTIVE_MS) {
    drawExpandedCardRect(ctx, rect, 10, 34, alpha(c.cta[400], 0.36));
    ctx.restore();
    return;
  }
  for (let ring = 0; ring < 3; ring++) {
    const phase = ((stepElapsedMs + ring * 360) % 1100) / 1100;
    const ex = 8 + phase * 26;
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
  cardBounceMs: number
): void {
  if (cardBounceMs <= 0) {
    return;
  }
  const p =
    1 - Math.max(0, Math.min(1, cardBounceMs / GT000_CARD_BOUNCE_DURATION_MS));
  const a = rs.reducedMotion ? 0.35 : (1 - p) * 0.5;
  ctx.save();
  const ex = rs.reducedMotion ? 8 : 6 + p * 20;
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

/** Bổ sung kênh thị giác phi-màu cho `touching` / `selected` và gợn ấm khi chạm nhầm trên Grid. */
export function drawGT000GridItemAccent(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  state: ItemVisualState | undefined,
  nudgeMs = 0
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const c = designTokens.colors;
  ctx.save();
  if (state === "touching") {
    const col = alpha(c.brand[400], 0.72);
    drawRing(ctx, slot, r + 4, col, 2.5);
    drawRing(ctx, slot, Math.max(12, r - 6), col, 2.5);
  } else if (state === "selected") {
    drawRing(ctx, slot, r + 6, c.brand[400], 3);
    const yDot = slot.y - r - 5;
    drawFilledDot(ctx, slot.x, yDot, 5.5, c.brand[500], c.surface[0], 2);
  }
  if (nudgeMs > 0) {
    const p = 1 - Math.max(0, Math.min(1, nudgeMs / GT000_NUDGE_DURATION_MS));
    const a = rs.reducedMotion ? 0.45 : (1 - p) * 0.65;
    const dr = rs.reducedMotion ? 5 : 3 + p * 12;
    drawRing(ctx, slot, r + dr, alpha(c.montessori.amber, a), 2.5);
  }
  ctx.restore();
}

/** Vòng hào quang hổ phách quanh thẻ mục tiêu khi Cô Cú nhắc bài (`BR-E000-14`). */
export function drawGT000RePresentSpotlight(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  timerMs: number
): void {
  if (timerMs <= 0) {
    return;
  }
  const baseR = Math.max(slot.w, slot.h) / 2;
  const pulse = rs.reducedMotion
    ? 0
    : Math.sin((timerMs / 240) * Math.PI * 2) * 4;
  const c = designTokens.colors;
  ctx.save();
  ctx.fillStyle = alpha(c.montessori.amberLight, 0.28);
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, baseR + 14 + pulse, 0, Math.PI * 2);
  ctx.fill();
  const r1 = baseR + 8 + pulse * 0.6;
  drawRing(ctx, slot, r1, alpha(c.semantic.warning[400], 0.78), 3.5);
  drawRing(ctx, slot, baseR + 16 + pulse, alpha(c.cta[400], 0.52), 2.5);
  ctx.fillStyle = c.cta[500];
  ctx.beginPath();
  ctx.arc(slot.x, slot.y - baseR - 20 - pulse * 0.5, 5, 0, Math.PI * 2);
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
