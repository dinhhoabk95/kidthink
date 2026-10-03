import { StatefulGameSession } from "#src/game-session";
import { drawPromptText } from "#src/render/shared-render";
import type { RenderSystem } from "#src/systems/render-system";

/** Ca âm của gate `zone-primitives-only`: vẽ lời dẫn không qua nhánh `!this.stageRect`. */
export class GT001Session extends StatefulGameSession {
  setupEntities(): void {
    // No entities in fixture
  }

  validateAction(): { valid: boolean; feedback: string } {
    return { valid: true, feedback: "" };
  }

  checkWinCondition(): boolean {
    return true;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawPromptText(ctx, rs, "Chọn đáp án");
  }
}
