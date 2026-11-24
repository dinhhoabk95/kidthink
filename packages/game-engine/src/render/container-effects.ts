import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import { alpha } from "./color-utils.js";

/**
 * Hộp vẽ của đích chứa — KHÔNG phải `slot.w`/`slot.h`.
 */
export interface ContainerBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

// ── Lọ nhặt sao (GT-037, `BR-E037-14`) ───────────────────────────────

/** Thời gian ngôi sao bay từ ô đích vào miệng lọ. */
export const JAR_STAR_FLIGHT_MS = 600;

/** Mỗi sao thêm làm lọ đầy thêm phần này của chỗ còn trống khi không biết tổng. */
const JAR_OPEN_ENDED_STEP = 0.15;
const JAR_MAX_LEVEL = 0.92;
const JAR_STAR_ARC_RATIO = 0.18;
const JAR_STAR_END_SCALE = 0.55;

export interface JarPoint {
  readonly x: number;
  readonly y: number;
}

export interface StarFlightPose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/**
 * Chỗ đặt lọ: phần mép sân khấu mà bố cục khung năm vùng để trống — cột phải
 * (landscape) hoặc dải đáy (portrait) — nên lọ không bao giờ che ô chạm.
 * Trả `null` khi mép không đủ rộng để vẽ.
 */
export function collectJarBox(
  stage: ZoneRect,
  logicW: number,
  logicH: number
): ContainerBox | null {
  const isLandscape = logicW >= logicH;
  const box: ContainerBox = isLandscape
    ? (() => {
        const x = stage.x + stage.w + SLOT_GAP_PX;
        const w = logicW - SLOT_GAP_PX - x;
        return { x, y: stage.y, w, h: Math.min(w * 1.25, stage.h * 0.5) };
      })()
    : (() => {
        const y = stage.y + stage.h + SLOT_GAP_PX;
        const h = logicH - SLOT_GAP_PX - y;
        return { x: stage.x, y, w: h, h };
      })();
  return box.w > 0 && box.h > 0 ? box : null;
}

/** Mức đầy 0..1 của lọ. `total` là `null` khi không được lộ tổng: lọ đầy dần nhưng không bao giờ đầy. */
export function jarFillLevel(landed: number, total: number | null): number {
  const count = Math.max(0, landed);
  if (total === null || total <= 0) {
    return JAR_MAX_LEVEL * (1 - (1 - JAR_OPEN_ENDED_STEP) ** count);
  }
  return Math.min(1, count / total);
}

/** Điểm miệng lọ mà sao bay tới. */
export function jarMouth(box: ContainerBox): JarPoint {
  return { x: box.x + box.w / 2, y: box.y + box.h * 0.2 };
}

/**
 * Tư thế sao bay ở `elapsedMs` — hàm thuần. `null` khi đã vào lọ hoặc khi
 * reduced-motion (trạng thái cuối: sao đã nằm trong lọ, không bay).
 */
export function starFlightPose(
  from: JarPoint,
  to: JarPoint,
  elapsedMs: number,
  reducedMotion: boolean
): StarFlightPose | null {
  if (reducedMotion || elapsedMs >= JAR_STAR_FLIGHT_MS) {
    return null;
  }
  const t = Math.min(1, Math.max(0, elapsedMs / JAR_STAR_FLIGHT_MS));
  const eased = t * t * (3 - 2 * t);
  const arc = Math.abs(to.x - from.x) * JAR_STAR_ARC_RATIO + 24;
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased - arc * Math.sin(Math.PI * t),
    scale: 1 - (1 - JAR_STAR_END_SCALE) * eased,
  };
}

function traceStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number
): void {
  const inner = outer * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

/** Lọ thuỷ tinh nắp tre mộc, phần đã nhặt dâng từ đáy theo `level` (0..1). */
export function drawCollectJar(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  level: number
): void {
  const neckH = box.h * 0.12;
  const bodyY = box.y + neckH;
  const bodyH = box.h - neckH;
  const radius = Math.min(box.w, bodyH) * 0.2;
  ctx.save();
  ctx.fillStyle = alpha(designTokens.colors.vnMaterials.doPaper.sheet, 0.72);
  ctx.beginPath();
  ctx.roundRect(box.x, bodyY, box.w, bodyH, radius);
  ctx.fill();

  const fillH = bodyH * Math.min(1, Math.max(0, level));
  if (fillH > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(box.x, bodyY, box.w, bodyH, radius);
    ctx.clip();
    ctx.fillStyle = designTokens.colors.montessori.amberBright;
    ctx.fillRect(box.x, bodyY + bodyH - fillH, box.w, fillH);
    ctx.restore();
  }

  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(box.x, bodyY, box.w, bodyH, radius);
  ctx.stroke();
  ctx.fillStyle = designTokens.colors.vnMaterials.bamboo.stalk;
  ctx.beginPath();
  ctx.roundRect(box.x + box.w * 0.2, box.y, box.w * 0.6, neckH, neckH / 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Ngôi sao đang bay; `size` là bán kính ngoài lúc chưa thu nhỏ. */
export function drawFlyingStar(
  ctx: CanvasRenderingContext2D,
  pose: StarFlightPose,
  size: number
): void {
  ctx.save();
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDeep;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  traceStar(ctx, pose.x, pose.y, size * pose.scale);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── Đom đóm nhấp nháy dưới nắp chuông thuỷ tinh (GT-012, `BR-E012-08`) ──

/** Một nhịp nhấp nháy của đom đóm. */
export const FIREFLY_PERIOD_MS = 1200;
/** Nắp chuông nhấc lên (đầu pha nhìn) và hạ xuống (cuối pha nhìn) trong ngần này ms. */
export const BELL_LIFT_MS = 250;
const FIREFLY_MIN_GLOW = 0.35;
const FIREFLY_PHASE_STEP = 0.37;
const BELL_LIFT_FRACTION_OF_RADIUS = 0.55;

function smoothstep01(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Độ sáng của đom đóm thứ `index` ở `elapsedMs` kể từ lúc mở nắp: sóng sin
 * trong [0,35; 1], mỗi con lệch pha. `reduced_motion` sáng tĩnh ở mức cao nhất.
 */
export function fireflyGlow(
  elapsedMs: number,
  index: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return 1;
  }
  const phase = elapsedMs / FIREFLY_PERIOD_MS + index * FIREFLY_PHASE_STEP;
  const mid = (1 + FIREFLY_MIN_GLOW) / 2;
  const amp = (1 - FIREFLY_MIN_GLOW) / 2;
  return mid + amp * Math.sin(Math.PI * 2 * phase);
}

/** Bán kính quầng sáng theo độ sáng — dùng chung cho vẽ và test. */
export function fireflyHaloRadius(slot: Slot, glow: number): number {
  return Math.min(slot.w, slot.h) * (0.5 + 0.3 * glow);
}

/** Quầng sáng vàng nhạt quanh một đom đóm; vẽ trước vật để vật luôn rõ. */
export function drawFireflyGlow(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  glow: number
): void {
  const r = fireflyHaloRadius(slot, glow);
  const g = ctx.createRadialGradient(
    slot.x,
    slot.y,
    r * 0.1,
    slot.x,
    slot.y,
    r
  );
  g.addColorStop(
    0,
    alpha(designTokens.colors.montessori.amberGlow, 0.35 + 0.5 * glow)
  );
  g.addColorStop(1, alpha(designTokens.colors.montessori.amberGlow, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function bellLiftProgress(
  elapsedMs: number,
  durationMs: number,
  reducedMotion: boolean
): number {
  if (elapsedMs < 0 || elapsedMs >= durationMs) {
    return 0;
  }
  if (reducedMotion) {
    return 1;
  }
  const rise = smoothstep01(elapsedMs / BELL_LIFT_MS);
  const fall = smoothstep01((durationMs - elapsedMs) / BELL_LIFT_MS);
  return Math.min(rise, fall);
}

export function drawGlassBell(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  lift: number
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const bellR = r * 0.82;
  ctx.save();
  ctx.translate(0, -lift * r * BELL_LIFT_FRACTION_OF_RADIUS);
  ctx.globalAlpha = 1 - 0.5 * lift;
  ctx.fillStyle = alpha(designTokens.colors.surface[100], 0.45);
  ctx.strokeStyle = designTokens.colors.surface[400];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, bellR, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, bellR * 0.78, Math.PI * 1.15, Math.PI * 1.4, false);
  ctx.stroke();
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(slot.x, slot.y - bellR - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
