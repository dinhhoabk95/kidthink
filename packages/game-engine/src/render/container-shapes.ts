import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha, readableTextOn } from "./color-utils.js";
import type { ContainerBox } from "./container-effects.js";
import { resolveEmojiGlyph } from "./shared-render.js";
import { getEmojiSprite } from "./sprite-registry.js";
import {
  applyCanvasFontAtSize,
  applyEmojiFont,
  legibleFontPx,
} from "./type-scale.js";
import { drawBambooJointAccent } from "./vn-folk-motifs.js";

const BASKET_WEAVE_STROKE = alpha(
  designTokens.colors.vnMaterials.sedgeMat.weft,
  0.42
);
const TRAY_WOOD_GROOVE_STROKE = alpha(
  designTokens.colors.vnMaterials.woodGrain.groove,
  0.34
);

// ── Bục nấm / Target Go-NoGo (GT-026) ────────────────────────────────
export function drawPedestalTarget(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  const cx = slot.x;
  const cy = slot.y + slot.h * 0.25;
  const r = slot.w * 0.42;

  ctx.save();
  // Bục gỗ mộc tròn
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.2);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.vnMaterials.woodGrain.surface;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.vnMaterials.bamboo.joint;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// ── Rổ tre đan đựng hoa quả (GT-004) ──────────────────────────────────
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
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;

  ctx.save();
  // Thân rổ tre cói đan mộc
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.18);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = designTokens.colors.vnMaterials.sedgeMat.base;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 16);
  ctx.fill();
  ctx.restore();

  // Nan đan chéo rổ tre mảnh tinh tế trong lòng rổ
  ctx.strokeStyle = BASKET_WEAVE_STROKE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const rowY1 = y0 + h * 0.38;
  const rowY2 = y0 + h * 0.66;
  ctx.moveTo(x0 + 10, rowY1);
  ctx.lineTo(x0 + w - 10, rowY1);
  ctx.moveTo(x0 + 10, rowY2);
  ctx.lineTo(x0 + w - 10, rowY2);
  ctx.stroke();

  if (w >= 72) {
    drawBambooJointAccent(ctx, x0 + 16, y0 + h - 6, x0 + w - 16, y0 + h - 6, 2);
  }

  // Viền màu nhóm quanh cạp rổ
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 16);
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
    ctx.fillStyle = alpha(designTokens.colors.vnMaterials.doPaper.sheet, 0.88);
    ctx.beginPath();
    ctx.arc(chipX, chipY, chipR, 0, Math.PI * 2);
    ctx.fill();

    const glyph = item.asset.ref ? resolveEmojiGlyph(item.asset.ref) : "";
    if (glyph) {
      const sprite = getEmojiSprite(glyph);
      if (sprite) {
        const chipSize = Math.round(chipR * 1.72);
        const half = chipSize / 2;
        ctx.drawImage(sprite, chipX - half, chipY - half, chipSize, chipSize);
      } else {
        applyEmojiFont(ctx, Math.round(chipR * 1.6));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(glyph, chipX, chipY);
      }
    }
    ctx.restore();
  }
}

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
    : designTokens.colors.vnMaterials.doPaper.sheet;
  ctx.strokeStyle = isComplete
    ? designTokens.colors.semantic.success[600]
    : designTokens.colors.vnMaterials.bamboo.joint;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(box.x - pillW / 2, pillY, pillW, pillH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isComplete
    ? designTokens.colors.surface[0]
    : designTokens.colors.vnMaterials.doPaper.ink;
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
      : designTokens.colors.vnMaterials.woodGrain.surface,
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

// ── Đèn giao thông của trò chơi đèn xanh/đèn đỏ (GT-026, `BR-E026-12`) ──

export type TrafficLamp = "red" | "green";

const LAMP_ON_MS = 220;
const LIGHT_WIDTH_RATIO = 0.34;
const LIGHT_GAP_PX = 12;

export function trafficLampGlow(
  elapsedMs: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return 1;
  }
  return Math.min(1, Math.max(0, elapsedMs / LAMP_ON_MS));
}

export function trafficLightBox(slot: Slot): ContainerBox {
  return {
    x: slot.x - slot.w / 2,
    y: slot.y - slot.h / 2,
    w: slot.w * LIGHT_WIDTH_RATIO,
    h: slot.h,
  };
}

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

export const BASKET_SHAKE_MS = 320;
const BASKET_SHAKE_AMPLITUDE_PX = 5;
const BASKET_SHAKE_CYCLES = 3;

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

// ── Khay phân loại kèm thẻ kiểm tra hình (GT-004, `BR-E004-05`) ───────

export interface TrayRect {
  readonly h: number;
  readonly w: number;
  readonly x: number;
  readonly y: number;
}

export interface SortTrayGeometry {
  readonly body: TrayRect;
  readonly card: TrayRect;
  readonly front: TrayRect;
  readonly handle: TrayRect;
  readonly label: TrayRect;
}

const TRAY_FRONT_RATIO = 0.45;

export function sortTrayGeometry(slot: Slot): SortTrayGeometry {
  const w = slot.w * 0.9;
  const h = slot.h * 0.75;
  const body: TrayRect = { x: slot.x - w / 2, y: slot.y - h / 2, w, h };
  const frontH = h * TRAY_FRONT_RATIO;
  const front: TrayRect = {
    x: body.x,
    y: body.y + h - frontH,
    w,
    h: frontH,
  };
  const side = Math.max(20, frontH * 0.8);
  const pad = (frontH - side) / 2;
  const card: TrayRect = {
    x: front.x + Math.max(6, w * 0.08),
    y: front.y + pad,
    w: side,
    h: side,
  };
  const handleX = card.x + side + w * 0.1;
  const handleH = Math.max(6, frontH * 0.2);
  const handle: TrayRect = {
    x: handleX,
    y: front.y + (frontH - handleH) / 2,
    w: Math.max(12, body.x + w - Math.max(6, w * 0.08) - handleX),
    h: handleH,
  };
  const fontPx = legibleFontPx(15);
  const ribbonH = fontPx + 13;
  const label: TrayRect = {
    x: slot.x - w * 0.35,
    y: slot.y - h * 0.55,
    w: w * 0.7,
    h: ribbonH,
  };
  return { body, card, front, handle, label };
}

export function drawSortTray(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  label: string,
  rimColor: string
): void {
  const { body, card, front, handle, label: ribbon } = sortTrayGeometry(slot);
  const wood = designTokens.colors.montessori;
  const vn = designTokens.colors.vnMaterials;

  ctx.save();
  ctx.save();
  ctx.shadowColor = alpha(wood.woodBorder, 0.18);
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = vn.woodGrain.surface;
  ctx.beginPath();
  ctx.roundRect(body.x, body.y, body.w, body.h, 14);
  ctx.fill();
  ctx.restore();

  // Mặt trước ngăn kéo tre gỗ mộc
  ctx.fillStyle = vn.bamboo.light;
  ctx.beginPath();
  ctx.roundRect(front.x, front.y, front.w, front.h, 10);
  ctx.fill();
  ctx.strokeStyle = vn.bamboo.joint;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Đường vân gỗ ngang trên ngăn kéo
  ctx.strokeStyle = TRAY_WOOD_GROOVE_STROKE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(handle.x, front.y + front.h * 0.78);
  ctx.lineTo(handle.x + handle.w, front.y + front.h * 0.78);
  ctx.stroke();

  // Viền màu nhóm quanh thân khay
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(body.x, body.y, body.w, body.h, 14);
  ctx.stroke();

  // Khung thẻ kiểm tra hình trên nền giấy dó
  ctx.fillStyle = vn.doPaper.sheet;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 6);
  ctx.fill();
  ctx.strokeStyle = wood.woodBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tay nắm gỗ sậm
  ctx.fillStyle = wood.woodBorder;
  ctx.beginPath();
  ctx.roundRect(handle.x, handle.y, handle.w, handle.h, handle.h / 2);
  ctx.fill();

  // Dải nhãn nhóm
  ctx.fillStyle = rimColor;
  ctx.beginPath();
  ctx.roundRect(ribbon.x, ribbon.y, ribbon.w, ribbon.h, ribbon.h / 2);
  ctx.fill();
  ctx.fillStyle = readableTextOn(
    rimColor,
    designTokens.colors.surface[0],
    designTokens.colors.surface[900]
  );
  applyCanvasFontAtSize(ctx, legibleFontPx(15), "heading", "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, slot.x, ribbon.y + ribbon.h / 2, ribbon.w * 0.94);
  ctx.restore();
}

// Re-export giữ tương thích mọi import hiện có vào `#src/render/container-shapes`
// biome-ignore lint/performance/noBarrelFile: giữ tương thích import sau khi tách file dưới 800 dòng
export * from "./container-effects.js";
