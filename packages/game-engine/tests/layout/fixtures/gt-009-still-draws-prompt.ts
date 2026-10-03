import { drawPromptText } from "#src/render/shared-render";
import type { RenderSystem } from "#src/systems/render-system";
import { GT009Session } from "#src/templates/GT-009/session";

/**
 * Ca âm của Task #283 N0: engine đã dời (`usesPromptZone = true`, nên shell vẽ
 * `drawPromptZone`) nhưng vẫn tự vẽ lời dẫn bằng `drawPromptText` không qua
 * nhánh dự phòng. Phép đếm nguồn lời dẫn phải báo hai nguồn trong một khung.
 */
export class GT009StillDrawsPromptSession extends GT009Session {
  override render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawPromptText(ctx, rs, this.content.prompt);
    super.render(ctx, rs, timeMs);
  }
}
