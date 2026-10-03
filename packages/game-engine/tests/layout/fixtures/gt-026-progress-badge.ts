import { drawProgressBadge } from "#src/render/shared-render";
import type { RenderSystem } from "#src/systems/render-system";
import { GT026Session } from "#src/templates/GT-026/session";

/**
 * Ca âm của Task #283 B2: engine vẫn vẽ huy hiệu tiến độ trên canvas, vi phạm
 * `BR-PSZ-06`. Phép đếm lần gọi `drawProgressBadge` phải báo.
 */
export class GT026ProgressBadgeSession extends GT026Session {
  override render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawProgressBadge(ctx, rs, 0, 1);
    super.render(ctx, rs, timeMs);
  }
}
