import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha, readableTextOn } from "./color-utils.js";
import { resolveEmojiGlyph } from "./shared-render.js";
import { legibleFontPx } from "./type-scale.js";

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
  ctx.font = `bold ${fontPx}px ${designTokens.fonts.heading}`;
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
  box: ContainerBox,
  isHovered: boolean
): void {
  const radius = Math.max(box.w, box.h) * (isHovered ? 0.85 : 0.7);
  const gradient = ctx.createRadialGradient(
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
  gradient.addColorStop(1, alpha(designTokens.colors.montessori.amberLight, 0));

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

    ctx.font = `${Math.round(chipR * 1.6)}px "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
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
  ctx.font = `bold ${fontPx}px ${designTokens.fonts.heading}`;
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
  drawContainerAura(ctx, box, isHovered);
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
