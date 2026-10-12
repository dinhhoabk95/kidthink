import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import { alpha } from "./color-utils.js";
import { canvasFontPx, type LogicSpace, spaceOf } from "./type-scale.js";

export function drawCheckMark(ctx: CanvasRenderingContext2D, slot: Slot): void {
  const r = Math.min(slot.w, slot.h) / 2;
  const badgeR = Math.max(12, r * 0.32);
  const cx = slot.x + r * 0.55;
  const cy = slot.y - r * 0.55;
  const arm = badgeR * 0.55;

  ctx.save();
  // Emerald circle badge
  ctx.fillStyle = designTokens.colors.montessori.emeraldBright;
  ctx.strokeStyle = designTokens.colors.montessori.emerald;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crisp white checkmark
  ctx.strokeStyle = designTokens.colors.surface[0];
  ctx.lineWidth = Math.max(2.5, badgeR * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - arm * 0.7, cy);
  ctx.lineTo(cx - arm * 0.1, cy + arm * 0.6);
  ctx.lineTo(cx + arm * 0.7, cy - arm * 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Ô đích rỗng — viền đứt, hốc chìm chờ trẻ thả vật vào. */
export function drawEmptyTargetSlot(
  ctx: CanvasRenderingContext2D,
  slot: Slot
): void {
  ctx.save();
  const r = Math.min(slot.w, slot.h) / 2;
  const radius = Math.max(12, r * 0.25);

  // 1. Soft recessed inner shadow (sunken wooden socket)
  ctx.save();
  ctx.fillStyle = designTokens.colors.surface[100];
  ctx.beginPath();
  ctx.roundRect(slot.x - r, slot.y - r, r * 2, r * 2, radius);
  ctx.fill();

  // Inset rim shadow
  ctx.strokeStyle = alpha(designTokens.colors.montessori.woodBorder, 0.25);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 2. Dashed warm honey amber guide border
  ctx.strokeStyle = designTokens.colors.montessori.amber;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(
    slot.x - r + 3,
    slot.y - r + 3,
    (r - 3) * 2,
    (r - 3) * 2,
    Math.max(10, r * 0.2)
  );
  ctx.stroke();
  ctx.restore();
}

export function drawSlotOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    slot.x - slot.hitW / 2,
    slot.y - slot.hitH / 2,
    slot.hitW,
    slot.hitH
  );
  ctx.restore();
}

/** Vòng viền tròn ôm ngoài slot (dùng cho khoanh chọn, highlight đích). */
export function drawCircleOutline(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  color: string,
  lineWidth = 4,
  padding = 4
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  const r = Math.min(slot.w, slot.h) / 2 + padding;
  ctx.beginPath();
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawLabelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color = designTokens.colors.surface[700]
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawCounterBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: number,
  total: number,
  space?: LogicSpace,
  scale?: number
): void {
  const fontPx = canvasFontPx(space ?? DEFAULT_LOGIC_SPACE, "badge", scale);
  const badgeRadius = Math.max(18, Math.round(fontPx * 1.15));
  ctx.save();
  ctx.fillStyle = designTokens.colors.brand[600];
  ctx.beginPath();
  ctx.arc(x, y, badgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = designTokens.colors.surface[0];
  ctx.font = `bold ${fontPx}px ${designTokens.fonts.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${current}/${total}`, x, y);
  ctx.restore();
}

/** Đồng hồ tiến độ ở góc trên phải — vị trí suy từ khung logic, không hằng số. */
export function drawProgressBadge(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  current: number,
  total: number
): void {
  const { space, scale } = spaceOf(rs);
  drawCounterBadge(ctx, rs.LOGIC_WIDTH - 44, 40, current, total, space, scale);
}

export function drawDividerLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.save();
  ctx.strokeStyle = designTokens.colors.surface[200];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawMatchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = designTokens.colors.semantic.success[500]
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  fill: string,
  border: string
): void {
  ctx.save();
  ctx.fillStyle = fill;
  const rx = slot.x - slot.hitW / 2;
  const ry = slot.y - slot.hitH / 2;
  ctx.fillRect(rx, ry, slot.hitW, slot.hitH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(rx, ry, slot.hitW, slot.hitH);
  ctx.restore();
}
