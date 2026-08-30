// Fixture vi phạm: toạ độ cứng truyền vào một hàm draw* KHÔNG nằm trong ba tên
// mà regex cũ biết (drawClayBody|drawClayContainer|drawScaffoldingHighlight).
import type { RenderSystem } from "#src/systems/render-system";

export function bad(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
  drawSlotItem(ctx, 480, 270);
  rs.drawClayBody(ctx, 100, 200, 30, "#fff", "#000");
}

declare function drawSlotItem(c: unknown, x: number, y: number): void;
