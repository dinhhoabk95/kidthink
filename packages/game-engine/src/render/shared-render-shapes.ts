import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import {
  getCachedGradient,
  getContextGeneration,
  PRIMITIVE_GRADIENTS,
  setCachedGradient,
} from "./cache.js";
import { alpha } from "./color-utils.js";
import { drawSlotItem } from "./shared-render.js";
import type { ItemVisualState, RenderAsset, SceneBox } from "./types.js";

/**
 * Bàn chơi riêng của từng engine — mê cung, cân, đồng hồ, khối lập phương,
 * trục đối xứng, đường đồ.
 *
 * Mỗi hàm nhận một **hộp** (`SceneBox`) đo từ khung logic hoặc từ slot của
 * layout, rồi tự chia ô bên trong. Không hàm nào đọc `960`/`540` trực tiếp:
 * kích thước luôn đi vào qua tham số, nên đổi khung logic là bố cục theo cùng.
 */

export const BOARD_LINE_PX = 3;
export const WALL_LINE_PX = 6;

/** Hộp con canh giữa trong một hộp cha, chừa lề theo tỉ lệ. */
export function insetBox(box: SceneBox, ratio: number): SceneBox {
  const dx = box.w * ratio;
  const dy = box.h * ratio;
  return { x: box.x + dx, y: box.y + dy, w: box.w - dx * 2, h: box.h - dy * 2 };
}

/** Hộp vuông lớn nhất nằm gọn trong hộp cha, canh giữa. */
export function squareBox(box: SceneBox): SceneBox {
  const side = Math.min(box.w, box.h);
  return {
    x: box.x + (box.w - side) / 2,
    y: box.y + (box.h - side) / 2,
    w: side,
    h: side,
  };
}

/** Hộp bao quanh một nhóm slot — dùng khi engine vẽ bàn chơi lên vùng slot. */
export function boxFromSlots(slots: readonly Slot[]): SceneBox | null {
  if (slots.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const s of slots) {
    minX = Math.min(minX, s.x - s.w / 2);
    minY = Math.min(minY, s.y - s.h / 2);
    maxX = Math.max(maxX, s.x + s.w / 2);
    maxY = Math.max(maxY, s.y + s.h / 2);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ── Mê cung (GT-013) ────────────────────────────────────────────────

/**
 * Toạ độ trong `content_pack` là **dữ liệu**, không phải hằng số trong mã:
 * hợp đồng khai `x`/`y` trong khoảng khung logic. Hàm này ánh xạ chúng vào một
 * hộp con để cảnh chia đôi (GT-025) hay thu nhỏ vẫn giữ đúng bố cục tương đối.
 */
export interface PositionedObject {
  readonly id: string;
  readonly asset?: RenderAsset | null;
  readonly x?: number;
  readonly y?: number;
}

const SCENE_ITEM_PX = 72;

export function slotAtPoint(x: number, y: number, size = SCENE_ITEM_PX): Slot {
  return {
    index: 0,
    x,
    y,
    w: size,
    h: size,
    hitW: size,
    hitH: size,
    page: 0,
    role: "target",
  };
}

export function drawSceneObjectAt(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  box: SceneBox,
  obj: PositionedObject,
  fallback: Slot | undefined,
  opts: { found?: boolean; wrong?: boolean } = {}
): void {
  const slot =
    obj.x === undefined || obj.y === undefined
      ? fallback
      : slotAtPoint(
          box.x + (obj.x / rs.LOGIC_WIDTH) * box.w,
          box.y + (obj.y / rs.LOGIC_HEIGHT) * box.h
        );
  if (!slot) {
    return;
  }
  let state: ItemVisualState = "idle";
  if (opts.found) {
    state = "correct";
  } else if (opts.wrong) {
    state = "wrong";
  }
  drawSlotItem(ctx, rs, slot, {
    id: obj.id,
    asset: obj.asset,
    state,
  });
}

/** Vật đang nằm trên một đĩa cân — cỡ nhỏ, xếp đều theo bề ngang đĩa. */
export function drawPanItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pan: SceneBox,
  items: readonly PositionedObject[]
): void {
  if (items.length === 0) {
    return;
  }
  const size = Math.min(pan.w / items.length, pan.h) * 0.9;
  const startX = pan.x + (pan.w - size * items.length) / 2 + size / 2;
  items.forEach((item, i) => {
    const slot = slotAtPoint(startX + i * size, pan.y - size / 2, size);
    drawSlotItem(ctx, rs, slot, { id: item.id, asset: item.asset });
  });
}

// ── Đĩa gỗ tròn & Đĩa đậy nắp Cloche (GT-002, GT-012) ────────────────
export function drawWoodenPlate(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isSelected = false
): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const cx = slot.x;
  const cy = slot.y;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = isSelected
    ? alpha(designTokens.colors.montessori.amber, 0.45)
    : alpha(designTokens.colors.montessori.woodBorder, 0.22);
  ctx.shadowBlur = isSelected ? 18 : 10;
  ctx.shadowOffsetY = isSelected ? 8 : 4;
  ctx.fillStyle = isSelected
    ? designTokens.colors.montessori.amber
    : designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(cx, cy + (isSelected ? -4 : 0), r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Slab
  ctx.save();
  ctx.translate(0, 5);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Plate Rim (Warm Oak Wood)
  const gen = getContextGeneration(ctx);
  let plateGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PLATE_RIM,
    slot.index
  );
  if (!plateGrad) {
    plateGrad = ctx.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.3,
      r * 0.1,
      cx,
      cy,
      r
    );
    plateGrad.addColorStop(0, designTokens.colors.montessori.plateLight);
    plateGrad.addColorStop(0.7, designTokens.colors.montessori.plateMid);
    plateGrad.addColorStop(1, designTokens.colors.montessori.plateEdge);
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_RIM,
      slot.index,
      plateGrad
    );
  }
  ctx.fillStyle = plateGrad;
  ctx.strokeStyle = isSelected
    ? designTokens.colors.montessori.amber
    : designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = isSelected ? 4 : 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Inner Indented Recess
  const innerR = r * 0.75;
  let innerGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PLATE_INNER,
    slot.index
  );
  if (!innerGrad) {
    innerGrad = ctx.createRadialGradient(cx, cy, innerR * 0.2, cx, cy, innerR);
    innerGrad.addColorStop(0, designTokens.colors.montessori.plateInner);
    innerGrad.addColorStop(1, designTokens.colors.montessori.plateInnerEdge);
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_INNER,
      slot.index,
      innerGrad
    );
  }
  ctx.fillStyle = innerGrad;
  ctx.strokeStyle = alpha(designTokens.colors.montessori.woodBorder, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Specular highlight curve
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.restore();
}

/** Đĩa nắp bạc Cloche hé mở cho GT-012 */
export function drawClocheScene(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isRevealed: boolean
): void {
  const cx = slot.x;
  const cy = slot.y;
  const r = Math.min(slot.w, slot.h) / 2;

  // Vẽ đĩa gỗ bên dưới
  drawWoodenPlate(ctx, slot, false);

  if (!isRevealed) {
    // Nắp bạc đậy kín
    ctx.save();
    const clocheR = r * 0.78;
    const gen = getContextGeneration(ctx);
    let clocheGrad = getCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PLATE_CLOCHE,
      slot.index
    );
    if (!clocheGrad) {
      clocheGrad = ctx.createRadialGradient(
        cx - clocheR * 0.3,
        cy - clocheR * 0.4,
        clocheR * 0.1,
        cx,
        cy,
        clocheR
      );
      clocheGrad.addColorStop(0, designTokens.colors.surface[0]);
      clocheGrad.addColorStop(0.5, designTokens.colors.surface[200]);
      clocheGrad.addColorStop(1, designTokens.colors.surface[400]);
      setCachedGradient(
        ctx,
        gen,
        PRIMITIVE_GRADIENTS.PLATE_CLOCHE,
        slot.index,
        clocheGrad
      );
    }
    ctx.fillStyle = clocheGrad;
    ctx.strokeStyle = designTokens.colors.surface[500];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, clocheR, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tay nắm nắp (Knob)
    ctx.fillStyle = designTokens.colors.montessori.amber;
    ctx.strokeStyle = designTokens.colors.montessori.amberDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - clocheR - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Khay thả hình học Montessori (GT-008) ────────────────────────────
export function drawShapeTray(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const padX = 22;
  const padY = 16;
  const trayX = box.x - padX;
  const trayY = box.y - padY;
  const trayW = box.w + padX * 2;
  const trayH = box.h + padY * 2;
  const radius = 24;

  ctx.save();
  // 1. Ambient drop shadow
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.restore();

  // 2. 3D Bottom Wood Rim
  ctx.save();
  ctx.translate(0, 4);
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.restore();

  // 3. Main Tray Inset Body
  ctx.fillStyle = designTokens.colors.surface[50];
  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(trayX, trayY, trayW, trayH, radius);
  ctx.fill();
  ctx.stroke();

  // 4. Subtle Top Highlight
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(trayX + radius, trayY + 4);
  ctx.lineTo(trayX + trayW - radius, trayY + 4);
  ctx.stroke();

  ctx.restore();
}

// ── Đoàn tàu & Đường ray gỗ (GT-006) ─────────────────────────────────
export function drawTrainRailway(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const y = box.y + box.h * 0.75;
  const left = box.x + 20;
  const right = box.x + box.w - 20;

  ctx.save();
  // Ray gỗ (Thanh tà vẹt)
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(left, y - 8);
  ctx.lineTo(right, y - 8);
  ctx.moveTo(left, y + 8);
  ctx.lineTo(right, y + 8);
  ctx.stroke();

  // Tà vẹt ngang
  ctx.lineWidth = 4;
  for (let x = left; x <= right; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y + 16);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLocomotive(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  // Thân đầu tàu gỗ
  ctx.fillStyle = designTokens.colors.montessori.amber;
  ctx.strokeStyle = designTokens.colors.montessori.amberDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
  ctx.fill();
  ctx.stroke();

  // Ống khói
  ctx.fillStyle = designTokens.colors.montessori.coral;
  ctx.fillRect(x + w * 0.2, y - h * 0.85, w * 0.2, h * 0.4);

  // Khói trắng
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.85);
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y - h * 0.95, 8, 0, Math.PI * 2);
  ctx.arc(x + w * 0.38, y - h * 1.15, 12, 0, Math.PI * 2);
  ctx.fill();

  // Bánh xe
  ctx.fillStyle = designTokens.colors.montessori.woodBorder;
  ctx.beginPath();
  ctx.arc(x - w * 0.25, y + h * 0.5, 10, 0, Math.PI * 2);
  ctx.arc(x + w * 0.25, y + h * 0.5, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Bảng phương trình & thay thế biểu tượng (GT-010) ─────────────────
export function drawEquationTray(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  ctx.save();
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.16);
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

// ── Bướm đối xứng Montessori (GT-021) ────────────────────────────────
export function drawButterflyWingsBoard(
  ctx: CanvasRenderingContext2D,
  box: SceneBox
): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const w = box.w * 0.85;
  const h = box.h * 0.82;

  ctx.save();
  // Cánh bướm gỗ cắt hình đối xứng
  ctx.save();
  ctx.shadowColor = alpha(designTokens.colors.montessori.woodBorder, 0.18);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  // Cánh trái
  ctx.ellipse(
    cx - w * 0.24,
    cy - h * 0.18,
    w * 0.22,
    h * 0.28,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    cx - w * 0.22,
    cy + h * 0.22,
    w * 0.18,
    h * 0.22,
    0.3,
    0,
    Math.PI * 2
  );
  // Cánh phải
  ctx.ellipse(
    cx + w * 0.24,
    cy - h * 0.18,
    w * 0.22,
    h * 0.28,
    0.2,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    cx + w * 0.22,
    cy + h * 0.22,
    w * 0.18,
    h * 0.22,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = designTokens.colors.montessori.woodBevel;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Thân bướm gỗ sồi đậm
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.beginPath();
  ctx.roundRect(cx - 10, cy - h * 0.45, 20, h * 0.9, 10);
  ctx.fill();

  // Trục gương nét đứt ở giữa
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(cx, box.y + 10);
  ctx.lineTo(cx, box.y + box.h - 10);
  ctx.stroke();

  ctx.restore();
}

// ── Máy hát loa kèn phát âm thanh (GT-018) ───────────────────────────
export function drawGramophone(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  isPlaying: boolean
): void {
  const cx = slot.x;
  const cy = slot.y;
  const r = Math.min(slot.w, slot.h) / 2;

  ctx.save();
  // Đế gỗ cổ điển
  ctx.fillStyle = designTokens.colors.montessori.amberDark;
  ctx.strokeStyle = designTokens.colors.montessori.woodBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.45, cy + r * 0.1, r * 0.9, r * 0.4, 8);
  ctx.fill();
  ctx.stroke();

  // Loa kèn đồng thau Honey Amber
  const gen = getContextGeneration(ctx);
  let hornGrad = getCachedGradient(
    ctx,
    gen,
    PRIMITIVE_GRADIENTS.PARTY_HORN,
    slot.index
  );
  if (!hornGrad) {
    hornGrad = ctx.createRadialGradient(
      cx + r * 0.2,
      cy - r * 0.3,
      r * 0.1,
      cx,
      cy,
      r * 0.7
    );
    hornGrad.addColorStop(0, designTokens.colors.montessori.amberGlow);
    hornGrad.addColorStop(0.5, designTokens.colors.montessori.amber);
    hornGrad.addColorStop(1, designTokens.colors.montessori.amberDeep);
    setCachedGradient(
      ctx,
      gen,
      PRIMITIVE_GRADIENTS.PARTY_HORN,
      slot.index,
      hornGrad
    );
  }
  ctx.fillStyle = hornGrad;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.1);
  ctx.lineTo(cx - r * 0.2, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vành miệng loa
  ctx.beginPath();
  ctx.ellipse(
    cx + r * 0.48,
    cy - r * 0.32,
    r * 0.12,
    r * 0.25,
    0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Nốt nhạc bay ra khi đang phát âm
  if (isPlaying) {
    ctx.font = '22px "Noto Color Emoji", sans-serif';
    ctx.fillText("🎵", cx + r * 0.65, cy - r * 0.6);
    ctx.fillText("🎶", cx + r * 0.8, cy - r * 0.3);
  }
  ctx.restore();
}
