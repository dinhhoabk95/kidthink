import { StatefulGameSession } from "#src/game-session";
import type { RenderSystem } from "#src/systems/render-system";

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
    _rs: RenderSystem,
    _timeMs: number
  ): void {
    ctx.fillRect(0, 0, 100, 100);
  }
}
