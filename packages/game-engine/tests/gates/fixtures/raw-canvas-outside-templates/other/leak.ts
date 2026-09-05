export function leakCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.fillRect(0, 0, 10, 10);
}
