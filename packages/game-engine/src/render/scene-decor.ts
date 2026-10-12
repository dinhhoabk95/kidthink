import { designTokens } from "#src/systems/designTokens";
import { alpha } from "./color-utils.js";

export function drawScenicCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
): void {
  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.68);
  ctx.beginPath();
  ctx.arc(cx, cy, 20 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy - 8 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 36 * scale, cy, 19 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy + 6 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

export function drawScenicBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.strokeStyle = alpha(designTokens.colors.surface[0], 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = alpha(designTokens.colors.surface[0], 0.55);
  ctx.beginPath();
  ctx.arc(
    cx - radius * 0.35,
    cy - radius * 0.35,
    radius * 0.28,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawScenicStars(
  ctx: CanvasRenderingContext2D,
  stars: readonly [number, number, number][]
): void {
  for (const s of stars) {
    if (!s) {
      continue;
    }
    const [sx, sy, sr] = s;
    ctx.fillStyle = alpha(designTokens.colors.semantic.warning[200], 0.65);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawScenicFlowerDots(
  ctx: CanvasRenderingContext2D,
  dots: readonly [number, number, string][]
): void {
  for (const d of dots) {
    if (!d) {
      continue;
    }
    const [dx, dy, color] = d;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
