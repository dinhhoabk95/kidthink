import { drawWoodenTokenDock } from "#src/render/shared-render";
import type { RenderSystem } from "#src/systems/render-system";
import { GT003Session } from "#src/templates/GT-003/session";

/**
 * Ca âm của `BR-PSZ-01` cho khay (Task #277 S5): session GT-003 vẽ khay gỗ ở
 * toạ độ cũ — gọi `drawWoodenTokenDock` không kèm rect nên dock rơi về 90% bề
 * ngang canvas, sát đáy — thay vì đúng `zones.tray` mà shell cấp. Phép kiểm
 * khay phải báo vi phạm.
 */
export class GT003OldCoordsTraySession extends GT003Session {
  override render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawWoodenTokenDock(ctx, rs);
  }
}
