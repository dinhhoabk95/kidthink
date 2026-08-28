import { StatefulGameSession } from "#src/game-session";

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
}
