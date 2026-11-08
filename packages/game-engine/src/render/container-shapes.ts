import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha, readableTextOn } from "./color-utils.js";
import { resolveEmojiGlyph } from "./shared-render.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  legibleFontPx,
} from "./type-scale.js";

// ── Bục nấm / Target Go-NoGo (GT-026) ────────────────────────────────
export function drawPedestalTarget(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  const cx = slot.x;
  const cy = slot.y + slot.h * 0.25;
  const r = slot.w * 0.42;

  ctx.save();
  // Bục gỗ tròn
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.2);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// ── Rổ đựng hoa quả (GT-004) ─────────────────────────────────────────
export function drawBasketSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  label: string,
  rimColor: string
): void {
  const cx = slot.x;
  const cy = slot.y;
  const w = slot.w * 0.9;
  const h = slot.h * 0.75;

  ctx.save();
  // Thân rổ gỗ
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.18);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = designTokens.colors.montessori.basket;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
  ctx.fill();
  ctx.restore();

  // Viền nơ màu sắc (Đỏ hoặc Vàng)
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 16);
  ctx.stroke();

  // Dải ruy băng nhãn — cao theo cỡ chữ, chữ đổi màu theo nền nơ.
  const fontPx = legibleFontPx(15);
  const ribbonH = fontPx + 13;
  ctx.fillStyle = rimColor;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.35, cy - h * 0.55, w * 0.7, ribbonH, ribbonH / 2);
  ctx.fill();

  ctx.fillStyle = readableTextOn(
    rimColor,
    designTokens.colors.surface[0],
    designTokens.colors.surface[900]
  );
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy - h * 0.55 + ribbonH / 2, w * 0.66);
  ctx.restore();
}

/**
 * Hộp vẽ của đích chứa — KHÔNG phải `slot.w`/`slot.h`.
 *
 * Bố cục lưỡng phân cấp cho slot đích cùng cỡ với slot nguồn (120x100), nên vẽ
 * đúng cỡ slot thì cái chứa nhỏ hơn cái được bỏ vào — đúng ca sai mà
 * `GT-003.md` §14 gọi tên. Engine tính hộp lớn hơn rồi dùng **cùng** hộp đó cho
 * cả vẽ lẫn chạm (`getContainerBox`).
 */
export interface ContainerBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Quầng sáng đích — gradient toả tròn, KHÔNG phải viền chữ nhật cứng.
 * Dày lên khi vật đủ gần: trạng thái "đích đang nhận" của `GT-003.md` §12.
 */
function drawContainerAura(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: ContainerBox,
  isHovered: boolean
): void {
  const radius = Math.max(box.w, box.h) * (isHovered ? 0.85 : 0.7);
  const slotIndex =
    Math.round(box.x) * 100_000 + Math.round(box.y) * 100 + (isHovered ? 1 : 0);
  let gradient = getCachedGradient(
    ctx,
    rs.paintGeneration,
    PRIMITIVE_GRADIENTS.CONTAINER_AURA,
    slotIndex
  );
  if (!gradient) {
    gradient = ctx.createRadialGradient(
      box.x,
      box.y,
      radius * 0.35,
      box.x,
      box.y,
      radius
    );
    gradient.addColorStop(
      0,
      isHovered
        ? alpha(designTokens.colors.montessori.amber, 0.38)
        : alpha(designTokens.colors.montessori.amberLight, 0.22)
    );
    gradient.addColorStop(
      1,
      alpha(designTokens.colors.montessori.amberLight, 0)
    );
    setCachedGradient(
      ctx,
      rs.paintGeneration,
      PRIMITIVE_GRADIENTS.CONTAINER_AURA,
      slotIndex,
      gradient
    );
  }

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(box.x, box.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Vật đã bỏ vào — xếp thành hàng trong lòng khay, co giãn theo số lượng. */
function drawContainerPlacedItems(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  placedItems: readonly {
    item_id: string;
    asset: { kind: string; ref?: string; path?: string };
  }[]
): void {
  if (placedItems.length === 0) {
    return;
  }

  const count = placedItems.length;
  const innerW = box.w * 0.82;
  const chipR = Math.min(22, innerW / (count * 2.2));
  const spacing = Math.min(innerW / count, chipR * 2.4);
  const startX = box.x - ((count - 1) * spacing) / 2;
  const chipY = box.y - box.h * 0.04;

  for (let i = 0; i < count; i++) {
    const item = placedItems[i];
    if (!item) {
      continue;
    }
    const chipX = startX + i * spacing;

    ctx.save();
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.85);
    ctx.beginPath();
    ctx.arc(chipX, chipY, chipR, 0, Math.PI * 2);
    ctx.fill();

    applyEmojiFont(ctx, Math.round(chipR * 1.6));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glyph = item.asset.ref ? resolveEmojiGlyph(item.asset.ref) : "";
    if (glyph) {
      ctx.fillText(glyph, chipX, chipY);
    }
    ctx.restore();
  }
}

/**
 * Nhãn rổ kèm bộ đếm `đã bỏ/cần bỏ` — kênh đề thứ hai của `GT-003.md` §4 N2,
 * để trẻ tắt âm vẫn biết cần bao nhiêu vật.
 */
function drawContainerBadge(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  label: string,
  placedCount: number,
  targetCount: number
): void {
  const fontPx = legibleFontPx(14);
  const pillW = Math.min(box.w * 0.96, Math.max(132, label.length * 10 + 56));
  const pillH = fontPx + 14;
  const pillY = box.y + box.h / 2 - pillH / 2;
  const isComplete = placedCount >= targetCount;

  ctx.save();
  ctx.fillStyle = isComplete
    ? designTokens.colors.semantic.success[500]
    : designTokens.colors.surface[0];
  ctx.strokeStyle = isComplete
    ? designTokens.colors.semantic.success[600]
    : designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(box.x - pillW / 2, pillY, pillW, pillH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isComplete
    ? designTokens.colors.surface[0]
    : designTokens.colors.surface[800];
  applyCanvasFontAtSize(ctx, fontPx, "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${label} (${placedCount}/${targetCount})`,
    box.x,
    pillY + pillH / 2,
    pillW - 16
  );
  ctx.restore();
}

// ── Đích chứa kiểu khay gỗ Montessori (GT-003) ──────────────────────────────
/**
 * Khay đích của `drag-to-container`. Thân khay vẽ bằng `rs.drawClayContainer`
 * theo hợp đồng vẽ `GT-003.md` §12 lớp 2 — trước đây là `drawNestTarget`, một
 * cái tổ chim vẽ cho mọi chủ đề, kể cả "kéo rác vào thùng rác".
 */
export function drawContainerTarget(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: ContainerBox,
  options: {
    label: string;
    placedItems?: readonly {
      item_id: string;
      asset: { kind: string; ref?: string; path?: string };
    }[];
    targetCount: number;
    isHovered?: boolean;
  }
): void {
  const isHovered = options.isHovered ?? false;
  const placedItems = options.placedItems ?? [];

  ctx.save();
  drawContainerAura(ctx, rs, box, isHovered);
  rs.drawClayContainer(
    ctx,
    box.x,
    box.y,
    box.w,
    box.h,
    isHovered
      ? designTokens.colors.montessori.woodTrayHigh
      : designTokens.colors.montessori.woodTray,
    isHovered
      ? designTokens.colors.montessori.amber
      : designTokens.colors.montessori.woodBorder
  );
  drawContainerPlacedItems(ctx, box, placedItems);
  drawContainerBadge(
    ctx,
    box,
    options.label,
    placedItems.length,
    options.targetCount
  );
  ctx.restore();
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

/** Lọ thuỷ tinh, phần đã nhặt dâng từ đáy theo `level` (0..1). */
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
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.7);
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
  ctx.fillStyle = designTokens.colors.montessori.woodBevel;
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

// ── Đèn giao thông của trò chơi đèn xanh/đèn đỏ (GT-026, `BR-E026-12`) ──

export type TrafficLamp = "red" | "green";

const LAMP_ON_MS = 220;
const LIGHT_WIDTH_RATIO = 0.34;
const LIGHT_GAP_PX = 12;

/** Độ sáng 0..1 của đèn vừa bật: ramp trong 220 ms; reduced-motion thì sáng đủ ngay. */
export function trafficLampGlow(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return 1;
  }
  return Math.min(1, Math.max(0, elapsedMs / LAMP_ON_MS));
}

/** Hộp đèn: dải bên trái ô kích thích, cao bằng ô. */
export function trafficLightBox(slot: Slot): ContainerBox {
  return {
    x: slot.x - slot.w / 2,
    y: slot.y - slot.h / 2,
    w: slot.w * LIGHT_WIDTH_RATIO,
    h: slot.h,
  };
}

/** Phần ô còn lại bên phải đèn, dành cho vật kích thích và bục của nó. */
export function trafficStimulusSlot(slot: Slot): Slot {
  const light = trafficLightBox(slot);
  const left = light.x + light.w + LIGHT_GAP_PX;
  const w = Math.max(1, slot.x + slot.w / 2 - left);
  const size = Math.min(w, slot.h);
  return { ...slot, x: left + w / 2, w: size, h: size };
}

function drawLamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  glow: number
): void {
  ctx.save();
  ctx.fillStyle = alpha(color, 0.18 + 0.82 * glow);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  if (glow > 0) {
    ctx.strokeStyle = alpha(color, 0.45 * glow);
    ctx.lineWidth = Math.max(2, radius * 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1 + 0.2 * glow), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.55 * glow);
    ctx.beginPath();
    ctx.arc(
      cx - radius * 0.3,
      cy - radius * 0.3,
      radius * 0.22,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Đèn giao thông hai bóng: đỏ ở trên, xanh ở dưới như đèn thật (vị trí là tín
 * hiệu thứ hai cho trẻ khó phân biệt màu). Chỉ bóng `lit` sáng, bóng kia mờ.
 */
export function drawTrafficLight(
  ctx: CanvasRenderingContext2D,
  box: ContainerBox,
  lit: TrafficLamp,
  glow: number
): void {
  const radius = Math.min(box.w * 0.34, box.h * 0.22);
  const cx = box.x + box.w / 2;
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[800];
  ctx.strokeStyle = designTokens.colors.surface[950];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, box.w * 0.3);
  ctx.fill();
  ctx.stroke();
  drawLamp(
    ctx,
    cx,
    box.y + box.h * 0.28,
    radius,
    designTokens.colors.montessori.coral,
    lit === "red" ? glow : 0
  );
  drawLamp(
    ctx,
    cx,
    box.y + box.h * 0.72,
    radius,
    designTokens.colors.montessori.emeraldBright,
    lit === "green" ? glow : 0
  );
  ctx.restore();
}

// ── Rổ rung nhẹ khi vật rơi vào (GT-003, `BR-E003-09`) ────────────────

/** Rổ rung trong ngần này ms kể từ lúc vật rơi vào. */
export const BASKET_SHAKE_MS = 320;
const BASKET_SHAKE_AMPLITUDE_PX = 5;
const BASKET_SHAKE_CYCLES = 3;

/**
 * Độ lệch ngang của rổ ở `elapsedMs` kể từ lúc có vật rơi vào — hàm thuần,
 * sóng sin tắt dần về 0 đúng lúc hết nhịp. `reduced_motion` hoặc hết nhịp thì
 * không lệch (trạng thái cuối tĩnh, `BR-FBK-09`).
 */
export function basketShakeOffset(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= BASKET_SHAKE_MS) {
    return 0;
  }
  const t = elapsedMs / BASKET_SHAKE_MS;
  return (
    BASKET_SHAKE_AMPLITUDE_PX *
    (1 - t) *
    Math.sin(Math.PI * 2 * BASKET_SHAKE_CYCLES * t)
  );
}
